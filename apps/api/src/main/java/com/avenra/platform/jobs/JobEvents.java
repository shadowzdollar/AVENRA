package com.avenra.platform.jobs;

import java.util.UUID;
import org.jspecify.annotations.Nullable;
import tools.jackson.databind.JsonNode;

/** Published after a job stopped for good, so business modules can raise exceptions (ADR-024). */
public final class JobEvents {

    private JobEvents() {}

    /** The job failed permanently, exhausted its attempts, or needs a person. */
    public record JobStopped(
            UUID jobId, @Nullable UUID organizationId, String type, JsonNode payload, Reason reason, String message) {}

    public enum Reason {
        NON_RETRYABLE,
        DEAD,
        HUMAN_REQUIRED
    }
}
