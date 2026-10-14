package com.avenra.work.application;

import com.avenra.work.domain.ExecutionStatus;
import com.avenra.work.infrastructure.ExecutionRepository;
import com.avenra.work.infrastructure.ExecutionRepository.ExecutionRow;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records platform actions as executions (Guidelines §28, ADR-023), moving each only along the
 * execution state machine. A platform action is authorized by the rule that triggers it; it is
 * verified only after the platform checked the resulting state.
 */
@Component
class Executions {

    /** What is about to be done. {@code idempotencyKey} makes a second start of the same action a no-op. */
    record Plan(
            UUID organizationId,
            UUID workId,
            String rule,
            String action,
            @Nullable String stepType,
            @Nullable UUID stepId,
            @Nullable String target,
            @Nullable String inputReference,
            @Nullable String idempotencyKey) {}

    private final ExecutionRepository repository;
    private final MeterRegistry metrics;
    private final Clock clock;

    Executions(ExecutionRepository repository, MeterRegistry metrics, Clock clock) {
        this.repository = repository;
        this.metrics = metrics;
        this.clock = clock;
    }

    /**
     * Plans, authorizes and starts a system action (PLANNED → AUTHORIZED → READY → RUNNING).
     *
     * @return the running execution, or empty when this action already ran under the same key
     */
    @Transactional(propagation = Propagation.MANDATORY)
    Optional<UUID> start(Plan plan) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        ExecutionStatus status = ExecutionStatus.PLANNED;
        for (ExecutionStatus next :
                new ExecutionStatus[] {ExecutionStatus.AUTHORIZED, ExecutionStatus.READY, ExecutionStatus.RUNNING}) {
            status = advance(status, next);
        }
        var row = new ExecutionRow(
                UUID.randomUUID(),
                plan.organizationId(),
                plan.workId(),
                plan.stepType(),
                plan.stepId(),
                "SYSTEM",
                null,
                plan.rule(),
                plan.action(),
                plan.target(),
                plan.inputReference(),
                status,
                Map.of("authorizedBy", "rule:" + plan.rule()),
                null,
                0,
                null,
                plan.idempotencyKey(),
                now,
                now,
                null);
        if (!repository.insert(row)) {
            return Optional.empty();
        }
        metrics.counter("avenra.execution.started", "action", plan.action()).increment();
        return Optional.of(row.id());
    }

    /** RUNNING → SUCCEEDED → VERIFIED → COMPLETED, after the caller checked the result. */
    @Transactional(propagation = Propagation.MANDATORY)
    void completeVerified(UUID executionId, Map<String, String> result) {
        var current = repository.find(executionId).orElseThrow();
        ExecutionStatus status = advance(current.status(), ExecutionStatus.SUCCEEDED);
        status = advance(status, ExecutionStatus.VERIFIED);
        status = advance(status, ExecutionStatus.COMPLETED);
        var merged = new java.util.HashMap<>(current.result());
        merged.putAll(result);
        OffsetDateTime now = OffsetDateTime.now(clock);
        repository.update(executionId, status, merged, null, current.startedAt(), now, now);
        metrics.counter("avenra.execution.completed", "action", current.action())
                .increment();
    }

    /** RUNNING → FAILED with an error safe to show to people. */
    @Transactional(propagation = Propagation.MANDATORY)
    void fail(UUID executionId, String error) {
        var current = repository.find(executionId).orElseThrow();
        ExecutionStatus status = advance(current.status(), ExecutionStatus.FAILED);
        OffsetDateTime now = OffsetDateTime.now(clock);
        repository.update(executionId, status, current.result(), error, current.startedAt(), now, now);
        metrics.counter("avenra.execution.failed", "action", current.action()).increment();
    }

    private static ExecutionStatus advance(ExecutionStatus from, ExecutionStatus to) {
        if (!from.canMoveTo(to)) {
            throw new IllegalStateException("Execution cannot move from " + from + " to " + to);
        }
        return to;
    }
}
