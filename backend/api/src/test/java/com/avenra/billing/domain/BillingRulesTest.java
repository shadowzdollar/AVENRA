package com.avenra.billing.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.platform.entitlements.Entitlements.Limit;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

/** Plans, the subscription state machine and standing (ADR-037). */
class BillingRulesTest {

    private static final OffsetDateTime NOW = OffsetDateTime.parse("2026-10-20T12:00:00Z");

    @Test
    void everySelfServePlanLimitsEverythingAndEnterpriseNothing() {
        for (Limit limit : Limit.values()) {
            assertThat(Plan.STARTER.allowed(limit)).as(limit.name()).isPresent();
            assertThat(Plan.BUSINESS.allowed(limit).getAsLong())
                    .as(limit.name())
                    .isGreaterThan(Plan.STARTER.allowed(limit).getAsLong());
            assertThat(Plan.ENTERPRISE.allowed(limit)).as(limit.name()).isEmpty();
        }
        assertThat(Plan.ENTERPRISE.selfServe()).isFalse();
    }

    @Test
    void theStateMachineAllowsOnlyTheRecordedMoves() {
        assertThat(SubscriptionStatus.TRIALING.mayMoveTo(SubscriptionStatus.ACTIVE))
                .isTrue();
        assertThat(SubscriptionStatus.ACTIVE.mayMoveTo(SubscriptionStatus.TRIALING))
                .isFalse();
        assertThat(SubscriptionStatus.CANCELED.mayMoveTo(SubscriptionStatus.PAST_DUE))
                .isFalse();
        assertThat(SubscriptionStatus.CANCELED.mayMoveTo(SubscriptionStatus.ACTIVE))
                .isTrue();
        assertThat(SubscriptionStatus.PAST_DUE.mayMoveTo(SubscriptionStatus.ACTIVE))
                .isTrue();
    }

    @Test
    void standingKeepsAGracePeriodAfterATrialOrAMissedPayment() {
        assertThat(Standing.good(SubscriptionStatus.ACTIVE, null, null, NOW)).isTrue();
        assertThat(Standing.good(SubscriptionStatus.TRIALING, NOW.minusDays(6), null, NOW))
                .isTrue();
        assertThat(Standing.good(SubscriptionStatus.TRIALING, NOW.minusDays(7), null, NOW))
                .isFalse();
        assertThat(Standing.good(SubscriptionStatus.PAST_DUE, null, NOW.minusDays(3), NOW))
                .isTrue();
        assertThat(Standing.good(SubscriptionStatus.PAST_DUE, null, NOW.minusDays(8), NOW))
                .isFalse();
        assertThat(Standing.good(SubscriptionStatus.CANCELED, NOW.plusDays(5), null, NOW))
                .isFalse();
    }
}
