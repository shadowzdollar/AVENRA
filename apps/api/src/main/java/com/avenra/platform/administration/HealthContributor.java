package com.avenra.platform.administration;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * A module's health checks for one organization (ADR-036). Called in that organization's tenant
 * scope; a contributor reads only its own module's tables.
 */
public interface HealthContributor {

    /** @param since the start of the window the checks look at (the last 24 hours) */
    List<Check> health(UUID organizationId, OffsetDateTime since);

    /**
     * @param key stable identifier, e.g. {@code jobs.failed}
     * @param attention whether someone should look at it
     */
    record Check(String key, String label, long value, boolean attention) {}
}
