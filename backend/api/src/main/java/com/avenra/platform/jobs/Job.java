package com.avenra.platform.jobs;

import java.util.UUID;
import org.jspecify.annotations.Nullable;
import tools.jackson.databind.JsonNode;

/**
 * A claimed job as its handler sees it.
 *
 * @param organizationId the tenant, or {@code null} for platform jobs
 * @param attempt the current attempt, starting at 1
 */
public record Job(
        UUID id,
        @Nullable UUID organizationId,
        String type,
        JsonNode payload,
        int attempt,
        int maxAttempts,
        @Nullable String idempotencyKey) {

    public boolean lastAttempt() {
        return attempt >= maxAttempts;
    }
}
