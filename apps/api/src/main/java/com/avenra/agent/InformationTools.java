package com.avenra.agent;

import java.util.List;
import java.util.UUID;

/**
 * What the agent may do with information collection, implemented by the information module
 * (ADR-033). As with {@link WorkTools}, actions run as the given person through the module's own
 * services.
 */
public interface InformationTools {

    /** Titles of the work's requirements, for the planner. */
    List<String> requirementTitles(UUID organizationId, UUID workId);

    /** Creates a requirement as {@code userId}; repeated with the same key, returns the same one. */
    UUID createRequirement(
            UUID userId,
            UUID organizationId,
            UUID workId,
            String idempotencyKey,
            String title,
            String kind,
            boolean required,
            String instructions);

    boolean requirementExists(UUID organizationId, UUID workId, UUID requirementId, String title);

    /** Required requirements of the work without an accepted or submitted answer. */
    List<UUID> openRequiredRequirements(UUID organizationId, UUID workId);

    /** Sends a request link as {@code userId}; repeated with the same key, sends nothing more. */
    UUID sendRequest(
            UUID userId,
            UUID organizationId,
            UUID workId,
            String idempotencyKey,
            String recipientEmail,
            String message,
            List<UUID> requirementIds);

    /** Whether an active request link to that address exists on the work. */
    boolean activeRequestTo(UUID organizationId, UUID workId, UUID linkId, String recipientEmail);
}
