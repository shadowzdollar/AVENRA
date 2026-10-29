package com.avenra.billing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Billing settings (ADR-037).
 *
 * @param provider {@code none} (no checkout, no provider events) or {@code fake} (completes
 *     checkouts at once; local development and tests only, refused in production)
 * @param webhookSecret signs provider events; required unless the provider is {@code none}
 */
@Validated
@ConfigurationProperties("avenra.billing")
public record BillingProperties(
        @NotNull @Pattern(regexp = "none|fake") @DefaultValue("none")
        String provider,

        @DefaultValue("") String webhookSecret) {

    @Override
    public String toString() {
        return "BillingProperties[provider=" + provider + ", webhookSecret=" + (webhookSecret.isEmpty() ? "" : "***")
                + "]";
    }
}
