package com.avenra.billing.application;

import com.avenra.billing.domain.Plan;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import java.net.URI;

/**
 * The billing provider (ADR-037). It takes payment and owns prices; what it decides comes back as
 * provider events through {@link ProviderEvents}.
 */
public interface BillingProvider {

    String name();

    /** Where the browser goes to pay for {@code plan}; it comes back to {@code returnUrl}. */
    URI checkout(SubscriptionRow current, Plan plan, URI returnUrl);

    /** Asks the provider to end the subscription at the end of its period. */
    void cancelAtPeriodEnd(SubscriptionRow current);
}
