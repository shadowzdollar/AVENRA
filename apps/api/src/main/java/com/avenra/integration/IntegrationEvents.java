package com.avenra.integration;

import java.util.UUID;

/** Facts the integration module publishes, inside the transaction that recorded them. */
public final class IntegrationEvents {

    private IntegrationEvents() {}

    /** A connection kept failing and was paused; the organization's admins should look at it. */
    public record ConnectionPaused(UUID organizationId, UUID connectionId, String name, int consecutiveFailures) {}
}
