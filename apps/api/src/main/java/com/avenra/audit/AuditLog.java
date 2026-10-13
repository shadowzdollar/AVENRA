package com.avenra.audit;

import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * Records important business actions (Guidelines §59). Events are append-only: neither the
 * application nor its database role can change or delete them. Must be called inside the
 * transaction that performs the action, so the event exists exactly when the action committed.
 */
public interface AuditLog {

    void record(Event event);

    /**
     * @param action what happened, e.g. {@code identity.sign_in.succeeded}
     * @param organizationId the tenant, or {@code null} for account-level events
     * @param actorUserId who did it, or {@code null} for anonymous attempts
     * @param details structured context; never secrets, passwords or tokens
     */
    record Event(
            String action,
            @Nullable UUID organizationId,
            @Nullable UUID actorUserId,
            @Nullable String resourceType,
            @Nullable UUID resourceId,
            Map<String, Object> details) {

        public Event {
            details = Map.copyOf(details);
        }

        public static Event of(String action, @Nullable UUID organizationId, @Nullable UUID actorUserId) {
            return new Event(action, organizationId, actorUserId, null, null, Map.of());
        }

        public Event resource(String type, UUID id) {
            return new Event(action, organizationId, actorUserId, type, id, details);
        }

        public Event detail(String key, Object value) {
            var merged = new java.util.HashMap<>(details);
            merged.put(key, value);
            return new Event(action, organizationId, actorUserId, resourceType, resourceId, merged);
        }
    }
}
