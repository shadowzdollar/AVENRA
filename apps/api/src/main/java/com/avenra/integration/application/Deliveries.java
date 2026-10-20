package com.avenra.integration.application;

import com.avenra.audit.AuditLog;
import com.avenra.document.Documents;
import com.avenra.integration.IntegrationEvents;
import com.avenra.integration.IntegrationProperties;
import com.avenra.integration.domain.EventType;
import com.avenra.integration.domain.Outcome;
import com.avenra.integration.domain.Provider;
import com.avenra.integration.domain.Settings;
import com.avenra.integration.infrastructure.IntegrationRepository;
import com.avenra.integration.infrastructure.IntegrationRepository.ConnectionRow;
import com.avenra.integration.infrastructure.IntegrationRepository.DeliveryRow;
import com.avenra.integration.infrastructure.StorageExporter;
import com.avenra.integration.infrastructure.WebhookSender;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.jobs.JobWorker;
import com.avenra.verification.Verification;
import io.micrometer.core.instrument.MeterRegistry;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Records and delivers integration events (ADR-034). Every method runs inside the caller's or the
 * job's transaction. A delivery is recorded once per event and
 * connection, sent by a job, retried with backoff while the failure is passing, and a connection
 * that keeps failing is paused and announced.
 */
@Configuration(proxyBeanMethods = false)
class Deliveries {

    static final String FANOUT = "integration.fanout";
    static final String DELIVER = "integration.deliver";

    private final IntegrationRepository repository;
    private final JobQueue jobs;
    private final JsonMapper json;
    private final Clock clock;

    Deliveries(IntegrationRepository repository, JobQueue jobs, JsonMapper json, Clock clock) {
        this.repository = repository;
        this.jobs = jobs;
        this.json = json;
        this.clock = clock;
    }

    /** Queues an event for fan-out in the organization's scope; safe in any scope that may enqueue. */
    void publish(IntegrationEvent event) {
        jobs.enqueue(
                JobQueue.Request.of(FANOUT, event.organizationId(), Map.of("event", json.writeValueAsString(event)))
                        .idempotencyKey("fanout:" + event.id()));
    }

    /** Records the event for one connection and schedules its delivery. */
    DeliveryRow record(ConnectionRow connection, IntegrationEvent event) {
        var row = new DeliveryRow(
                UUID.randomUUID(),
                connection.organizationId(),
                connection.id(),
                event.id(),
                event.type(),
                json.writeValueAsString(event),
                "PENDING",
                0,
                null,
                null,
                OffsetDateTime.now(clock),
                null);
        if (repository.insertDelivery(row)) {
            schedule(connection.organizationId(), row.id());
        }
        return row;
    }

    void schedule(UUID organizationId, UUID deliveryId) {
        jobs.enqueue(JobQueue.Request.of(DELIVER, organizationId, Map.of("deliveryId", deliveryId))
                .idempotencyKey("deliver:" + deliveryId + ":" + UUID.randomUUID()));
    }

    @Bean
    JobHandler integrationFanout() {
        return JobHandler.of(FANOUT, job -> {
            var event = json.readValue(JobWorker.text(job.payload(), "event"), IntegrationEvent.class);
            for (var connection : repository.subscribed(job.organizationId(), event.type())) {
                if (connection.provider().can(Provider.Capability.EVENTS_DELIVER)) {
                    record(connection, event);
                }
            }
            if (event.type().equals(EventType.WORK_COMPLETED.code())) {
                for (var connection : repository.active(job.organizationId(), Provider.S3_EXPORT)) {
                    record(connection, event);
                }
            }
        });
    }

    @Bean
    JobHandler integrationDeliver(
            Credentials credentials,
            WebhookSender webhooks,
            StorageExporter storage,
            Verification verification,
            Documents documents,
            IntegrationProperties properties,
            ApplicationEventPublisher events,
            AuditLog audit,
            MeterRegistry meters) {
        return JobHandler.of(DELIVER, job -> {
            UUID deliveryId = UUID.fromString(JobWorker.text(job.payload(), "deliveryId"));
            var delivery = repository.findDeliveryForUpdate(deliveryId).orElse(null);
            if (delivery == null || !delivery.status().equals("PENDING")) {
                return;
            }
            var connection = repository
                    .findForUpdate(delivery.organizationId(), delivery.connectionId())
                    .orElse(null);
            if (connection == null || connection.status().equals("REVOKED")) {
                repository.updateDelivery(
                        delivery.id(), "FAILED", delivery.attempts(), null, "The connection was revoked.", null);
                return;
            }
            if (connection.status().equals("PAUSED")) {
                return; // waits; resuming the connection schedules it again
            }
            int attempts = delivery.attempts() + 1;
            Outcome outcome = switch (connection.provider()) {
                case WEBHOOK ->
                    webhooks.send(
                            settings(connection).url(),
                            credentials.signingSecret(connection),
                            delivery.eventId(),
                            delivery.eventType(),
                            delivery.payload());
                case S3_EXPORT -> export(connection, delivery, credentials, storage, verification, documents);
            };
            OffsetDateTime now = OffsetDateTime.now(clock);
            meters.counter(
                            "avenra.integration.deliveries",
                            "provider",
                            connection.provider().name(),
                            "outcome",
                            outcome.delivered() ? "DELIVERED" : outcome.retryable() ? "RETRY" : "FAILED")
                    .increment();
            if (outcome.delivered()) {
                repository.updateDelivery(delivery.id(), "DELIVERED", attempts, outcome.statusCode(), null, now);
                repository.recordOutcome(connection.id(), true, now);
                return;
            }
            if (outcome.retryable() && attempts < properties.maxAttempts()) {
                repository.updateDelivery(
                        delivery.id(), "PENDING", attempts, outcome.statusCode(), outcome.error(), null);
                jobs.enqueue(
                        JobQueue.Request.of(DELIVER, delivery.organizationId(), Map.of("deliveryId", delivery.id()))
                                .idempotencyKey("deliver:" + delivery.id() + ":" + attempts)
                                .delay(backoff(properties, attempts)));
                return;
            }
            repository.updateDelivery(delivery.id(), "FAILED", attempts, outcome.statusCode(), outcome.error(), null);
            int failures = repository.recordOutcome(connection.id(), false, now);
            if (failures >= properties.pauseAfter() && !delivery.eventType().equals(EventType.TEST.code())) {
                repository.pause(connection.id(), now);
                audit.record(AuditLog.Event.of("integration.connection.paused", connection.organizationId(), null)
                        .resource("integration_connection", connection.id())
                        .detail("consecutiveFailures", failures));
                events.publishEvent(new IntegrationEvents.ConnectionPaused(
                        connection.organizationId(), connection.id(), connection.name(), failures));
            }
        });
    }

    /** Exports the sealed manifest and the accepted documents of the completed work. */
    private Outcome export(
            ConnectionRow connection,
            DeliveryRow delivery,
            Credentials credentials,
            StorageExporter storage,
            Verification verification,
            Documents documents) {
        JsonNode event = json.readTree(delivery.payload());
        if (delivery.eventType().equals(EventType.TEST.code())) {
            byte[] test = ("Avenra test export " + delivery.eventId() + "\n").getBytes(StandardCharsets.UTF_8);
            var keys = keys(credentials, connection);
            return storage.export(
                    settings(connection),
                    keys.accessKey(),
                    keys.secretKey(),
                    List.of(item("avenra-test-" + delivery.eventId() + ".txt", "text/plain", test)));
        }
        UUID workId = UUID.fromString(event.path("data").path("workId").asString());
        var sealed =
                verification.completion(connection.organizationId(), workId).orElse(null);
        if (sealed == null) {
            return Outcome.fail(null, "The completed work has no sealed manifest.");
        }
        var items = new ArrayList<StorageExporter.Item>();
        items.add(item(
                workId + "/manifest.json", "application/json", sealed.manifest().getBytes(StandardCharsets.UTF_8)));
        for (JsonNode requirement : json.readTree(sealed.manifest()).path("requirements")) {
            JsonNode answer = requirement.path("answer");
            if (!requirement.path("state").asString().equals("ACCEPTED") || !answer.has("documentId")) {
                continue;
            }
            UUID documentId = UUID.fromString(answer.path("documentId").asString());
            int version = answer.path("documentVersion").asInt();
            var stored = documents.versions(List.of(documentId)).stream()
                    .filter(candidate -> candidate.version() == version && candidate.clean())
                    .findFirst()
                    .orElse(null);
            if (stored == null) {
                return Outcome.fail(null, "An accepted document is no longer available.");
            }
            String key = workId + "/documents/" + documentId + "-v" + version + "-" + safe(stored.fileName());
            items.add(new StorageExporter.Item(
                    key,
                    stored.contentType(),
                    () -> documents
                            .open(connection.organizationId(), documentId, version)
                            .content(),
                    stored.sizeBytes(),
                    stored.sha256Hex()));
        }
        var keys = keys(credentials, connection);
        return storage.export(settings(connection), keys.accessKey(), keys.secretKey(), items);
    }

    private Credentials.StorageKeys keys(Credentials credentials, ConnectionRow connection) {
        return credentials.storageKeys(connection);
    }

    private Settings settings(ConnectionRow connection) {
        return json.readValue(connection.settings(), Settings.class);
    }

    private static StorageExporter.Item item(String key, String type, byte[] content) {
        return new StorageExporter.Item(
                key, type, () -> new ByteArrayInputStream(content), content.length, sha256(content));
    }

    /** File names keep letters, digits, dots, dashes and underscores; anything else becomes a dash. */
    static String safe(@Nullable String fileName) {
        String name = fileName == null ? "file" : fileName.replaceAll("[^A-Za-z0-9._-]", "-");
        return name.isEmpty() || name.startsWith(".") ? "file" + name : name;
    }

    static Duration backoff(IntegrationProperties properties, int attempts) {
        Duration delay = properties.firstRetry().multipliedBy(1L << Math.min(attempts - 1, 20));
        return delay.compareTo(properties.maxRetry()) > 0 ? properties.maxRetry() : delay;
    }

    private static String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
