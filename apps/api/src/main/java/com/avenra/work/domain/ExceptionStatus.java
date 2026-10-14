package com.avenra.work.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/** The exception lifecycle (Guidelines §26, ADR-024). */
public enum ExceptionStatus {
    OPEN,
    IN_PROGRESS,
    WAITING,
    RESOLVED,
    DISMISSED;

    private static final Map<ExceptionStatus, Set<ExceptionStatus>> NEXT = Map.of(
            OPEN, EnumSet.of(IN_PROGRESS, WAITING, RESOLVED, DISMISSED),
            IN_PROGRESS, EnumSet.of(WAITING, RESOLVED, DISMISSED),
            WAITING, EnumSet.of(IN_PROGRESS, RESOLVED, DISMISSED),
            RESOLVED, EnumSet.noneOf(ExceptionStatus.class),
            DISMISSED, EnumSet.noneOf(ExceptionStatus.class));

    public boolean canMoveTo(ExceptionStatus target) {
        return NEXT.get(this).contains(target);
    }

    public Set<ExceptionStatus> next() {
        return Set.copyOf(NEXT.get(this));
    }

    public boolean isFinal() {
        return NEXT.get(this).isEmpty();
    }

    /** Closing an exception must say how it was handled. */
    public boolean needsResolution() {
        return isFinal();
    }
}
