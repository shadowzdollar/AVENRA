package com.avenra.agent.application;

import com.avenra.agent.AgentEvents;
import com.avenra.agent.domain.Budget;
import com.avenra.agent.domain.RunStatus;
import com.avenra.agent.domain.StepStatus;
import com.avenra.agent.infrastructure.AgentRepository;
import com.avenra.agent.infrastructure.AgentRepository.RunRow;
import com.avenra.audit.AuditLog;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Moves runs along their state machine and ends them (ADR-033). Every end skips the steps that did
 * not run; a run that stops on its budget or deadline, or fails, asks for a person (§131).
 */
@Component
class RunControl {

    private final AgentRepository repository;
    private final AuditLog audit;
    private final ApplicationEventPublisher events;
    private final MeterRegistry meters;
    private final Clock clock;

    RunControl(
            AgentRepository repository,
            AuditLog audit,
            ApplicationEventPublisher events,
            MeterRegistry meters,
            Clock clock) {
        this.repository = repository;
        this.audit = audit;
        this.events = events;
        this.meters = meters;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    void move(RunRow run, RunStatus target, @Nullable String summary, Budget budget) {
        RunStatus next = run.status().moveTo(target);
        repository.updateRun(run.id(), next, summary, budget, null, OffsetDateTime.now(clock));
    }

    /** Records what the run spent, without changing its state. */
    @Transactional(propagation = Propagation.MANDATORY)
    void spend(RunRow run, Budget budget) {
        repository.updateRun(run.id(), run.status(), null, budget, null, OffsetDateTime.now(clock));
    }

    /**
     * Ends an unfinished run. {@code attention} raises an exception on the work for a person.
     *
     * @param actor who ended it, or {@code null} for the platform
     */
    @Transactional(propagation = Propagation.MANDATORY)
    void end(RunRow run, RunStatus target, String reason, Budget budget, boolean attention, @Nullable UUID actor) {
        if (run.status().finished()) {
            return;
        }
        OffsetDateTime now = OffsetDateTime.now(clock);
        RunStatus next = run.status().moveTo(target);
        for (var step : repository.stepsOf(run.id())) {
            if (!step.status().finished()) {
                StepStatus skipped = step.status() == StepStatus.PROPOSED && target == RunStatus.REJECTED
                        ? StepStatus.REJECTED
                        : StepStatus.SKIPPED;
                repository.updateStep(
                        step.id(),
                        step.status().moveTo(skipped),
                        step.approvedBy(),
                        step.approvedAt(),
                        step.attempts(),
                        step.result(),
                        step.error(),
                        now);
            }
        }
        repository.updateRun(run.id(), next, null, budget, reason, now);
        audit.record(AuditLog.Event.of("agent.run." + next.name().toLowerCase(Locale.ROOT), run.organizationId(), actor)
                .resource("agent_run", run.id())
                .detail("workId", run.workId().toString())
                .detail("reason", reason));
        meters.counter("avenra.agent.runs.ended", "status", next.name()).increment();
        if (attention) {
            events.publishEvent(new AgentEvents.RunNeedsAttention(
                    run.organizationId(), run.workId(), run.id(), next.name(), reason));
        }
    }
}
