package com.avenra.integration.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.CreateIntegrationRequest;
import com.avenra.contract.v1.model.IntegrationCapability;
import com.avenra.contract.v1.model.IntegrationConnection;
import com.avenra.contract.v1.model.IntegrationCredentialsInput;
import com.avenra.contract.v1.model.IntegrationDelivery;
import com.avenra.contract.v1.model.IntegrationEventType;
import com.avenra.contract.v1.model.IntegrationProvider;
import com.avenra.contract.v1.model.IntegrationSecret;
import com.avenra.contract.v1.model.IntegrationSettings;
import com.avenra.contract.v1.model.IntegrationStatus;
import com.avenra.contract.v1.model.UpdateIntegrationRequest;
import com.avenra.integration.IntegrationProperties;
import com.avenra.integration.domain.AddressPolicy;
import com.avenra.integration.domain.EventType;
import com.avenra.integration.domain.Provider;
import com.avenra.integration.domain.Settings;
import com.avenra.integration.infrastructure.IntegrationRepository;
import com.avenra.integration.infrastructure.IntegrationRepository.ConnectionRow;
import com.avenra.integration.infrastructure.IntegrationRepository.DeliveryRow;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.web.ApiException;
import java.net.InetAddress;
import java.net.URI;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

/**
 * What people do with connections (ADR-034). Reading needs {@code integration.read}; every change
 * needs {@code integration.manage} and is audited. Secrets are sealed before they are stored and
 * returned only once, when Avenra generated them.
 */
@Service
@EnableConfigurationProperties(IntegrationProperties.class)
public class IntegrationService {

    private final IntegrationRepository repository;
    private final Credentials credentials;
    private final Deliveries deliveries;
    private final OrganizationAccess access;
    private final Idempotency idempotency;
    private final AuditLog audit;
    private final IntegrationProperties properties;
    private final JsonMapper json;
    private final Clock clock;

    IntegrationService(
            IntegrationRepository repository,
            Credentials credentials,
            Deliveries deliveries,
            OrganizationAccess access,
            Idempotency idempotency,
            AuditLog audit,
            IntegrationProperties properties,
            AvenraProperties platform,
            JsonMapper json,
            Clock clock) {
        if (properties.allowLoopbackHttp() && platform.environment() == AvenraProperties.Environment.PRODUCTION) {
            throw new IllegalStateException("avenra.integrations.allow-loopback-http is not allowed in production");
        }
        this.repository = repository;
        this.credentials = credentials;
        this.deliveries = deliveries;
        this.access = access;
        this.idempotency = idempotency;
        this.audit = audit;
        this.properties = properties;
        this.json = json;
        this.clock = clock;
    }

    public List<IntegrationConnection> list(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.INTEGRATION_READ,
                granted -> repository.connections(organizationId).stream()
                        .map(this::toApi)
                        .toList());
    }

    public IntegrationSecret create(UUID userId, UUID organizationId, String key, CreateIntegrationRequest input) {
        Provider provider = Provider.valueOf(input.getProvider().getValue());
        String name = input.getName().strip();
        Settings settings = settings(provider, input.getSettings());
        List<String> events = events(provider, input.getEvents());
        return access.run(
                userId,
                organizationId,
                Permission.INTEGRATION_MANAGE,
                granted -> idempotency.once(
                        userId,
                        "createIntegration",
                        key,
                        organizationId + "/" + provider + "/" + name + "/" + json.writeValueAsString(settings) + "/"
                                + events,
                        IntegrationSecret.class,
                        () -> {
                            UUID id = UUID.randomUUID();
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var secret = secretFor(provider, id, input.getCredentials());
                            repository.insert(
                                    new ConnectionRow(
                                            id,
                                            organizationId,
                                            provider,
                                            name,
                                            "ACTIVE",
                                            events,
                                            json.writeValueAsString(settings),
                                            secret.sealed().keyId(),
                                            secret.sealed().ciphertext(),
                                            secret.hint(),
                                            0,
                                            null,
                                            now,
                                            now),
                                    userId);
                            audit.record(AuditLog.Event.of("integration.connection.created", organizationId, userId)
                                    .resource("integration_connection", id)
                                    .detail("provider", provider.name()));
                            var created = new IntegrationSecret(
                                    toApi(repository.find(organizationId, id).orElseThrow()));
                            return secret.shownOnce() == null ? created : created.signingSecret(secret.shownOnce());
                        }));
    }

    public IntegrationConnection update(UUID userId, UUID organizationId, UUID id, UpdateIntegrationRequest input) {
        return access.run(userId, organizationId, Permission.INTEGRATION_MANAGE, granted -> {
            var row = live(organizationId, id);
            String name = input.getName() == null ? row.name() : input.getName().strip();
            // The generated model turns a missing list into an empty one: no events means "unchanged".
            List<String> events = input.getEvents() == null || input.getEvents().isEmpty()
                    ? row.events()
                    : events(row.provider(), input.getEvents());
            String status =
                    input.getStatus() == null ? row.status() : input.getStatus().getValue();
            repository.update(id, name, events, status, OffsetDateTime.now(clock));
            audit.record(AuditLog.Event.of("integration.connection.updated", organizationId, userId)
                    .resource("integration_connection", id)
                    .detail("status", status));
            if (status.equals("ACTIVE") && !row.status().equals("ACTIVE")) {
                // Resuming sends what waited while the connection was paused.
                repository
                        .pending(organizationId, id)
                        .forEach(delivery -> deliveries.schedule(organizationId, delivery));
            }
            return toApi(repository.find(organizationId, id).orElseThrow());
        });
    }

    public IntegrationSecret rotate(UUID userId, UUID organizationId, UUID id, IntegrationCredentialsInput input) {
        return access.run(userId, organizationId, Permission.INTEGRATION_MANAGE, granted -> {
            var row = live(organizationId, id);
            var secret = secretFor(row.provider(), id, input);
            repository.replaceCredentials(
                    id,
                    secret.sealed().keyId(),
                    secret.sealed().ciphertext(),
                    secret.hint(),
                    OffsetDateTime.now(clock));
            audit.record(AuditLog.Event.of("integration.credentials.rotated", organizationId, userId)
                    .resource("integration_connection", id));
            var rotated = new IntegrationSecret(
                    toApi(repository.find(organizationId, id).orElseThrow()));
            return secret.shownOnce() == null ? rotated : rotated.signingSecret(secret.shownOnce());
        });
    }

    public void revoke(UUID userId, UUID organizationId, UUID id) {
        access.runWithoutResult(userId, organizationId, Permission.INTEGRATION_MANAGE, granted -> {
            var row = repository.findForUpdate(organizationId, id).orElseThrow(ApiException::notFound);
            if (row.status().equals("REVOKED")) {
                return;
            }
            repository.revoke(id, OffsetDateTime.now(clock));
            audit.record(AuditLog.Event.of("integration.connection.revoked", organizationId, userId)
                    .resource("integration_connection", id));
        });
    }

    /** Sends a test event through a webhook, or writes a test object to storage, now. */
    public IntegrationDelivery test(UUID userId, UUID organizationId, UUID id) {
        return access.run(userId, organizationId, Permission.INTEGRATION_MANAGE, granted -> {
            var row = live(organizationId, id);
            var event = IntegrationEvent.of(
                    EventType.TEST,
                    organizationId,
                    OffsetDateTime.now(clock),
                    Map.of("connectionId", id.toString(), "message", "A test from Avenra."));
            var delivery = deliveries.record(row, event);
            audit.record(AuditLog.Event.of("integration.connection.tested", organizationId, userId)
                    .resource("integration_connection", id));
            return delivery(delivery);
        });
    }

    public List<IntegrationDelivery> deliveries(UUID userId, UUID organizationId, UUID id) {
        return access.run(userId, organizationId, Permission.INTEGRATION_READ, granted -> {
            repository.find(organizationId, id).orElseThrow(ApiException::notFound);
            return repository.deliveries(organizationId, id).stream()
                    .map(IntegrationService::delivery)
                    .toList();
        });
    }

    public IntegrationDelivery redeliver(UUID userId, UUID organizationId, UUID connectionId, UUID deliveryId) {
        return access.run(userId, organizationId, Permission.INTEGRATION_MANAGE, granted -> {
            live(organizationId, connectionId);
            var row = repository
                    .findDelivery(organizationId, connectionId, deliveryId)
                    .orElseThrow(ApiException::notFound);
            repository.updateDelivery(row.id(), "PENDING", 0, row.lastStatusCode(), row.lastError(), null);
            deliveries.schedule(organizationId, row.id());
            audit.record(AuditLog.Event.of("integration.delivery.redelivered", organizationId, userId)
                    .resource("integration_delivery", row.id()));
            return delivery(repository
                    .findDelivery(organizationId, connectionId, deliveryId)
                    .orElseThrow());
        });
    }

    private ConnectionRow live(UUID organizationId, UUID id) {
        var row = repository.findForUpdate(organizationId, id).orElseThrow(ApiException::notFound);
        if (row.status().equals("REVOKED")) {
            throw ApiException.notFound();
        }
        return row;
    }

    private Credentials.Created secretFor(
            Provider provider, UUID connectionId, @Nullable IntegrationCredentialsInput input) {
        return switch (provider) {
            case WEBHOOK -> {
                if (input != null && (input.getAccessKey() != null || input.getSecretKey() != null)) {
                    throw ApiException.invalid("credentials", "webhooks use a secret generated by Avenra");
                }
                yield credentials.newSigningSecret(connectionId);
            }
            case S3_EXPORT -> {
                if (input == null || blank(input.getAccessKey()) || blank(input.getSecretKey())) {
                    throw ApiException.invalid("credentials", "an access key and a secret key are required");
                }
                yield credentials.storageKeys(
                        connectionId,
                        input.getAccessKey().strip(),
                        input.getSecretKey().strip());
            }
        };
    }

    private Settings settings(Provider provider, IntegrationSettings input) {
        return switch (provider) {
            case WEBHOOK -> {
                if (blank(input.getUrl())) {
                    throw ApiException.invalid("settings.url", "is required");
                }
                if (input.getEndpoint() != null || input.getBucket() != null || input.getPrefix() != null) {
                    throw ApiException.invalid("settings", "storage settings do not belong to a webhook");
                }
                checkAddress(input.getUrl());
                yield new Settings(input.getUrl(), null, null, null, null, null);
            }
            case S3_EXPORT -> {
                if (blank(input.getBucket()) || !input.getBucket().matches("[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]")) {
                    throw ApiException.invalid("settings.bucket", "must be a valid bucket name");
                }
                if (input.getUrl() != null) {
                    throw ApiException.invalid("settings.url", "does not belong to a storage export");
                }
                String endpoint =
                        input.getEndpoint() == null ? null : input.getEndpoint().toString();
                if (endpoint != null) {
                    checkAddress(endpoint);
                }
                String prefix = input.getPrefix() == null
                        ? "avenra/"
                        : input.getPrefix().strip();
                if (prefix.contains("..")) {
                    throw ApiException.invalid("settings.prefix", "must not contain ..");
                }
                yield new Settings(
                        null,
                        endpoint,
                        blank(input.getRegion())
                                ? "us-east-1"
                                : input.getRegion().strip(),
                        input.getBucket(),
                        prefix,
                        Boolean.TRUE.equals(input.getPathStyle()));
            }
        };
    }

    private void checkAddress(String address) {
        try {
            AddressPolicy.check(URI.create(address), properties.allowLoopbackHttp(), InetAddress::getAllByName);
        } catch (AddressPolicy.AddressRefused refused) {
            throw new ApiException("INTEGRATION_ADDRESS_REFUSED", HttpStatus.BAD_REQUEST, refused.getMessage());
        } catch (IllegalArgumentException malformed) {
            throw ApiException.invalid("settings", "the address is not valid");
        }
    }

    private static List<String> events(Provider provider, @Nullable List<IntegrationEventType> requested) {
        if (provider == Provider.S3_EXPORT) {
            // A storage export always files completed work; it subscribes to nothing else.
            return List.of(EventType.WORK_COMPLETED.code());
        }
        if (requested == null || requested.isEmpty()) {
            throw ApiException.invalid("events", "choose at least one event to send");
        }
        var events = new LinkedHashSet<String>();
        requested.forEach(type -> events.add(type.getValue()));
        return new ArrayList<>(events);
    }

    private IntegrationConnection toApi(ConnectionRow row) {
        var settings = json.readValue(row.settings(), Settings.class);
        var api = new IntegrationSettings();
        api.url(settings.url())
                .endpoint(settings.endpoint())
                .region(settings.region())
                .bucket(settings.bucket())
                .prefix(settings.prefix())
                .pathStyle(settings.pathStyle());
        return new IntegrationConnection(
                        row.id(),
                        IntegrationProvider.fromValue(row.provider().name()),
                        row.name(),
                        IntegrationStatus.fromValue(row.status()),
                        row.provider().capabilities().stream()
                                .map(capability -> IntegrationCapability.fromValue(capability.code()))
                                .toList(),
                        row.events().stream()
                                .map(IntegrationEventType::fromValue)
                                .toList(),
                        api,
                        row.consecutiveFailures(),
                        utc(row.createdAt()),
                        utc(row.updatedAt()))
                .credentialHint(row.credentialHint())
                .lastDeliveryAt(row.lastDeliveryAt() == null ? null : utc(row.lastDeliveryAt()));
    }

    static IntegrationDelivery delivery(DeliveryRow row) {
        return new IntegrationDelivery(
                        row.id(),
                        row.eventId(),
                        row.eventType(),
                        IntegrationDelivery.StatusEnum.fromValue(row.status()),
                        row.attempts(),
                        utc(row.createdAt()))
                .lastStatusCode(row.lastStatusCode())
                .lastError(row.lastError())
                .deliveredAt(row.deliveredAt() == null ? null : utc(row.deliveredAt()));
    }

    private static OffsetDateTime utc(OffsetDateTime value) {
        return value.withOffsetSameInstant(ZoneOffset.UTC);
    }

    private static boolean blank(@Nullable String value) {
        return value == null || value.isBlank();
    }
}
