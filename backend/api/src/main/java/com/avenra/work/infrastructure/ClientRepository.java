package com.avenra.work.infrastructure;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Clients and projects of an organization. */
@Repository
public class ClientRepository {

    public record ClientRow(
            UUID id,
            UUID organizationId,
            String name,
            @Nullable String email,
            @Nullable String reference,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {}

    public record ProjectRow(
            UUID id,
            UUID organizationId,
            @Nullable UUID clientId,
            String name,
            @Nullable String description,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {}

    private static final String CLIENT = "id, organization_id, name, email, reference, created_at, updated_at";
    private static final String PROJECT = "id, organization_id, client_id, name, description, created_at, updated_at";

    private final JdbcClient jdbc;

    ClientRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insertClient(ClientRow row, UUID createdBy) {
        jdbc.sql("""
                        insert into clients (id, organization_id, name, email, reference, created_by, created_at, updated_at)
                        values (:id, :org, :name, :email, :reference, :by, :created, :updated)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("name", row.name())
                .param("email", row.email())
                .param("reference", row.reference())
                .param("by", createdBy)
                .param("created", row.createdAt())
                .param("updated", row.updatedAt())
                .update();
    }

    public boolean updateClient(
            UUID organizationId,
            UUID id,
            String name,
            @Nullable String email,
            @Nullable String reference,
            OffsetDateTime now) {
        return jdbc.sql("""
                                update clients set name = :name, email = :email, reference = :reference, updated_at = :now
                                where organization_id = :org and id = :id
                                """)
                        .param("org", organizationId)
                        .param("id", id)
                        .param("name", name)
                        .param("email", email)
                        .param("reference", reference)
                        .param("now", now)
                        .update()
                > 0;
    }

    public Optional<ClientRow> findClient(UUID organizationId, UUID id) {
        return jdbc.sql("select " + CLIENT + " from clients where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", id)
                .query(ClientRow.class)
                .optional();
    }

    public List<ClientRow> listClients(UUID organizationId) {
        return jdbc.sql("select " + CLIENT + " from clients where organization_id = :org order by lower(name), id")
                .param("org", organizationId)
                .query(ClientRow.class)
                .list();
    }

    public void insertProject(ProjectRow row, UUID createdBy) {
        jdbc.sql("""
                        insert into projects (id, organization_id, client_id, name, description, created_by, created_at,
                                              updated_at)
                        values (:id, :org, :client, :name, :description, :by, :created, :updated)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("client", row.clientId())
                .param("name", row.name())
                .param("description", row.description())
                .param("by", createdBy)
                .param("created", row.createdAt())
                .param("updated", row.updatedAt())
                .update();
    }

    public boolean updateProject(
            UUID organizationId,
            UUID id,
            String name,
            @Nullable UUID clientId,
            @Nullable String description,
            OffsetDateTime now) {
        return jdbc.sql("""
                                update projects set name = :name, client_id = :client, description = :description,
                                                    updated_at = :now
                                where organization_id = :org and id = :id
                                """)
                        .param("org", organizationId)
                        .param("id", id)
                        .param("name", name)
                        .param("client", clientId)
                        .param("description", description)
                        .param("now", now)
                        .update()
                > 0;
    }

    public Optional<ProjectRow> findProject(UUID organizationId, UUID id) {
        return jdbc.sql("select " + PROJECT + " from projects where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", id)
                .query(ProjectRow.class)
                .optional();
    }

    public List<ProjectRow> listProjects(UUID organizationId, @Nullable UUID clientId) {
        return jdbc.sql("select " + PROJECT + """
                         from projects
                        where organization_id = :org and (cast(:client as uuid) is null or client_id = :client)
                        order by created_at desc, id
                        """)
                .param("org", organizationId)
                .param("client", clientId)
                .query(ProjectRow.class)
                .list();
    }
}
