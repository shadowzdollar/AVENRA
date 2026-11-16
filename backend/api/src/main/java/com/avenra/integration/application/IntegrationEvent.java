package com.avenra.integration.application;

import com.avenra.integration.domain.EventType;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

/**
 * An integration event (§57–§58): immutable, versioned, identifiable, timestamped and tenant-aware.
 * Its data holds identifiers and titles only: no secrets, document content or answer values.
 */
record IntegrationEvent(
        UUID id, String type, int version, OffsetDateTime occurredAt, UUID organizationId, Map<String, Object> data) {

    static IntegrationEvent of(EventType type, UUID organizationId, OffsetDateTime at, Map<String, Object> data) {
        return new IntegrationEvent(
                UUID.randomUUID(),
                type.code(),
                EventType.VERSION,
                at.withOffsetSameInstant(ZoneOffset.UTC),
                organizationId,
                Map.copyOf(data));
    }
}
