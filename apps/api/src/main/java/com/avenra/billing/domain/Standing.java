package com.avenra.billing.domain;

import java.time.Duration;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

/**
 * Whether a subscription lets the organization add things (ADR-037). A trial and a missed payment
 * each get a grace period (product default seven days); a canceled subscription gets none.
 */
public final class Standing {

    public static final Duration GRACE = Duration.ofDays(7);

    private Standing() {}

    public static boolean good(
            SubscriptionStatus status,
            @Nullable OffsetDateTime trialEndsAt,
            @Nullable OffsetDateTime pastDueSince,
            OffsetDateTime now) {
        return switch (status) {
            case ACTIVE -> true;
            case TRIALING -> trialEndsAt != null && now.isBefore(trialEndsAt.plus(GRACE));
            case PAST_DUE -> pastDueSince != null && now.isBefore(pastDueSince.plus(GRACE));
            case CANCELED -> false;
        };
    }
}
