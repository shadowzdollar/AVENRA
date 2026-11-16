package com.avenra.document.infrastructure;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Document readings (ADR-031); written by the system only, under row-level security. */
@Repository
public class ReadingRepository {

    public record ReadingRow(
            UUID id,
            UUID organizationId,
            UUID documentId,
            int version,
            String specHash,
            String spec,
            String status,
            @Nullable String reason,
            @Nullable String result,
            @Nullable UUID invocationId,
            OffsetDateTime createdAt,
            @Nullable OffsetDateTime completedAt) {}

    private static final String COLUMNS = """
            id, organization_id, document_id, version, spec_hash, spec::text, status, reason, result::text,
            invocation_id, created_at, completed_at""";

    private final JdbcClient jdbc;

    ReadingRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ReadingRow> find(UUID documentId, int version, String specHash) {
        return jdbc.sql("select " + COLUMNS + " from document_readings"
                        + " where document_id = :doc and version = :version and spec_hash = :hash")
                .param("doc", documentId)
                .param("version", version)
                .param("hash", specHash)
                .query(ReadingRepository::row)
                .optional();
    }

    public Optional<ReadingRow> findForUpdate(UUID id) {
        return jdbc.sql("select " + COLUMNS + " from document_readings where id = :id for update")
                .param("id", id)
                .query(ReadingRepository::row)
                .optional();
    }

    /** Creates a pending reading unless one exists for the version and spec; true when created. */
    public boolean insertPending(
            UUID id,
            UUID organizationId,
            UUID documentId,
            int version,
            String specHash,
            String spec,
            OffsetDateTime now) {
        return jdbc.sql("""
                        insert into document_readings (id, organization_id, document_id, version, spec_hash, spec,
                                                       status, created_at)
                        values (:id, :org, :doc, :version, :hash, cast(:spec as jsonb), 'PENDING', :now)
                        on conflict (document_id, version, spec_hash) do nothing
                        """)
                        .param("id", id)
                        .param("org", organizationId)
                        .param("doc", documentId)
                        .param("version", version)
                        .param("hash", specHash)
                        .param("spec", spec)
                        .param("now", now)
                        .update()
                == 1;
    }

    public void settle(
            UUID id,
            String status,
            @Nullable String reason,
            @Nullable String result,
            @Nullable UUID invocationId,
            OffsetDateTime now) {
        jdbc.sql("""
                        update document_readings
                        set status = :status, reason = :reason, result = cast(:result as jsonb),
                            invocation_id = :invocation, completed_at = :now
                        where id = :id
                        """)
                .param("id", id)
                .param("status", status)
                .param("reason", reason)
                .param("result", result)
                .param("invocation", invocationId)
                .param("now", now)
                .update();
    }

    /** The latest reading of each of the given versions, as {@code documentId/version}. */
    public List<ReadingRow> latest(Collection<UUID> documentIds) {
        if (documentIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("select distinct on (document_id, version) " + COLUMNS + " from document_readings"
                        + " where document_id in (:docs) order by document_id, version, created_at desc, id")
                .param("docs", documentIds)
                .query(ReadingRepository::row)
                .list();
    }

    private static ReadingRow row(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new ReadingRow(
                rs.getObject(1, UUID.class),
                rs.getObject(2, UUID.class),
                rs.getObject(3, UUID.class),
                rs.getInt(4),
                rs.getString(5),
                rs.getString(6),
                rs.getString(7),
                rs.getString(8),
                rs.getString(9),
                rs.getObject(10, UUID.class),
                rs.getObject(11, OffsetDateTime.class),
                rs.getObject(12, OffsetDateTime.class));
    }
}
