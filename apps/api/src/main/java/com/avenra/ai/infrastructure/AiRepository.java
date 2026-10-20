package com.avenra.ai.infrastructure;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** AI settings and invocation records (ADR-030); every query runs under row-level security. */
@Repository
public class AiRepository {

    public record SettingsRow(
            boolean documentReading,
            boolean workPlanning,
            @Nullable UUID updatedBy,
            OffsetDateTime updatedAt) {}

    public record InvocationRow(
            UUID id,
            UUID organizationId,
            String purpose,
            @Nullable UUID subjectId,
            @Nullable Integer subjectVersion,
            @Nullable UUID actorUserId,
            String provider,
            String modelRequested,
            @Nullable String model,
            String promptName,
            int promptVersion,
            String promptSha256,
            int inputTokens,
            int outputTokens,
            int cacheReadTokens,
            int cacheWriteTokens,
            int latencyMs,
            @Nullable Long estimatedCostMicros,
            String outcome,
            @Nullable String errorCode,
            int attempt,
            @Nullable String traceId,
            OffsetDateTime createdAt) {}

    public record Totals(int calls, long inputTokens, long outputTokens, long estimatedCostMicros) {}

    private final JdbcClient jdbc;

    AiRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<SettingsRow> settings(UUID organizationId) {
        return jdbc.sql("""
                        select document_reading, work_planning, updated_by, updated_at from ai_settings
                        where organization_id = :org
                        """)
                .param("org", organizationId)
                .query((rs, row) -> new SettingsRow(
                        rs.getBoolean(1),
                        rs.getBoolean(2),
                        rs.getObject(3, UUID.class),
                        rs.getObject(4, OffsetDateTime.class)))
                .optional();
    }

    public void saveSettings(
            UUID organizationId, boolean documentReading, boolean workPlanning, UUID by, OffsetDateTime now) {
        jdbc.sql("""
                        insert into ai_settings (organization_id, document_reading, work_planning, updated_by, updated_at)
                        values (:org, :reading, :planning, :by, :now)
                        on conflict (organization_id) do update
                        set document_reading = excluded.document_reading, work_planning = excluded.work_planning,
                            updated_by = excluded.updated_by, updated_at = excluded.updated_at
                        """)
                .param("org", organizationId)
                .param("reading", documentReading)
                .param("planning", workPlanning)
                .param("by", by)
                .param("now", now)
                .update();
    }

    public void insertInvocation(InvocationRow row) {
        jdbc.sql("""
                        insert into ai_invocations (id, organization_id, purpose, subject_id, subject_version,
                            actor_user_id, provider, model_requested, model, prompt_name, prompt_version,
                            prompt_sha256, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                            latency_ms, estimated_cost_micros, outcome, error_code, attempt, trace_id, created_at)
                        values (:id, :org, :purpose, :subject, :subjectVersion, :actor, :provider, :modelRequested,
                            :model, :promptName, :promptVersion, :promptSha, :input, :output, :cacheRead, :cacheWrite,
                            :latency, :cost, :outcome, :error, :attempt, :trace, :now)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("purpose", row.purpose())
                .param("subject", row.subjectId())
                .param("subjectVersion", row.subjectVersion())
                .param("actor", row.actorUserId())
                .param("provider", row.provider())
                .param("modelRequested", row.modelRequested())
                .param("model", row.model())
                .param("promptName", row.promptName())
                .param("promptVersion", row.promptVersion())
                .param("promptSha", row.promptSha256())
                .param("input", row.inputTokens())
                .param("output", row.outputTokens())
                .param("cacheRead", row.cacheReadTokens())
                .param("cacheWrite", row.cacheWriteTokens())
                .param("latency", row.latencyMs())
                .param("cost", row.estimatedCostMicros())
                .param("outcome", row.outcome())
                .param("error", row.errorCode())
                .param("attempt", row.attempt())
                .param("trace", row.traceId())
                .param("now", row.createdAt())
                .update();
    }

    /** Calls since {@code since} (the start of the UTC day), for the daily limit and the usage view. */
    public Totals totalsSince(UUID organizationId, OffsetDateTime since) {
        return jdbc.sql("""
                        select count(*), coalesce(sum(input_tokens), 0), coalesce(sum(output_tokens), 0),
                               coalesce(sum(estimated_cost_micros), 0)
                        from ai_invocations where organization_id = :org and created_at >= :since
                        """)
                .param("org", organizationId)
                .param("since", since)
                .query((rs, row) -> new Totals(rs.getInt(1), rs.getLong(2), rs.getLong(3), rs.getLong(4)))
                .single();
    }

    public List<InvocationRow> latest(UUID organizationId, int limit) {
        return jdbc.sql("""
                        select id, organization_id, purpose, subject_id, subject_version, actor_user_id, provider,
                               model_requested, model, prompt_name, prompt_version, prompt_sha256, input_tokens,
                               output_tokens, cache_read_tokens, cache_write_tokens, latency_ms,
                               estimated_cost_micros, outcome, error_code, attempt, trace_id, created_at
                        from ai_invocations where organization_id = :org
                        order by created_at desc, id limit :limit
                        """)
                .param("org", organizationId)
                .param("limit", limit)
                .query((rs, row) -> new InvocationRow(
                        rs.getObject(1, UUID.class),
                        rs.getObject(2, UUID.class),
                        rs.getString(3),
                        rs.getObject(4, UUID.class),
                        (Integer) rs.getObject(5),
                        rs.getObject(6, UUID.class),
                        rs.getString(7),
                        rs.getString(8),
                        rs.getString(9),
                        rs.getString(10),
                        rs.getInt(11),
                        rs.getString(12),
                        rs.getInt(13),
                        rs.getInt(14),
                        rs.getInt(15),
                        rs.getInt(16),
                        rs.getInt(17),
                        (Long) rs.getObject(18),
                        rs.getString(19),
                        rs.getString(20),
                        rs.getInt(21),
                        rs.getString(22),
                        rs.getObject(23, OffsetDateTime.class)))
                .list();
    }
}
