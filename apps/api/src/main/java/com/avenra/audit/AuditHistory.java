package com.avenra.audit;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * Reads an organization's audit history (ADR-036). Callers authorize first ({@code audit.read})
 * and call inside the organization's tenant scope; row-level security limits reads to it as well.
 */
public interface AuditHistory {

    int PAGE_SIZE = 50;
    int EXPORT_LIMIT = 10_000;

    /**
     * Newest first.
     *
     * @param cursor from a previous page's {@link Page#nextCursor()}
     * @throws com.avenra.platform.web.ApiException when the cursor is not one this produced
     */
    Page page(UUID organizationId, Filter filter, @Nullable String cursor);

    /** Newest first, at most {@link #EXPORT_LIMIT} entries. */
    List<Entry> export(UUID organizationId, Filter filter);

    /**
     * @param actionPrefix actions starting with this, e.g. {@code work.}
     * @param to exclusive
     */
    record Filter(
            @Nullable String actionPrefix,
            @Nullable UUID actorUserId,
            @Nullable OffsetDateTime from,
            @Nullable OffsetDateTime to) {}

    record Entry(
            UUID id,
            OffsetDateTime occurredAt,
            @Nullable UUID actorUserId,
            String action,
            @Nullable String resourceType,
            @Nullable UUID resourceId,
            @Nullable String requestId,
            Map<String, Object> details) {}

    record Page(List<Entry> entries, @Nullable String nextCursor) {}
}
