package com.avenra.work;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Facts the work module publishes for other modules, inside the transaction that made them true. */
public final class WorkEvents {

    private WorkEvents() {}

    /** Work was completed and its manifest sealed (ADR-028). */
    public record Completed(
            UUID organizationId, UUID workId, String title, OffsetDateTime completedAt, String manifestSha256) {}

    /**
     * An exception was raised (ADR-024). {@code workId} is null for exceptions outside work.
     *
     * @param severity {@code LOW}, {@code MEDIUM} or {@code HIGH}
     */
    public record ExceptionRaised(
            UUID organizationId,
            @org.jspecify.annotations.Nullable UUID workId,
            UUID exceptionId,
            String type,
            String severity,
            String description) {}

    /** A high-severity exception stayed open and unassigned past the escalation time (ADR-035). */
    public record ExceptionUnattended(
            UUID organizationId,
            @org.jspecify.annotations.Nullable UUID workId,
            UUID exceptionId,
            String description) {}
}
