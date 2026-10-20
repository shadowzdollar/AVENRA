package com.avenra.agent.domain;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * What a run may spend (Guidelines §131) and what it has spent. Exceeding any limit stops the run.
 */
public record Budget(
        int maxModelCalls,
        int maxToolCalls,
        int maxSideEffects,
        long maxCostMicros,
        OffsetDateTime deadline,
        int modelCalls,
        int toolCalls,
        int sideEffects,
        long costMicros) {

    /** Product defaults (ADR-033). */
    public static final int MODEL_CALLS = 1;

    public static final int TOOL_CALLS = 20;
    public static final int SIDE_EFFECTS = 1;
    public static final long COST_MICROS = 200_000;
    public static final Duration DURATION = Duration.ofHours(1);
    public static final int ATTEMPTS_PER_STEP = 3;

    public static Budget defaults(OffsetDateTime now) {
        return new Budget(MODEL_CALLS, TOOL_CALLS, SIDE_EFFECTS, COST_MICROS, now.plus(DURATION), 0, 0, 0, 0);
    }

    public Budget withModelCall(long cost) {
        return new Budget(
                maxModelCalls,
                maxToolCalls,
                maxSideEffects,
                maxCostMicros,
                deadline,
                modelCalls + 1,
                toolCalls,
                sideEffects,
                costMicros + cost);
    }

    public Budget withToolCall(boolean sideEffect) {
        return new Budget(
                maxModelCalls,
                maxToolCalls,
                maxSideEffects,
                maxCostMicros,
                deadline,
                modelCalls,
                toolCalls + 1,
                sideEffects + (sideEffect ? 1 : 0),
                costMicros);
    }

    /** Why the run must stop now, if it must. Checked before every model call and every step. */
    public Optional<String> exceeded(OffsetDateTime now) {
        if (!now.isBefore(deadline)) {
            return Optional.of("The run reached its deadline.");
        }
        if (modelCalls > maxModelCalls) {
            return Optional.of("The run made more model calls than its budget allows.");
        }
        if (costMicros > maxCostMicros) {
            return Optional.of("The run cost more than its budget allows.");
        }
        if (toolCalls > maxToolCalls) {
            return Optional.of("The run made more tool calls than its budget allows.");
        }
        if (sideEffects > maxSideEffects) {
            return Optional.of("The run had more external effects than its budget allows.");
        }
        return Optional.empty();
    }

    /** Whether one more call of this kind would exceed the budget; checked before making it. */
    public boolean allowsModelCall() {
        return modelCalls < maxModelCalls && costMicros < maxCostMicros;
    }

    public boolean allowsToolCall(boolean sideEffect) {
        return toolCalls < maxToolCalls && (!sideEffect || sideEffects < maxSideEffects);
    }
}
