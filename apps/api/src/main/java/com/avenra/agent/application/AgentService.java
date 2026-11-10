package com.avenra.agent.application;

import com.avenra.agent.WorkTools;
import com.avenra.agent.domain.Budget;
import com.avenra.agent.domain.Risk;
import com.avenra.agent.domain.RunStatus;
import com.avenra.agent.domain.StepStatus;
import com.avenra.agent.infrastructure.AgentRepository;
import com.avenra.agent.infrastructure.AgentRepository.RunRow;
import com.avenra.agent.tools.ToolRegistry;
import com.avenra.ai.Ai;
import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.AgentApprovalRequest;
import com.avenra.contract.v1.model.AgentRun;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.web.ApiException;
import io.micrometer.tracing.Tracer;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * What people do with agent runs (ADR-033): start one, decide on its plan, stop it. Every call is
 * authorized through the organization access path; approving needs {@code work.approve}.
 */
@Service
public class AgentService {

    static final String CAPABILITY = "information.plan";

    private final AgentRepository repository;
    private final RunControl control;
    private final AgentViews views;
    private final ToolRegistry tools;
    private final WorkTools work;
    private final Ai ai;
    private final OrganizationAccess access;
    private final Idempotency idempotency;
    private final JobQueue jobs;
    private final AuditLog audit;
    private final Tracer tracer;
    private final Clock clock;

    AgentService(
            AgentRepository repository,
            RunControl control,
            AgentViews views,
            ToolRegistry tools,
            WorkTools work,
            Ai ai,
            OrganizationAccess access,
            Idempotency idempotency,
            JobQueue jobs,
            AuditLog audit,
            Tracer tracer,
            Clock clock) {
        this.repository = repository;
        this.control = control;
        this.views = views;
        this.tools = tools;
        this.work = work;
        this.ai = ai;
        this.access = access;
        this.idempotency = idempotency;
        this.jobs = jobs;
        this.audit = audit;
        this.tracer = tracer;
        this.clock = clock;
    }

    public AgentRun start(UUID userId, UUID organizationId, UUID workId, String idempotencyKey) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_UPDATE,
                granted -> idempotency.once(
                        userId, "startAgentRun", idempotencyKey, organizationId + "/" + workId, AgentRun.class, () -> {
                            if (!ai.workPlanningEnabled(organizationId)) {
                                throw new ApiException(
                                        "AI_PLANNING_OFF",
                                        HttpStatus.CONFLICT,
                                        "The assistant is switched off for this organization. An owner can switch it"
                                                + " on in the organization's settings.");
                            }
                            var facts = work.facts(organizationId, workId).orElseThrow(ApiException::notFound);
                            if (!facts.open()) {
                                throw ApiException.conflict("WORK_CLOSED", "This work is closed.");
                            }
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var span = tracer.currentSpan();
                            var run = new RunRow(
                                    UUID.randomUUID(),
                                    organizationId,
                                    workId,
                                    CAPABILITY,
                                    RunStatus.PLANNING,
                                    userId,
                                    tools.names(),
                                    null,
                                    Budget.defaults(now),
                                    null,
                                    span == null ? null : span.context().traceId(),
                                    now,
                                    null);
                            repository.insertRun(run, now);
                            jobs.enqueue(
                                    JobQueue.Request.of(AgentRuntime.PLAN, organizationId, Map.of("runId", run.id()))
                                            .idempotencyKey("plan:" + run.id())
                                            .maxAttempts(3));
                            audit.record(AuditLog.Event.of("agent.run.started", organizationId, userId)
                                    .resource("agent_run", run.id())
                                    .detail("workId", workId.toString())
                                    .detail("capability", CAPABILITY));
                            return views.run(run, List.of());
                        }));
    }

    public List<AgentRun> list(UUID userId, UUID organizationId, UUID workId) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> repository.runsOf(organizationId, workId).stream()
                        .map(run -> views.run(run, repository.stepsOf(run.id())))
                        .toList());
    }

    /** The organization's newest runs across all work, optionally in one status (ADR-039). */
    public List<AgentRun> organizationRuns(
            UUID userId, UUID organizationId, @org.jspecify.annotations.Nullable String status) {
        return access.run(userId, organizationId, Permission.WORK_READ, granted -> {
            var titles = new java.util.HashMap<UUID, String>();
            return repository.runsOfOrganization(organizationId, status).stream()
                    .map(run -> {
                        String title = titles.computeIfAbsent(
                                run.workId(),
                                id -> work.facts(organizationId, id)
                                        .map(WorkTools.WorkFacts::title)
                                        .orElse(""));
                        var view = views.run(run, repository.stepsOf(run.id()));
                        return title.isEmpty() ? view : view.workTitle(title);
                    })
                    .toList();
        });
    }

    public AgentRun get(UUID userId, UUID organizationId, UUID workId, UUID runId) {
        return access.run(userId, organizationId, Permission.WORK_READ, granted -> view(organizationId, workId, runId));
    }

    /**
     * Approving the plan approves every step up to MEDIUM risk; high-risk steps are approved only
     * when named (ADR-033). Rejecting ends the run.
     */
    public AgentRun decide(UUID userId, UUID organizationId, UUID workId, UUID runId, AgentApprovalRequest input) {
        return access.run(userId, organizationId, Permission.WORK_APPROVE, granted -> {
            var run = locked(organizationId, workId, runId);
            if (run.status() != RunStatus.AWAITING_APPROVAL) {
                throw ApiException.conflict(
                        "AGENT_RUN_NOT_AWAITING_APPROVAL", "This run is not waiting for a decision.");
            }
            if (input.getDecision() == AgentApprovalRequest.DecisionEnum.REJECT) {
                String reason = input.getReason() == null || input.getReason().isBlank()
                        ? "The plan was rejected."
                        : "The plan was rejected: " + input.getReason().strip();
                control.end(run, RunStatus.REJECTED, reason, run.budget(), false, userId);
                return view(organizationId, workId, runId);
            }
            var highRisk = new HashSet<>(input.getHighRiskStepIds() == null ? List.of() : input.getHighRiskStepIds());
            OffsetDateTime now = OffsetDateTime.now(clock);
            int approved = 0;
            for (var step : repository.stepsOf(runId)) {
                boolean named = highRisk.remove(step.id());
                if (step.status() != StepStatus.PROPOSED) {
                    if (named) {
                        throw ApiException.invalid("highRiskStepIds", "names a step that is not waiting for approval");
                    }
                    continue;
                }
                if (step.risk().needsOwnApproval() && !named) {
                    continue;
                }
                if (named && !step.risk().needsOwnApproval()) {
                    throw ApiException.invalid("highRiskStepIds", "names a step that is not high-risk");
                }
                if (step.risk() == Risk.CRITICAL) {
                    throw ApiException.invalid("highRiskStepIds", "critical steps cannot be approved for agents");
                }
                repository.updateStep(
                        step.id(),
                        step.status().moveTo(StepStatus.APPROVED),
                        userId,
                        now,
                        step.attempts(),
                        null,
                        null,
                        now);
                approved++;
                audit.record(AuditLog.Event.of("agent.step.approved", organizationId, userId)
                        .resource("agent_step", step.id())
                        .detail("runId", runId.toString())
                        .detail("tool", step.tool())
                        .detail("risk", step.risk().name()));
            }
            if (!highRisk.isEmpty()) {
                throw ApiException.invalid("highRiskStepIds", "names a step of another run");
            }
            if (approved == 0) {
                throw ApiException.conflict("NOTHING_TO_APPROVE", "No step was waiting for this approval.");
            }
            control.move(run, RunStatus.RUNNING, null, run.budget());
            AgentRuntime.resume(jobs, run);
            return view(organizationId, workId, runId);
        });
    }

    /** Stops a run now; the runtime never waits for the agent to stop itself (§130). */
    public AgentRun stop(UUID userId, UUID organizationId, UUID workId, UUID runId, String reason) {
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            var run = locked(organizationId, workId, runId);
            control.end(run, RunStatus.STOPPED, "Stopped by a person: " + reason.strip(), run.budget(), false, userId);
            return view(organizationId, workId, runId);
        });
    }

    private RunRow locked(UUID organizationId, UUID workId, UUID runId) {
        var run = repository.findRun(organizationId, workId, runId).orElseThrow(ApiException::notFound);
        return repository.findRunForUpdate(run.id()).orElseThrow(ApiException::notFound);
    }

    private AgentRun view(UUID organizationId, UUID workId, UUID runId) {
        var run = repository.findRun(organizationId, workId, runId).orElseThrow(ApiException::notFound);
        return views.run(run, repository.stepsOf(runId));
    }
}
