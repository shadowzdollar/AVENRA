package com.avenra.billing.domain;

import java.util.EnumSet;
import java.util.Set;

/** The subscription's state machine (ADR-037). */
public enum SubscriptionStatus {
    TRIALING,
    ACTIVE,
    PAST_DUE,
    CANCELED;

    public Set<SubscriptionStatus> next() {
        return switch (this) {
            case TRIALING -> EnumSet.of(ACTIVE, PAST_DUE, CANCELED);
            case ACTIVE -> EnumSet.of(PAST_DUE, CANCELED);
            case PAST_DUE -> EnumSet.of(ACTIVE, CANCELED);
            case CANCELED -> EnumSet.of(ACTIVE);
        };
    }

    public boolean mayMoveTo(SubscriptionStatus target) {
        return next().contains(target);
    }
}
