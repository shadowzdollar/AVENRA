package com.avenra.billing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Billing settings (ADR-037).
 *
 * @param provider {@code none} (no checkout, no provider events), {@code fake} (completes
 *     checkouts at once; local development and tests only, refused in production), or {@code stripe}
 * @param webhookSecret signs provider events; required unless the provider is {@code none}
 * @param stripeApiKey secret key for Stripe API calls
 * @param stripePublishableKey publishable key for client-side Stripe integrations
 */
@Validated
@ConfigurationProperties("avenra.billing")
public record BillingProperties(
        @NotNull @Pattern(regexp = "none|fake|stripe") @DefaultValue("none")
        String provider,

        @DefaultValue("") String webhookSecret,
        @DefaultValue("") String stripeApiKey,
        @DefaultValue("") String stripePublishableKey) {

    @Override
    public String toString() {
        return "BillingProperties[provider=" + provider + ", webhookSecret=" + (webhookSecret.isEmpty() ? "" : "***")
                + ", stripeApiKey=" + (stripeApiKey.isEmpty() ? "" : "***")
                + ", stripePublishableKey=" + (stripePublishableKey.isEmpty() ? "" : "***")
                + "]";
    }
}
