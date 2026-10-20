package com.avenra.agent.domain;

import java.util.EnumSet;
import java.util.Set;

/** The life of an agent run (ADR-033). Approval states are explicit, as §132 requires. */
public enum RunStatus {
    PLANNING,
    AWAITING_APPROVAL,
    RUNNING,
    COMPLETED,
    REJECTED,
    STOPPED,
    FAILED;

    public boolean finished() {
        return this == COMPLETED || this == REJECTED || this == STOPPED || this == FAILED;
    }

    /** Where a run may go next. Any unfinished run may be stopped or fail. */
    public Set<RunStatus> next() {
        return switch (this) {
            case PLANNING -> EnumSet.of(AWAITING_APPROVAL, COMPLETED, STOPPED, FAILED);
            case AWAITING_APPROVAL -> EnumSet.of(RUNNING, REJECTED, STOPPED, FAILED);
            case RUNNING -> EnumSet.of(AWAITING_APPROVAL, COMPLETED, STOPPED, FAILED);
            case COMPLETED, REJECTED, STOPPED, FAILED -> EnumSet.noneOf(RunStatus.class);
        };
    }

    public RunStatus moveTo(RunStatus target) {
        if (!next().contains(target)) {
            throw new IllegalStateException("an agent run cannot go from " + this + " to " + target);
        }
        return target;
    }
}
