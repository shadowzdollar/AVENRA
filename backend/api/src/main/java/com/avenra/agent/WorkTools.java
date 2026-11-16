package com.avenra.agent;

import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * What the agent may do with work, implemented by the work module (ADR-033). Actions run as the
 * given person through the work module's own services, so their permissions and validation apply;
 * the agent never writes another module's tables.
 */
public interface WorkTools {

    /**
     * What the planner and the gateway may know about a work item.
     *
     * @param clientEmail the client's recorded address: the only recipient a request may have
     */
    record WorkFacts(
            String title,
            @Nullable String description,
            @Nullable String type,
            @Nullable String clientEmail,
            boolean open) {}

    /** Facts visible to the current transaction (organization scope). */
    Optional<WorkFacts> facts(UUID organizationId, UUID workId);

    /** Creates a task as {@code userId}; repeated with the same key, returns the same task. */
    UUID createTask(
            UUID userId, UUID organizationId, UUID workId, String idempotencyKey, String title, String condition);

    /** Whether the task exists on that work with that title (verification after execution). */
    boolean taskExists(UUID organizationId, UUID workId, UUID taskId, String title);
}
