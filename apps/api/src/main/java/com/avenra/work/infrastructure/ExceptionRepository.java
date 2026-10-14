package com.avenra.work.infrastructure;

import com.avenra.work.domain.ExceptionStatus;
import com.avenra.work.domain.ExceptionType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Business exceptions (ADR-024). At most one open exception exists per type and source. */
@Repository
public class ExceptionRepository {

    public record ExceptionRow(
            UUID id,
            UUID organizationId,
            @Nullable UUID workId,
            ExceptionType type,
            ExceptionType.Severity severity,
            String description,
            String sourceType,
            String sourceId,
            ExceptionStatus status,
            @Nullable UUID assigneeMembershipId,
            @Nullable String resolution,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            @Nullable OffsetDateTime resolvedAt,
            @Nullable UUID resolvedBy) {}

    public record Filter(
            @Nullable ExceptionStatus status, @Nullable UUID workId, boolean openOnly) {}

    private static final String COLUMNS = "id, organization_id, work_id, type, severity, description, source_type,"
            + " source_id, status, assignee_membership_id, resolution, created_at, updated_at, resolved_at, resolved_by";

    private final JdbcClient jdbc;

    ExceptionRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** @return false when an open exception for the same type and source already exists */
    public boolean raise(ExceptionRow row) {
        return jdbc.sql("""
                                insert into work_exceptions (id, organization_id, work_id, type, severity, description,
                                    source_type, source_id, status, created_at, updated_at)
                                values (:id, :org, :work, :type, :severity, :description, :sourceType, :sourceId,
                                    'OPEN', :now, :now)
                                on conflict (organization_id, type, source_type, source_id)
                                    where status not in ('RESOLVED', 'DISMISSED')
                                do nothing
                                """)
                        .param("id", row.id())
                        .param("org", row.organizationId())
                        .param("work", row.workId())
                        .param("type", row.type().name())
                        .param("severity", row.severity().name())
                        .param("description", row.description())
                        .param("sourceType", row.sourceType())
                        .param("sourceId", row.sourceId())
                        .param("now", row.createdAt())
                        .update()
                > 0;
    }

    public Optional<ExceptionRow> find(UUID organizationId, UUID id) {
        return jdbc.sql("select " + COLUMNS + " from work_exceptions where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", id)
                .query(ExceptionRow.class)
                .optional();
    }

    public Optional<ExceptionRow> findForUpdate(UUID organizationId, UUID id) {
        return jdbc.sql("select " + COLUMNS + " from work_exceptions where organization_id = :org and id = :id"
                        + " for update")
                .param("org", organizationId)
                .param("id", id)
                .query(ExceptionRow.class)
                .optional();
    }

    public List<ExceptionRow> list(UUID organizationId, Filter filter) {
        return jdbc.sql("select " + COLUMNS + """
                         from work_exceptions
                        where organization_id = :org
                          and (cast(:status as text) is null or status = :status)
                          and (cast(:work as uuid) is null or work_id = :work)
                          and (not :open or status not in ('RESOLVED', 'DISMISSED'))
                        order by created_at desc, id
                        limit 200
                        """)
                .param("org", organizationId)
                .param(
                        "status",
                        filter.status() == null ? null : filter.status().name())
                .param("work", filter.workId())
                .param("open", filter.openOnly())
                .query(ExceptionRow.class)
                .list();
    }

    public long openForWork(UUID organizationId, UUID workId) {
        return jdbc.sql("select count(*) from work_exceptions where organization_id = :org and work_id = :work"
                        + " and status not in ('RESOLVED', 'DISMISSED')")
                .param("org", organizationId)
                .param("work", workId)
                .query(Long.class)
                .single();
    }

    public java.util.Map<UUID, Long> openByWork(UUID organizationId, java.util.Collection<UUID> workIds) {
        if (workIds.isEmpty()) {
            return java.util.Map.of();
        }
        return jdbc
                .sql("""
                        select work_id, count(*) from work_exceptions
                        where organization_id = :org and work_id in (:works) and status not in ('RESOLVED', 'DISMISSED')
                        group by work_id
                        """)
                .param("org", organizationId)
                .param("works", workIds)
                .query((rs, row) -> java.util.Map.entry(rs.getObject(1, UUID.class), rs.getLong(2)))
                .list()
                .stream()
                .collect(java.util.stream.Collectors.toMap(java.util.Map.Entry::getKey, java.util.Map.Entry::getValue));
    }

    public void changeStatus(
            UUID id,
            ExceptionStatus status,
            @Nullable String resolution,
            @Nullable UUID resolvedBy,
            OffsetDateTime now) {
        jdbc.sql("""
                        update work_exceptions set status = :status, resolution = :resolution, resolved_by = :by,
                                                   resolved_at = :resolvedAt, updated_at = :now
                        where id = :id
                        """)
                .param("id", id)
                .param("status", status.name())
                .param("resolution", resolution)
                .param("by", resolvedBy)
                .param("resolvedAt", status.isFinal() ? now : null)
                .param("now", now)
                .update();
    }

    public void assign(UUID id, @Nullable UUID membershipId, OffsetDateTime now) {
        jdbc.sql("update work_exceptions set assignee_membership_id = :member, updated_at = :now where id = :id")
                .param("id", id)
                .param("member", membershipId)
                .param("now", now)
                .update();
    }
}
