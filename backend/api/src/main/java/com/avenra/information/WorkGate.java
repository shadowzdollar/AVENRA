package com.avenra.information;

import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * What the information module needs to know about work (ADR-026). Defined here and implemented by
 * the work module, so information never depends on work.
 */
public interface WorkGate {

    /** The facts about a work item that information needs. */
    record WorkInfo(
            UUID id,
            UUID organizationId,
            String title,
            boolean finished,
            @Nullable UUID ownerMembershipId) {}

    /**
     * Locks the work for a change to its information and returns it; only open work may change.
     *
     * @throws com.avenra.platform.web.ApiException {@code NOT_FOUND} or {@code WORK_CLOSED}
     */
    WorkInfo lockOpen(UUID organizationId, UUID workId);

    /** The work, if it exists in the organization (or is visible to the request link held). */
    Optional<WorkInfo> find(UUID organizationId, UUID workId);

    /** Records that the work's information changed, so lists show it as recently updated. */
    void touch(UUID organizationId, UUID workId);

    /** The work behind a request link, inside the link's scope (no organization is set). */
    Optional<WorkInfo> findForRequestLink(UUID workId);
}
