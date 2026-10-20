package com.avenra.work;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Facts the work module publishes for other modules, inside the transaction that made them true. */
public final class WorkEvents {

    private WorkEvents() {}

    /** Work was completed and its manifest sealed (ADR-028). */
    public record Completed(
            UUID organizationId, UUID workId, String title, OffsetDateTime completedAt, String manifestSha256) {}
}
