package com.avenra.agent.application;

import com.avenra.agent.InformationTools;
import com.avenra.agent.WorkTools;
import com.avenra.agent.domain.Budget;
import com.avenra.agent.domain.RunStatus;
import com.avenra.agent.domain.StepStatus;
import com.avenra.agent.infrastructure.AgentRepository;
import com.avenra.agent.infrastructure.AgentRepository.RunRow;
import com.avenra.agent.infrastructure.AgentRepository.StepRow;
import com.avenra.agent.tools.Tool;
import com.avenra.agent.tools.ToolFailure;
import com.avenra.agent.tools.ToolInputException;
import com.avenra.agent.tools.ToolRegistry;
import com.avenra.ai.Ai;
import com.avenra.audit.AuditLog;
import com.avenra.platform.jobs.Job;
import com.avenra.platform.jobs.JobFailure;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.jobs.JobSchedule;
import com.avenra.platform.jobs.JobWorker;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import tools.jackson.databind.json.JsonMapper;

/**
 * The orchestrator's runtime (ADR-033): one job plans a run, one job runs each approved step through
 * the tool gateway, and a sweep stops runs past their deadline. Each job runs in the organization's
 * scope; each step's effect runs as the person who started the run, in a transaction of its own.
 */
@Configuration(proxyBeanMethods = false)
class AgentRuntime {

    static final String PLAN = "agent.plan";
    static final String STEP = "agent.step";
    static final String DEADLINE = "agent.deadline";

    private static final Logger log = LoggerFactory.getLogger(AgentRuntime.class);
    private static final Duration RETRY_DELAY = Duration.ofSeconds(5);

    /** Resumes a run after an approval; each approval gets its own job. */
    static void resume(JobQueue jobs, RunRow run) {
        jobs.enqueue(JobQueue.Request.of(STEP, run.organizationId(), Map.of("runId", run.id()))
                .idempotencyKey("resume:" + run.id() + ":" + UUID.randomUUID()));
    }

    /**
     * Schedules the next step of a running run. Each job locks the run and reads its state again, so
     * a second job for the same run does nothing; a unique key keeps a run from stalling.
     */
    static void next(JobQueue jobs, RunRow run, int afterPosition) {
        jobs.enqueue(JobQueue.Request.of(STEP, run.organizationId(), Map.of("runId", run.id()))
                .idempotencyKey("step:" + run.id() + ":" + afterPosition + ":" + UUID.randomUUID()));
    }

    @Bean
    JobSchedule agentDeadlineSchedule() {
        return new JobSchedule("sweep-agent-deadlines", "sweep.agent_deadlines", Duration.ofMinutes(1));
    }

    @Bean
    JobHandler agentDeadlineSweep(JdbcClient jdbc) {
        return JobHandler.of(
                "sweep.agent_deadlines",
                job -> jdbc.sql("select sweep_agent_deadlines()")
                        .query(Integer.class)
                        .single());
    }

    @Bean
    JobHandler agentDeadlineHandler(AgentRepository repository, RunControl control, Clock clock) {
        return JobHandler.of(DEADLINE, job -> {
            var run = repository.findRunForUpdate(runId(job)).orElse(null);
            if (run == null || run.status().finished()) {
                return;
            }
            if (!OffsetDateTime.now(clock).isBefore(run.budget().deadline())) {
                control.end(run, RunStatus.STOPPED, "The run reached its deadline.", run.budget(), true, null);
            }
        });
    }

    /** Asks for a plan and turns it into proposed steps, each validated by its tool first. */
    @Bean
    JobHandler agentPlanHandler(
            AgentRepository repository,
            RunControl control,
            ToolRegistry tools,
            WorkTools work,
            InformationTools information,
            Ai ai,
            JsonMapper json,
            Clock clock) {
        return JobHandler.of(PLAN, job -> {
            var run = repository.findRunForUpdate(runId(job)).orElse(null);
            if (run == null || run.status() != RunStatus.PLANNING) {
                return;
            }
            OffsetDateTime now = OffsetDateTime.now(clock);
            var over = run.budget().exceeded(now);
            if (over.isPresent() || !run.budget().allowsModelCall()) {
                control.end(
                        run,
                        RunStatus.STOPPED,
                        over.orElse("The run has no model calls left."),
                        run.budget(),
                        true,
                        null);
                return;
            }
            var facts = work.facts(run.organizationId(), run.workId()).orElse(null);
            if (facts == null || !facts.open()) {
                control.end(
                        run, RunStatus.FAILED, "The work is closed or no longer exists.", run.budget(), false, null);
                return;
            }
            var outcome = ai.planWork(new Ai.PlanRequest(
                    run.organizationId(),
                    run.workId(),
                    run.startedBy(),
                    facts.title(),
                    facts.description(),
                    facts.type(),
                    information.requirementTitles(run.organizationId(), run.workId()),
                    run.allowedTools(),
                    job.attempt()));
            switch (outcome) {
                case Ai.NotPlanned notPlanned
                when notPlanned.retryable() && !job.lastAttempt() ->
                    throw new JobFailure.Retryable("Planning unavailable: " + notPlanned.detail(), null);
                case Ai.NotPlanned notPlanned -> {
                    Budget spent = notPlanned.invocationId() == null
                            ? run.budget()
                            : run.budget().withModelCall(notPlanned.costMicros());
                    control.end(run, RunStatus.FAILED, notPlanned.detail(), spent, true, null);
                }
                case Ai.Planned planned -> {
                    Budget spent = run.budget().withModelCall(planned.costMicros());
                    var steps = new ArrayList<StepRow>();
                    try {
                        int position = 0;
                        for (var proposed : planned.plan().steps()) {
                            if (!run.allowedTools().contains(proposed.tool())) {
                                throw new ToolInputException("the tool " + proposed.tool() + " is not allowed");
                            }
                            Tool<?> tool = tools.find(proposed.tool())
                                    .orElseThrow(() -> new ToolInputException("unknown tool " + proposed.tool()));
                            steps.add(new StepRow(
                                    UUID.randomUUID(),
                                    run.organizationId(),
                                    run.id(),
                                    ++position,
                                    tool.name(),
                                    tool.risk(),
                                    json.writeValueAsString(validated(tool, proposed.input())),
                                    shorten(proposed.reason(), 300),
                                    StepStatus.PROPOSED,
                                    null,
                                    null,
                                    0,
                                    null,
                                    null,
                                    null));
                        }
                    } catch (ToolInputException refused) {
                        // The gateway refuses the whole plan rather than run part of what the model meant.
                        control.end(
                                run,
                                RunStatus.FAILED,
                                "The plan was refused by the tool gateway: " + refused.getMessage() + ".",
                                spent,
                                true,
                                null);
                        return;
                    }
                    var exceeded = spent.exceeded(now);
                    if (exceeded.isPresent()) {
                        control.end(run, RunStatus.STOPPED, exceeded.get(), spent, true, null);
                        return;
                    }
                    String summary = shorten(planned.plan().summary(), 500);
                    if (steps.isEmpty()) {
                        control.move(run, RunStatus.COMPLETED, summary, spent);
                        return;
                    }
                    steps.forEach(step -> repository.insertStep(step, now));
                    control.move(run, RunStatus.AWAITING_APPROVAL, summary, spent);
                }
            }
        });
    }

    /** Runs the next approved step through the gateway, verifies it, and schedules the next one. */
    @Bean
    JobHandler agentStepHandler(
            AgentRepository repository,
            RunControl control,
            AgentViews views,
            ToolRegistry tools,
            WorkTools work,
            TenantTransactions transactions,
            JobQueue jobs,
            AuditLog audit,
            MeterRegistry meters,
            Clock clock) {
        return JobHandler.of(STEP, job -> {
            var run = repository.findRunForUpdate(runId(job)).orElse(null);
            if (run == null || run.status() != RunStatus.RUNNING) {
                return;
            }
            OffsetDateTime now = OffsetDateTime.now(clock);
            var over = run.budget().exceeded(now);
            if (over.isPresent()) {
                control.end(run, RunStatus.STOPPED, over.get(), run.budget(), true, null);
                return;
            }
            var step = repository.stepsOf(run.id()).stream()
                    .filter(candidate -> !candidate.status().finished())
                    .findFirst()
                    .orElse(null);
            if (step == null) {
                control.move(run, RunStatus.COMPLETED, null, run.budget());
                audit.record(AuditLog.Event.of("agent.run.completed", run.organizationId(), null)
                        .resource("agent_run", run.id())
                        .detail("workId", run.workId().toString()));
                return;
            }
            if (step.status() == StepStatus.PROPOSED) {
                // A high-risk step waits for its own approval; the wait is explicit in the run's state.
                control.move(run, RunStatus.AWAITING_APPROVAL, null, run.budget());
                return;
            }
            Tool<?> tool = tools.find(step.tool()).orElse(null);
            if (tool == null || !run.allowedTools().contains(step.tool())) {
                failStep(repository, step, "The tool is no longer available.", now);
                control.end(run, RunStatus.FAILED, "A step's tool is not available.", run.budget(), true, null);
                return;
            }
            if (!run.budget().allowsToolCall(tool.sideEffect())) {
                control.end(
                        run,
                        RunStatus.STOPPED,
                        "The next step would exceed the run's budget.",
                        run.budget(),
                        true,
                        null);
                return;
            }
            var facts = work.facts(run.organizationId(), run.workId()).orElse(null);
            if (facts == null || !facts.open()) {
                control.end(
                        run, RunStatus.FAILED, "The work is closed or no longer exists.", run.budget(), false, null);
                return;
            }
            int attempts = step.attempts() + 1;
            var context = new Tool.Context(
                    run.organizationId(),
                    run.workId(),
                    run.startedBy(),
                    "agent:" + run.id() + ":" + step.position(),
                    facts);
            Budget spent = run.budget().withToolCall(tool.sideEffect());
            try {
                // The effect runs as the starting person, through their own permission check, and
                // commits on its own; the key makes a repeated attempt return the first result. The
                // scope is the job's own organization scope; every service re-checks the person's
                // membership and permission before it acts.
                var outcome = transactions.runSeparately(
                        TenantScope.organization(run.startedBy(), run.organizationId()),
                        () -> execute(tool, context, views.input(step)));
                boolean verified = verify(tool, context, views.input(step), outcome);
                if (!verified) {
                    failStep(repository, step, attempts, "The result could not be verified.", now);
                    control.end(run, RunStatus.FAILED, "A step's result could not be verified.", spent, true, null);
                    return;
                }
                repository.updateStep(
                        step.id(),
                        step.status().moveTo(StepStatus.RUNNING).moveTo(StepStatus.SUCCEEDED),
                        step.approvedBy(),
                        step.approvedAt(),
                        attempts,
                        outcome.summary(),
                        null,
                        now);
                control.spend(run, spent);
                audit.record(AuditLog.Event.of(tool.auditAction(), run.organizationId(), run.startedBy())
                        .resource("agent_step", step.id())
                        .detail("runId", run.id().toString())
                        .detail("risk", tool.risk().name())
                        .detail("resourceId", outcome.resourceId().toString()));
                meters.counter("avenra.agent.steps", "tool", tool.name(), "outcome", "SUCCEEDED")
                        .increment();
                next(jobs, run, step.position());
            } catch (ApiException | ToolInputException | ToolFailure refused) {
                boolean retryable = refused instanceof ToolFailure failure && failure.retryable();
                if (retryable && attempts < tool.maxAttempts()) {
                    retryLater(repository, jobs, run, step, attempts, refused.getMessage(), now);
                    return;
                }
                meters.counter("avenra.agent.steps", "tool", tool.name(), "outcome", "FAILED")
                        .increment();
                failStep(repository, step, attempts, message(refused), now);
                control.end(run, RunStatus.FAILED, "A step failed: " + message(refused), spent, true, null);
            } catch (RuntimeException transientFailure) {
                // Database or network trouble: worth another attempt, up to the tool's limit.
                log.warn("Agent step failed", transientFailure);
                if (attempts < tool.maxAttempts()) {
                    retryLater(repository, jobs, run, step, attempts, "A temporary error occurred.", now);
                    return;
                }
                meters.counter("avenra.agent.steps", "tool", tool.name(), "outcome", "FAILED")
                        .increment();
                failStep(repository, step, attempts, "The step kept failing.", now);
                control.end(run, RunStatus.FAILED, "A step kept failing.", spent, true, null);
            }
        });
    }

    private static <I> Tool.Outcome execute(Tool<I> tool, Tool.Context context, Map<String, Object> raw) {
        return tool.execute(context, tool.validate(raw));
    }

    private static <I> boolean verify(
            Tool<I> tool, Tool.Context context, Map<String, Object> raw, Tool.Outcome outcome) {
        return tool.verify(context, tool.validate(raw), outcome);
    }

    private static <I> Map<String, Object> validated(Tool<I> tool, Map<String, Object> raw) {
        I input = tool.validate(raw);
        // The stored input is what the tool read, not what the model wrote.
        return STORED.convertValue(input, MAP_TYPE);
    }

    private static final JsonMapper STORED = JsonMapper.builder().build();
    private static final tools.jackson.core.type.TypeReference<Map<String, Object>> MAP_TYPE =
            new tools.jackson.core.type.TypeReference<>() {};

    private static void retryLater(
            AgentRepository repository,
            JobQueue jobs,
            RunRow run,
            StepRow step,
            int attempts,
            String error,
            OffsetDateTime now) {
        // RUNNING → APPROVED: the step waits for its next attempt, still approved.
        repository.updateStep(
                step.id(),
                step.status().moveTo(StepStatus.RUNNING).moveTo(StepStatus.APPROVED),
                step.approvedBy(),
                step.approvedAt(),
                attempts,
                null,
                shorten(error, 1000),
                now);
        jobs.enqueue(JobQueue.Request.of(STEP, run.organizationId(), Map.of("runId", run.id()))
                .idempotencyKey("step:" + run.id() + ":" + step.position() + ":retry" + attempts)
                .delay(RETRY_DELAY.multipliedBy(attempts)));
    }

    private static void failStep(AgentRepository repository, StepRow step, String error, OffsetDateTime now) {
        failStep(repository, step, step.attempts(), error, now);
    }

    /** An approved step fails through RUNNING; one that never ran is skipped. */
    private static void failStep(
            AgentRepository repository, StepRow step, int attempts, String error, OffsetDateTime now) {
        StepStatus target = switch (step.status()) {
            case APPROVED -> step.status().moveTo(StepStatus.RUNNING).moveTo(StepStatus.FAILED);
            case RUNNING -> step.status().moveTo(StepStatus.FAILED);
            default -> step.status().moveTo(StepStatus.SKIPPED);
        };
        repository.updateStep(
                step.id(), target, step.approvedBy(), step.approvedAt(), attempts, null, shorten(error, 1000), now);
    }

    private static String message(RuntimeException refused) {
        return shorten(String.valueOf(refused.getMessage()), 300);
    }

    private static String shorten(String text, int max) {
        return text.length() > max ? text.substring(0, max) : text;
    }

    private static UUID runId(Job job) {
        return UUID.fromString(JobWorker.text(job.payload(), "runId"));
    }
}
