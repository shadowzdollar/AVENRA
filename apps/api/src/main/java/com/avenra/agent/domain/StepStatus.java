package com.avenra.agent.domain;

import java.util.EnumSet;
import java.util.Set;

/** The life of one step. A step runs only after an approval is recorded (ADR-033). */
public enum StepStatus {
    PROPOSED,
    APPROVED,
    RUNNING,
    SUCCEEDED,
    REJECTED,
    FAILED,
    SKIPPED;

    public boolean finished() {
        return this == SUCCEEDED || this == REJECTED || this == FAILED || this == SKIPPED;
    }

    public Set<StepStatus> next() {
        return switch (this) {
            case PROPOSED -> EnumSet.of(APPROVED, REJECTED, SKIPPED);
            case APPROVED -> EnumSet.of(RUNNING, SKIPPED);
            // A failed attempt that will be retried goes back to APPROVED.
            case RUNNING -> EnumSet.of(SUCCEEDED, FAILED, APPROVED, SKIPPED);
            case SUCCEEDED, REJECTED, FAILED, SKIPPED -> EnumSet.noneOf(StepStatus.class);
        };
    }

    public StepStatus moveTo(StepStatus target) {
        if (!next().contains(target)) {
            throw new IllegalStateException("an agent step cannot go from " + this + " to " + target);
        }
        return target;
    }
}
