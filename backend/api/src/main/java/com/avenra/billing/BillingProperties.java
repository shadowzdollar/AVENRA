package com.avenra.billing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Multi-rail billing settings supporting Stripe (cards, digital wallets, bank transfers),
 * Flutterwave (mobile money, regional cards, bank transfers), and Enterprise wire invoicing.
 */
@Validated
@ConfigurationProperties("avenra.billing")
public record BillingProperties(
        @NotNull @Pattern(regexp = "none|fake|stripe|flutterwave|multi") @DefaultValue("fake")
        String provider,

        @DefaultValue("local-dev-billing-webhook-secret") String webhookSecret,

        // Stripe (Visa/Mastercard, Apple Pay, Google Pay, Link, ACH/Wire)
        @DefaultValue("") String stripeApiKey,
        @DefaultValue("") String stripePublishableKey,
        @DefaultValue("") String stripeWebhookSecret,
        @DefaultValue("") String stripePriceStarterMonthly,
        @DefaultValue("") String stripePriceStarterAnnual,
        @DefaultValue("") String stripePriceBusinessMonthly,
        @DefaultValue("") String stripePriceBusinessAnnual,

        // Flutterwave (Mobile Money: MTN MoMo, Airtel Money, M-Pesa, Cards & Bank Transfer)
        @DefaultValue("") String flutterwaveSecretKey,
        @DefaultValue("") String flutterwavePublicKey,
        @DefaultValue("") String flutterwaveWebhookHash,
        @DefaultValue("") String flutterwavePlanStarterMonthly,
        @DefaultValue("") String flutterwavePlanStarterAnnual,
        @DefaultValue("") String flutterwavePlanBusinessMonthly,
        @DefaultValue("") String flutterwavePlanBusinessAnnual,

        // Enterprise Bank Transfer Wire Instructions
        @DefaultValue("Avenra Technologies Inc.") String bankAccountName,
        @DefaultValue("Silicon Valley Commercial Bank") String bankName,
        @DefaultValue("Configure AVENRA_BILLING_BANK_ACCOUNT_NUMBER") String bankAccountNumber,
        @DefaultValue("Configure AVENRA_BILLING_BANK_SWIFT_BIC") String bankSwiftBic,
        @DefaultValue("Configure AVENRA_BILLING_BANK_ROUTING_NUMBER") String bankRoutingNumber) {

    public boolean stripeConfigured() {
        return !stripeApiKey.isBlank();
    }

    public boolean flutterwaveConfigured() {
        return !flutterwaveSecretKey.isBlank();
    }

    @Override
    public String toString() {
        return "BillingProperties[provider=" + provider
                + ", stripeConfigured=" + stripeConfigured()
                + ", flutterwaveConfigured=" + flutterwaveConfigured()
                + "]";
    }
}
