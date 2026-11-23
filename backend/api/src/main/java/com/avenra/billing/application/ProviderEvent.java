package com.avenra.billing.application;

import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** A change at the billing provider, in Avenra's provider-neutral form (ADR-037). */
public record ProviderEvent(
        String provider,
        String id,
        Type type,
        OffsetDateTime occurredAt,
        UUID organizationId,
        @Nullable Plan plan,
        @Nullable BillingInterval billingInterval,
        @Nullable PaymentMethodType paymentMethod,
        @Nullable SubscriptionStatus status,
        @Nullable OffsetDateTime currentPeriodEnd,
        @Nullable Boolean cancelAtPeriodEnd,
        @Nullable String customerRef,
        @Nullable String subscriptionRef,
        @Nullable Long amountCents,
        @Nullable String currency,
        @Nullable String receiptUrl) {

    /** Backwards-compatible constructor for provider-neutral webhook events. */
    public ProviderEvent(
            String provider,
            String id,
            Type type,
            OffsetDateTime occurredAt,
            UUID organizationId,
            @Nullable Plan plan,
            @Nullable SubscriptionStatus status,
            @Nullable OffsetDateTime currentPeriodEnd,
            @Nullable Boolean cancelAtPeriodEnd,
            @Nullable String customerRef,
            @Nullable String subscriptionRef) {
        this(
                provider,
                id,
                type,
                occurredAt,
                organizationId,
                plan,
                null,
                null,
                status,
                currentPeriodEnd,
                cancelAtPeriodEnd,
                customerRef,
                subscriptionRef,
                null,
                null,
                null);
    }

    public enum Type {
        SUBSCRIPTION_UPDATED("subscription.updated"),
        SUBSCRIPTION_CANCELED("subscription.canceled"),
        PAYMENT_FAILED("payment.failed"),
        PAYMENT_SUCCEEDED("payment.succeeded");

        private final String code;

        Type(String code) {
            this.code = code;
        }

        public String code() {
            return code;
        }

        public static Type of(String code) {
            for (Type type : values()) {
                if (type.code.equals(code)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("unknown billing event type " + code);
        }
    }
}
