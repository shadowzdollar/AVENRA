package com.avenra.work.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * The lifecycle of work (Guidelines §19, ADR-018). The status only changes through
 * {@link #canMoveTo}; there is no other way to set it. Final statuses cannot be left: reopening
 * means creating new work.
 */
public enum WorkStatus {
    DRAFT,
    READY,
    RUNNING,
    WAITING_FOR_INFORMATION,
    WAITING_FOR_APPROVAL,
    BLOCKED,
    FAILED,
    COMPLETED,
    CANCELLED;

    private static final Map<WorkStatus, Set<WorkStatus>> NEXT = Map.of(
            DRAFT, EnumSet.of(READY, CANCELLED),
            READY, EnumSet.of(DRAFT, RUNNING, CANCELLED),
            RUNNING, EnumSet.of(WAITING_FOR_INFORMATION, WAITING_FOR_APPROVAL, BLOCKED, COMPLETED, FAILED, CANCELLED),
            WAITING_FOR_INFORMATION, EnumSet.of(RUNNING, WAITING_FOR_APPROVAL, BLOCKED, CANCELLED),
            WAITING_FOR_APPROVAL, EnumSet.of(RUNNING, WAITING_FOR_INFORMATION, BLOCKED, CANCELLED),
            BLOCKED, EnumSet.of(RUNNING, WAITING_FOR_INFORMATION, WAITING_FOR_APPROVAL, CANCELLED),
            FAILED, EnumSet.noneOf(WorkStatus.class),
            COMPLETED, EnumSet.noneOf(WorkStatus.class),
            CANCELLED, EnumSet.noneOf(WorkStatus.class));

    public boolean canMoveTo(WorkStatus target) {
        return NEXT.get(this).contains(target);
    }

    public Set<WorkStatus> next() {
        return Set.copyOf(NEXT.get(this));
    }

    public boolean isFinal() {
        return NEXT.get(this).isEmpty();
    }

    /** Moving here must be explained, so the history says why work stopped or stalled. */
    public boolean needsReason() {
        return this == BLOCKED || this == FAILED || this == CANCELLED;
    }
}
