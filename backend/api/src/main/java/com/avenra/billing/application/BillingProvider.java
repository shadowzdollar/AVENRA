package com.avenra.billing.application;

import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import java.net.URI;
import org.jspecify.annotations.Nullable;

/**
 * Multi-rail billing provider abstraction. Routes checkout, billing portal, cancellation,
 * and reactivation to Stripe, Flutterwave, or the local sandbox provider.
 */
public interface BillingProvider {

    String name();

    URI checkout(
            SubscriptionRow current,
            Plan plan,
            BillingInterval interval,
            PaymentMethodType paymentMethod,
            @Nullable String phoneNumber,
            @Nullable String currency,
            URI returnUrl);

    URI billingPortal(SubscriptionRow current, URI returnUrl);

    void cancelAtPeriodEnd(SubscriptionRow current);

    void reactivate(SubscriptionRow current);
}
