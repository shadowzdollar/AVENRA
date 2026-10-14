package com.avenra.work.infrastructure;

import com.avenra.work.domain.ExecutionStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Execution records (ADR-023). Status changes are checked by the caller against the state machine. */
@Repository
public class ExecutionRepository {

    public record ExecutionRow(
            UUID id,
            UUID organizationId,
            UUID workId,
            @Nullable String stepType,
            @Nullable UUID stepId,
            String actorType,
            @Nullable UUID actorUserId,
            @Nullable String actorRule,
            String action,
            @Nullable String target,
            @Nullable String inputReference,
            ExecutionStatus status,
            Map<String, String> result,
            @Nullable String error,
            int retryCount,
            @Nullable UUID jobId,
            @Nullable String idempotencyKey,
            OffsetDateTime createdAt,
            @Nullable OffsetDateTime startedAt,
            @Nullable OffsetDateTime completedAt) {}

    private static final String COLUMNS = "id, organization_id, work_id, step_type, step_id, actor_type, actor_user_id,"
            + " actor_rule, action, target, input_reference, status, coalesce(result::text, '{}') as result, error,"
            + " retry_count, job_id, idempotency_key, created_at, started_at, completed_at";
    private static final TypeReference<Map<String, String>> MAP = new TypeReference<>() {};

    private final JdbcClient jdbc;
    private final JsonMapper json;

    ExecutionRepository(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    /** @return false when an execution with the same action and idempotency key exists */
    public boolean insert(ExecutionRow row) {
        return jdbc.sql("""
                                insert into executions (id, organization_id, work_id, step_type, step_id, actor_type,
                                    actor_user_id, actor_rule, action, target, input_reference, status, result, error,
                                    retry_count, job_id, idempotency_key, created_at, started_at, completed_at, updated_at)
                                values (:id, :org, :work, :stepType, :stepId, :actorType, :user, :rule, :action, :target,
                                    :input, :status, cast(:result as jsonb), :error, :retries, :job, :key, :created,
                                    :started, :completed, :created)
                                on conflict (organization_id, action, idempotency_key) where idempotency_key is not null
                                do nothing
                                """)
                        .param("id", row.id())
                        .param("org", row.organizationId())
                        .param("work", row.workId())
                        .param("stepType", row.stepType())
                        .param("stepId", row.stepId())
                        .param("actorType", row.actorType())
                        .param("user", row.actorUserId())
                        .param("rule", row.actorRule())
                        .param("action", row.action())
                        .param("target", row.target())
                        .param("input", row.inputReference())
                        .param("status", row.status().name())
                        .param("result", json.writeValueAsString(row.result()))
                        .param("error", row.error())
                        .param("retries", row.retryCount())
                        .param("job", row.jobId())
                        .param("key", row.idempotencyKey())
                        .param("created", row.createdAt())
                        .param("started", row.startedAt())
                        .param("completed", row.completedAt())
                        .update()
                > 0;
    }

    public void update(
            UUID id,
            ExecutionStatus status,
            Map<String, String> result,
            @Nullable String error,
            @Nullable OffsetDateTime startedAt,
            @Nullable OffsetDateTime completedAt,
            OffsetDateTime now) {
        jdbc.sql("""
                        update executions set status = :status, result = cast(:result as jsonb), error = :error,
                                              started_at = :started, completed_at = :completed, updated_at = :now
                        where id = :id
                        """)
                .param("id", id)
                .param("status", status.name())
                .param("result", json.writeValueAsString(result))
                .param("error", error)
                .param("started", startedAt)
                .param("completed", completedAt)
                .param("now", now)
                .update();
    }

    public Optional<ExecutionRow> find(UUID id) {
        return jdbc.sql("select " + COLUMNS + " from executions where id = :id")
                .param("id", id)
                .query(this::map)
                .optional();
    }

    public List<ExecutionRow> forWork(UUID organizationId, UUID workId) {
        return jdbc.sql("select " + COLUMNS + " from executions where organization_id = :org and work_id = :work"
                        + " order by created_at desc, id limit 200")
                .param("org", organizationId)
                .param("work", workId)
                .query(this::map)
                .list();
    }

    private ExecutionRow map(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new ExecutionRow(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getObject("work_id", UUID.class),
                rs.getString("step_type"),
                rs.getObject("step_id", UUID.class),
                rs.getString("actor_type"),
                rs.getObject("actor_user_id", UUID.class),
                rs.getString("actor_rule"),
                rs.getString("action"),
                rs.getString("target"),
                rs.getString("input_reference"),
                ExecutionStatus.valueOf(rs.getString("status")),
                json.readValue(rs.getString("result"), MAP),
                rs.getString("error"),
                rs.getInt("retry_count"),
                rs.getObject("job_id", UUID.class),
                rs.getString("idempotency_key"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("started_at", OffsetDateTime.class),
                rs.getObject("completed_at", OffsetDateTime.class));
    }
}
