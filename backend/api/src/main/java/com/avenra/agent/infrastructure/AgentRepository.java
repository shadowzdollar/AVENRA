package com.avenra.agent.infrastructure;

import com.avenra.agent.domain.Budget;
import com.avenra.agent.domain.Risk;
import com.avenra.agent.domain.RunStatus;
import com.avenra.agent.domain.StepStatus;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Agent runs and steps (ADR-033); every query runs under row-level security. */
@Repository
public class AgentRepository {

    public record RunRow(
            UUID id,
            UUID organizationId,
            UUID workId,
            String capability,
            RunStatus status,
            UUID startedBy,
            List<String> allowedTools,
            @Nullable String summary,
            Budget budget,
            @Nullable String stopReason,
            @Nullable String traceId,
            OffsetDateTime createdAt,
            @Nullable OffsetDateTime finishedAt) {}

    public record StepRow(
            UUID id,
            UUID organizationId,
            UUID runId,
            int position,
            String tool,
            Risk risk,
            String input,
            @Nullable String reason,
            StepStatus status,
            @Nullable UUID approvedBy,
            @Nullable OffsetDateTime approvedAt,
            int attempts,
            @Nullable String result,
            @Nullable String error,
            @Nullable OffsetDateTime finishedAt) {}

    private static final String RUN_COLUMNS = """
            id, organization_id, work_id, capability, status, started_by, allowed_tools, summary,
            max_model_calls, max_tool_calls, max_side_effects, max_cost_micros, deadline,
            model_calls, tool_calls, side_effects, cost_micros, stop_reason, trace_id, created_at, finished_at""";

    private static final String STEP_COLUMNS = """
            id, organization_id, run_id, position, tool, risk, input::text, reason, status, approved_by,
            approved_at, attempts, result, error, finished_at""";

    private final JdbcClient jdbc;

    AgentRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insertRun(RunRow run, OffsetDateTime now) {
        Budget b = run.budget();
        jdbc.sql("""
                        insert into agent_runs (id, organization_id, work_id, capability, status, started_by,
                            allowed_tools, max_model_calls, max_tool_calls, max_side_effects, max_cost_micros,
                            deadline, trace_id, created_at, updated_at)
                        values (:id, :org, :work, :capability, :status, :by, :tools, :models, :toolCalls, :effects,
                            :cost, :deadline, :trace, :now, :now)
                        """)
                .param("id", run.id())
                .param("org", run.organizationId())
                .param("work", run.workId())
                .param("capability", run.capability())
                .param("status", run.status().name())
                .param("by", run.startedBy())
                .param("tools", run.allowedTools().toArray(String[]::new))
                .param("models", b.maxModelCalls())
                .param("toolCalls", b.maxToolCalls())
                .param("effects", b.maxSideEffects())
                .param("cost", b.maxCostMicros())
                .param("deadline", b.deadline())
                .param("trace", run.traceId())
                .param("now", now)
                .update();
    }

    /** Writes a run's state, counters and outcome. The caller has moved the status by its state machine. */
    public void updateRun(
            UUID id,
            RunStatus status,
            @Nullable String summary,
            Budget budget,
            @Nullable String stopReason,
            OffsetDateTime now) {
        jdbc.sql("""
                        update agent_runs set status = :status, summary = coalesce(:summary, summary),
                            model_calls = :models, tool_calls = :toolCalls, side_effects = :effects,
                            cost_micros = :cost, stop_reason = coalesce(:reason, stop_reason), updated_at = :now,
                            finished_at = case when :finished then :now else null end
                        where id = :id
                        """)
                .param("id", id)
                .param("status", status.name())
                .param("summary", summary)
                .param("models", budget.modelCalls())
                .param("toolCalls", budget.toolCalls())
                .param("effects", budget.sideEffects())
                .param("cost", budget.costMicros())
                .param("reason", stopReason)
                .param("finished", status.finished())
                .param("now", now)
                .update();
    }

    public Optional<RunRow> findRun(UUID organizationId, UUID workId, UUID runId) {
        return jdbc.sql("select " + RUN_COLUMNS
                        + " from agent_runs where organization_id = :org and work_id = :work and id = :id")
                .param("org", organizationId)
                .param("work", workId)
                .param("id", runId)
                .query(AgentRepository::run)
                .optional();
    }

    /** Locks the run: approvals, stops and steps of one run never interleave. */
    public Optional<RunRow> findRunForUpdate(UUID runId) {
        return jdbc.sql("select " + RUN_COLUMNS + " from agent_runs where id = :id for update")
                .param("id", runId)
                .query(AgentRepository::run)
                .optional();
    }

    public List<RunRow> runsOf(UUID organizationId, UUID workId) {
        return jdbc.sql("select " + RUN_COLUMNS + " from agent_runs where organization_id = :org and work_id = :work"
                        + " order by created_at desc, id limit 50")
                .param("org", organizationId)
                .param("work", workId)
                .query(AgentRepository::run)
                .list();
    }

    public List<RunRow> runsOfOrganization(UUID organizationId, @org.jspecify.annotations.Nullable String status) {
        return jdbc.sql("select " + RUN_COLUMNS + " from agent_runs where organization_id = :org"
                        + " and (cast(:status as text) is null or status = :status)"
                        + " order by created_at desc, id limit 100")
                .param("org", organizationId)
                .param("status", status)
                .query(AgentRepository::run)
                .list();
    }

    public void insertStep(StepRow step, OffsetDateTime now) {
        jdbc.sql("""
                        insert into agent_steps (id, organization_id, run_id, position, tool, risk, input, reason,
                            status, created_at)
                        values (:id, :org, :run, :position, :tool, :risk, cast(:input as jsonb), :reason, :status, :now)
                        """)
                .param("id", step.id())
                .param("org", step.organizationId())
                .param("run", step.runId())
                .param("position", step.position())
                .param("tool", step.tool())
                .param("risk", step.risk().name())
                .param("input", step.input())
                .param("reason", step.reason())
                .param("status", step.status().name())
                .param("now", now)
                .update();
    }

    public void updateStep(
            UUID id,
            StepStatus status,
            @Nullable UUID approvedBy,
            @Nullable OffsetDateTime approvedAt,
            int attempts,
            @Nullable String result,
            @Nullable String error,
            OffsetDateTime now) {
        jdbc.sql("""
                        update agent_steps set status = :status, approved_by = :by, approved_at = :at,
                            attempts = :attempts, result = :result, error = :error,
                            finished_at = case when :finished then :now else null end
                        where id = :id
                        """)
                .param("id", id)
                .param("status", status.name())
                .param("by", approvedBy)
                .param("at", approvedAt)
                .param("attempts", attempts)
                .param("result", result)
                .param("error", error)
                .param("finished", status.finished())
                .param("now", now)
                .update();
    }

    public List<StepRow> stepsOf(UUID runId) {
        return jdbc.sql("select " + STEP_COLUMNS + " from agent_steps where run_id = :run order by position")
                .param("run", runId)
                .query(AgentRepository::step)
                .list();
    }

    private static RunRow run(ResultSet rs, int row) throws SQLException {
        var budget = new Budget(
                rs.getInt(9),
                rs.getInt(10),
                rs.getInt(11),
                rs.getLong(12),
                rs.getObject(13, OffsetDateTime.class),
                rs.getInt(14),
                rs.getInt(15),
                rs.getInt(16),
                rs.getLong(17));
        return new RunRow(
                rs.getObject(1, UUID.class),
                rs.getObject(2, UUID.class),
                rs.getObject(3, UUID.class),
                rs.getString(4),
                RunStatus.valueOf(rs.getString(5)),
                rs.getObject(6, UUID.class),
                Arrays.asList((String[]) rs.getArray(7).getArray()),
                rs.getString(8),
                budget,
                rs.getString(18),
                rs.getString(19),
                rs.getObject(20, OffsetDateTime.class),
                rs.getObject(21, OffsetDateTime.class));
    }

    private static StepRow step(ResultSet rs, int row) throws SQLException {
        return new StepRow(
                rs.getObject(1, UUID.class),
                rs.getObject(2, UUID.class),
                rs.getObject(3, UUID.class),
                rs.getInt(4),
                rs.getString(5),
                Risk.valueOf(rs.getString(6)),
                rs.getString(7),
                rs.getString(8),
                StepStatus.valueOf(rs.getString(9)),
                rs.getObject(10, UUID.class),
                rs.getObject(11, OffsetDateTime.class),
                rs.getInt(12),
                rs.getString(13),
                rs.getString(14),
                rs.getObject(15, OffsetDateTime.class));
    }
}
