package com.avenra.work.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.Client;
import com.avenra.contract.v1.model.ClientInput;
import com.avenra.contract.v1.model.Project;
import com.avenra.contract.v1.model.ProjectInput;
import com.avenra.identity.UserDirectory;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.web.ApiException;
import com.avenra.work.infrastructure.ClientRepository;
import com.avenra.work.infrastructure.ClientRepository.ClientRow;
import com.avenra.work.infrastructure.ClientRepository.ProjectRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

/** The organization's clients and projects. */
@Service
public class ClientService {

    private final ClientRepository repository;
    private final OrganizationAccess access;
    private final Idempotency idempotency;
    private final AuditLog audit;
    private final Clock clock;

    ClientService(
            ClientRepository repository,
            OrganizationAccess access,
            Idempotency idempotency,
            AuditLog audit,
            Clock clock) {
        this.repository = repository;
        this.access = access;
        this.idempotency = idempotency;
        this.audit = audit;
        this.clock = clock;
    }

    public List<Client> listClients(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> repository.listClients(organizationId).stream()
                        .map(WorkViews::client)
                        .toList());
    }

    public Client getClient(UUID userId, UUID organizationId, UUID clientId) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> WorkViews.client(
                        repository.findClient(organizationId, clientId).orElseThrow(ApiException::notFound)));
    }

    public Client createClient(UUID userId, UUID organizationId, String idempotencyKey, ClientInput input) {
        var name = Text.required(input.getName(), "name");
        var email = email(input.getEmail());
        var reference = Text.optional(input.getReference());
        return access.run(
                userId,
                organizationId,
                Permission.WORK_CREATE,
                granted -> idempotency.once(
                        userId,
                        "createClient",
                        idempotencyKey,
                        Text.fingerprint(organizationId, name, email, reference),
                        Client.class,
                        () -> {
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var row =
                                    new ClientRow(UUID.randomUUID(), organizationId, name, email, reference, now, now);
                            repository.insertClient(row, userId);
                            audit.record(AuditLog.Event.of("work.client.created", organizationId, userId)
                                    .resource("client", row.id()));
                            return WorkViews.client(row);
                        }));
    }

    public Client updateClient(UUID userId, UUID organizationId, UUID clientId, ClientInput input) {
        var name = Text.required(input.getName(), "name");
        var email = email(input.getEmail());
        var reference = Text.optional(input.getReference());
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            OffsetDateTime now = OffsetDateTime.now(clock);
            if (!repository.updateClient(organizationId, clientId, name, email, reference, now)) {
                throw ApiException.notFound();
            }
            audit.record(AuditLog.Event.of("work.client.updated", organizationId, userId)
                    .resource("client", clientId));
            return WorkViews.client(
                    repository.findClient(organizationId, clientId).orElseThrow(ApiException::notFound));
        });
    }

    public List<Project> listProjects(UUID userId, UUID organizationId, @Nullable UUID clientId) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> repository.listProjects(organizationId, clientId).stream()
                        .map(WorkViews::project)
                        .toList());
    }

    public Project getProject(UUID userId, UUID organizationId, UUID projectId) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> WorkViews.project(
                        repository.findProject(organizationId, projectId).orElseThrow(ApiException::notFound)));
    }

    public Project createProject(UUID userId, UUID organizationId, String idempotencyKey, ProjectInput input) {
        var name = Text.required(input.getName(), "name");
        var description = Text.optional(input.getDescription());
        UUID clientId = input.getClientId();
        return access.run(
                userId,
                organizationId,
                Permission.WORK_CREATE,
                granted -> idempotency.once(
                        userId,
                        "createProject",
                        idempotencyKey,
                        Text.fingerprint(organizationId, name, clientId, description),
                        Project.class,
                        () -> {
                            requireClient(organizationId, clientId);
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var row = new ProjectRow(
                                    UUID.randomUUID(), organizationId, clientId, name, description, now, now);
                            repository.insertProject(row, userId);
                            audit.record(AuditLog.Event.of("work.project.created", organizationId, userId)
                                    .resource("project", row.id()));
                            return WorkViews.project(row);
                        }));
    }

    public Project updateProject(UUID userId, UUID organizationId, UUID projectId, ProjectInput input) {
        var name = Text.required(input.getName(), "name");
        var description = Text.optional(input.getDescription());
        UUID clientId = input.getClientId();
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            requireClient(organizationId, clientId);
            if (!repository.updateProject(
                    organizationId, projectId, name, clientId, description, OffsetDateTime.now(clock))) {
                throw ApiException.notFound();
            }
            audit.record(AuditLog.Event.of("work.project.updated", organizationId, userId)
                    .resource("project", projectId));
            return WorkViews.project(
                    repository.findProject(organizationId, projectId).orElseThrow(ApiException::notFound));
        });
    }

    /** A referenced client must exist in the same organization. Must run inside the tenant transaction. */
    void requireClient(UUID organizationId, @Nullable UUID clientId) {
        if (clientId != null && repository.findClient(organizationId, clientId).isEmpty()) {
            throw ApiException.invalid("clientId", "no such client");
        }
    }

    void requireProject(UUID organizationId, @Nullable UUID projectId, @Nullable UUID clientId) {
        if (projectId == null) {
            return;
        }
        var project = repository
                .findProject(organizationId, projectId)
                .orElseThrow(() -> ApiException.invalid("projectId", "no such project"));
        if (clientId != null
                && project.clientId() != null
                && !project.clientId().equals(clientId)) {
            throw ApiException.invalid("clientId", "does not match the project's client");
        }
    }

    private static @Nullable String email(@Nullable String raw) {
        return raw == null || raw.isBlank() ? null : UserDirectory.normalizeEmail(raw);
    }
}
