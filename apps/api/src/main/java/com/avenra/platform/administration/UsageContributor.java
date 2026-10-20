package com.avenra.platform.administration;

import java.util.List;
import java.util.UUID;

/**
 * A module's usage figures for one organization (ADR-036). Called in that organization's tenant
 * scope; a contributor reads only its own module's tables.
 */
public interface UsageContributor {

    List<Figure> usage(UUID organizationId);

    /**
     * @param key stable identifier, e.g. {@code work.open}
     * @param label what a person reads
     */
    record Figure(String key, String label, long value) {}
}
