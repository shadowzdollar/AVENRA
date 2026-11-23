package com.avenra.billing.domain;

import java.time.OffsetDateTime;

/** Subscription billing cadence (monthly or annual). */
public enum BillingInterval {
    MONTHLY,
    ANNUAL;

    public OffsetDateTime nextPeriodEnd(OffsetDateTime from) {
        return this == ANNUAL ? from.plusYears(1) : from.plusMonths(1);
    }

    /** Standard self-serve list price in USD cents (annual reflects 20% discount billed yearly). */
    public long listAmountCents(Plan plan) {
        return switch (plan) {
            case STARTER -> this == ANNUAL ? 46_800L : 4_900L;
            case BUSINESS -> this == ANNUAL ? 142_800L : 14_900L;
            case ENTERPRISE -> this == ANNUAL ? 382_800L : 39_900L;
        };
    }
}
