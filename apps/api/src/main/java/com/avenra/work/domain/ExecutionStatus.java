package com.avenra.work.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/** The execution state machine (Guidelines §29, ADR-023). No other moves are possible. */
public enum ExecutionStatus {
    PLANNED,
    AUTHORIZED,
    READY,
    RUNNING,
    WAITING,
    REQUIRES_APPROVAL,
    FAILED,
    SUCCEEDED,
    VERIFIED,
    COMPLETED,
    CANCELLED;

    private static final Map<ExecutionStatus, Set<ExecutionStatus>> NEXT = Map.ofEntries(
            Map.entry(PLANNED, EnumSet.of(AUTHORIZED, CANCELLED)),
            Map.entry(AUTHORIZED, EnumSet.of(READY, CANCELLED)),
            Map.entry(READY, EnumSet.of(RUNNING, CANCELLED)),
            Map.entry(RUNNING, EnumSet.of(WAITING, REQUIRES_APPROVAL, FAILED, SUCCEEDED)),
            Map.entry(WAITING, EnumSet.of(RUNNING, FAILED, CANCELLED)),
            Map.entry(REQUIRES_APPROVAL, EnumSet.of(RUNNING, CANCELLED)),
            Map.entry(SUCCEEDED, EnumSet.of(VERIFIED, FAILED)),
            Map.entry(VERIFIED, EnumSet.of(COMPLETED)),
            Map.entry(FAILED, EnumSet.noneOf(ExecutionStatus.class)),
            Map.entry(COMPLETED, EnumSet.noneOf(ExecutionStatus.class)),
            Map.entry(CANCELLED, EnumSet.noneOf(ExecutionStatus.class)));

    public boolean canMoveTo(ExecutionStatus target) {
        return NEXT.get(this).contains(target);
    }

    public boolean isFinal() {
        return NEXT.get(this).isEmpty();
    }
}
