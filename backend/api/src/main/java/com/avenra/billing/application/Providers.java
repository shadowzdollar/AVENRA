package com.avenra.billing.application;

import com.avenra.billing.BillingProperties;
import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.web.ApiException;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Configures multi-rail payment gateways: Stripe (Cards, Digital Wallets, Bank Transfers),
 * Flutterwave (Mobile Money, Regional Cards, Bank Transfers), and local Sandbox mode.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(BillingProperties.class)
class Providers {

    @Bean
    BillingProvider billingProvider(
            BillingProperties properties,
            AvenraProperties platform,
            ProviderEvents events,
            JsonMapper json,
            Clock clock) {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        return switch (properties.provider()) {
            case "none" -> new None();
            case "fake" -> {
                if (platform.environment() == AvenraProperties.Environment.PRODUCTION) {
                    throw new IllegalStateException("avenra.billing.provider=fake is not allowed in production");
                }
                yield new Fake(events, clock);
            }
            case "stripe" -> new StripeGateway(properties, http, json);
            case "flutterwave" -> new FlutterwaveGateway(properties, http, json);
            case "multi" -> new MultiRailGateway(properties, platform, events, http, json, clock);
            default -> new Fake(events, clock);
        };
    }

    static final class None implements BillingProvider {
        @Override
        public String name() {
            return "none";
        }

        @Override
        public URI checkout(
                SubscriptionRow current,
                Plan plan,
                BillingInterval interval,
                PaymentMethodType paymentMethod,
                @Nullable String phoneNumber,
                @Nullable String currency,
                URI returnUrl) {
            throw new ApiException(
                    "BILLING_UNAVAILABLE",
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payments are not enabled yet. Please contact sales.");
        }

        @Override
        public URI billingPortal(SubscriptionRow current, URI returnUrl) {
            return returnUrl;
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {}

        @Override
        public void reactivate(SubscriptionRow current) {}
    }

    /** Local sandbox provider that exercises the exact webhook/invoice state machine end-to-end. */
    static final class Fake implements BillingProvider {
        private final ProviderEvents events;
        private final Clock clock;

        Fake(ProviderEvents events, Clock clock) {
            this.events = events;
            this.clock = clock;
        }

        @Override
        public String name() {
            return "fake";
        }

        @Override
        public URI checkout(
                SubscriptionRow current,
                Plan plan,
                BillingInterval interval,
                PaymentMethodType paymentMethod,
                @Nullable String phoneNumber,
                @Nullable String currency,
                URI returnUrl) {
            OffsetDateTime now = OffsetDateTime.now(clock);
            events.queue(new ProviderEvent(
                    name(),
                    "sandbox_evt_" + UUID.randomUUID(),
                    ProviderEvent.Type.PAYMENT_SUCCEEDED,
                    now,
                    current.organizationId(),
                    plan,
                    interval,
                    paymentMethod,
                    SubscriptionStatus.ACTIVE,
                    interval.nextPeriodEnd(now),
                    false,
                    "sandbox_cus_" + current.organizationId(),
                    "sandbox_sub_" + current.organizationId(),
                    interval.listAmountCents(plan),
                    currency == null || currency.isBlank() ? "USD" : currency.toUpperCase(),
                    returnUrl.toString()));
            return returnUrl;
        }

        @Override
        public URI billingPortal(SubscriptionRow current, URI returnUrl) {
            return returnUrl;
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {}

        @Override
        public void reactivate(SubscriptionRow current) {}
    }

    /** Real Stripe REST API v1 gateway (Cards, Apple Pay, Google Pay, Link, ACH/Wire Bank Transfer). */
    static final class StripeGateway implements BillingProvider {
        private final BillingProperties properties;
        private final HttpClient http;
        private final JsonMapper json;

        StripeGateway(BillingProperties properties, HttpClient http, JsonMapper json) {
            this.properties = properties;
            this.http = http;
            this.json = json;
        }

        @Override
        public String name() {
            return "stripe";
        }

        @Override
        public URI checkout(
                SubscriptionRow current,
                Plan plan,
                BillingInterval interval,
                PaymentMethodType paymentMethod,
                @Nullable String phoneNumber,
                @Nullable String currency,
                URI returnUrl) {
            if (!properties.stripeConfigured()) {
                throw new ApiException(
                        "BILLING_CONFIGURATION_MISSING",
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Stripe API key is not configured.");
            }
            String priceId = resolvePriceId(plan, interval);
            Map<String, String> form = new LinkedHashMap<>();
            form.put("mode", "subscription");
            form.put("success_url", returnUrl.toString());
            form.put("cancel_url", returnUrl.toString().replace("checkout=returned", "checkout=canceled"));
            form.put("client_reference_id", current.organizationId().toString());
            form.put("line_items[0][price]", priceId);
            form.put("line_items[0][quantity]", "1");
            form.put("metadata[organization_id]", current.organizationId().toString());
            form.put("metadata[plan]", plan.name());
            form.put("metadata[billing_interval]", interval.name());
            form.put("metadata[payment_method]", paymentMethod.name());
            form.put("subscription_data[metadata][organization_id]", current.organizationId().toString());
            form.put("subscription_data[metadata][plan]", plan.name());
            form.put("subscription_data[metadata][billing_interval]", interval.name());
            form.put("subscription_data[metadata][payment_method]", paymentMethod.name());
            if (current.customerRef() != null && current.customerRef().startsWith("cus_")) {
                form.put("customer", current.customerRef());
            }

            JsonNode res = postForm("https://api.stripe.com/v1/checkout/sessions", form);
            String url = res.path("url").asString("");
            if (url.isBlank()) {
                throw new ApiException(
                        "STRIPE_CHECKOUT_FAILED",
                        HttpStatus.BAD_GATEWAY,
                        "Stripe did not return a checkout URL.");
            }
            return URI.create(url);
        }

        @Override
        public URI billingPortal(SubscriptionRow current, URI returnUrl) {
            if (!properties.stripeConfigured() || current.customerRef() == null || !current.customerRef().startsWith("cus_")) {
                return returnUrl;
            }
            Map<String, String> form = new LinkedHashMap<>();
            form.put("customer", current.customerRef());
            form.put("return_url", returnUrl.toString());
            JsonNode res = postForm("https://api.stripe.com/v1/billing_portal/sessions", form);
            String url = res.path("url").asString("");
            return url.isBlank() ? returnUrl : URI.create(url);
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {
            updateCancelFlag(current, true);
        }

        @Override
        public void reactivate(SubscriptionRow current) {
            updateCancelFlag(current, false);
        }

        private void updateCancelFlag(SubscriptionRow current, boolean cancelAtEnd) {
            if (!properties.stripeConfigured()
                    || current.subscriptionRef() == null
                    || !current.subscriptionRef().startsWith("sub_")) {
                return;
            }
            Map<String, String> form = Map.of("cancel_at_period_end", Boolean.toString(cancelAtEnd));
            postForm("https://api.stripe.com/v1/subscriptions/" + current.subscriptionRef(), form);
        }

        private String resolvePriceId(Plan plan, BillingInterval interval) {
            String priceId = switch (plan) {
                case STARTER -> interval == BillingInterval.ANNUAL
                        ? properties.stripePriceStarterAnnual()
                        : properties.stripePriceStarterMonthly();
                case BUSINESS -> interval == BillingInterval.ANNUAL
                        ? properties.stripePriceBusinessAnnual()
                        : properties.stripePriceBusinessMonthly();
                case ENTERPRISE -> "";
            };
            if (priceId.isBlank()) {
                throw new ApiException(
                        "STRIPE_PRICE_NOT_CONFIGURED",
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Stripe Price ID for " + plan.name() + " (" + interval.name() + ") is not configured.");
            }
            return priceId;
        }

        private JsonNode postForm(String url, Map<String, String> form) {
            String encoded = form.entrySet().stream()
                    .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "="
                            + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining("&"));
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .header("Authorization", "Bearer " + properties.stripeApiKey())
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(encoded))
                    .build();
            try {
                HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
                JsonNode node = json.readTree(response.body());
                if (response.statusCode() >= 400) {
                    String msg = node.path("error").path("message").asString("Stripe request failed");
                    throw new ApiException("STRIPE_API_ERROR", HttpStatus.BAD_GATEWAY, msg);
                }
                return node;
            } catch (IOException | InterruptedException ex) {
                if (ex instanceof InterruptedException) Thread.currentThread().interrupt();
                throw new ApiException("STRIPE_UNREACHABLE", HttpStatus.BAD_GATEWAY, "Could not reach Stripe API.");
            }
        }
    }

    /** Real Flutterwave v3 REST API gateway (Mobile Money: MTN MoMo, Airtel Money, M-Pesa + Cards + Bank Transfer). */
    static final class FlutterwaveGateway implements BillingProvider {
        private final BillingProperties properties;
        private final HttpClient http;
        private final JsonMapper json;

        FlutterwaveGateway(BillingProperties properties, HttpClient http, JsonMapper json) {
            this.properties = properties;
            this.http = http;
            this.json = json;
        }

        @Override
        public String name() {
            return "flutterwave";
        }

        @Override
        public URI checkout(
                SubscriptionRow current,
                Plan plan,
                BillingInterval interval,
                PaymentMethodType paymentMethod,
                @Nullable String phoneNumber,
                @Nullable String currency,
                URI returnUrl) {
            if (!properties.flutterwaveConfigured()) {
                throw new ApiException(
                        "BILLING_CONFIGURATION_MISSING",
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Flutterwave secret key is not configured.");
            }
            String txRef = "avenra_" + current.organizationId() + "_" + UUID.randomUUID().toString().substring(0, 8);
            long amountUnits = Math.max(1, interval.listAmountCents(plan) / 100L);
            String resolvedCurrency = currency == null || currency.isBlank() ? "USD" : currency.toUpperCase();
            String paymentPlan = resolvePlanId(plan, interval);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("tx_ref", txRef);
            body.put("amount", amountUnits);
            body.put("currency", resolvedCurrency);
            body.put("redirect_url", returnUrl.toString());
            body.put(
                    "payment_options",
                    "card,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneykenya,mobilemoneyghana,mpesa,banktransfer,ussd");
            if (!paymentPlan.isBlank()) {
                body.put("payment_plan", paymentPlan);
            }
            Map<String, Object> customer = new LinkedHashMap<>();
            customer.put("email", "billing@" + current.organizationId() + ".avenra.local");
            if (phoneNumber != null && !phoneNumber.isBlank()) {
                customer.put("phonenumber", phoneNumber.trim());
            }
            customer.put("name", "Avenra Workspace");
            body.put("customer", customer);
            body.put(
                    "meta",
                    Map.of(
                            "organization_id", current.organizationId().toString(),
                            "plan", plan.name(),
                            "billing_interval", interval.name(),
                            "payment_method", paymentMethod.name()));
            body.put(
                    "customizations",
                    Map.of(
                            "title", "Avenra " + plan.displayName() + " (" + interval.name() + ")",
                            "description", "Autonomous work execution subscription"));

            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.flutterwave.com/v3/payments"))
                    .header("Authorization", "Bearer " + properties.flutterwaveSecretKey())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                    .build();
            try {
                HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
                JsonNode node = json.readTree(response.body());
                String link = node.path("data").path("link").asString("");
                if (response.statusCode() >= 400 || link.isBlank()) {
                    String msg = node.path("message").asString("Flutterwave checkout initialization failed");
                    throw new ApiException("FLUTTERWAVE_API_ERROR", HttpStatus.BAD_GATEWAY, msg);
                }
                return URI.create(link);
            } catch (IOException | InterruptedException ex) {
                if (ex instanceof InterruptedException) Thread.currentThread().interrupt();
                throw new ApiException(
                        "FLUTTERWAVE_UNREACHABLE", HttpStatus.BAD_GATEWAY, "Could not reach Flutterwave API.");
            }
        }

        @Override
        public URI billingPortal(SubscriptionRow current, URI returnUrl) {
            return returnUrl;
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {}

        @Override
        public void reactivate(SubscriptionRow current) {}

        private String resolvePlanId(Plan plan, BillingInterval interval) {
            return switch (plan) {
                case STARTER -> interval == BillingInterval.ANNUAL
                        ? properties.flutterwavePlanStarterAnnual()
                        : properties.flutterwavePlanStarterMonthly();
                case BUSINESS -> interval == BillingInterval.ANNUAL
                        ? properties.flutterwavePlanBusinessAnnual()
                        : properties.flutterwavePlanBusinessMonthly();
                case ENTERPRISE -> "";
            };
        }
    }

    /**
     * Multi-rail router: dispatches Mobile Money to Flutterwave, Cards & Digital Wallets to Stripe,
     * and gracefully falls back to the local sandbox in non-production environments when keys are unset.
     */
    static final class MultiRailGateway implements BillingProvider {
        private final BillingProperties properties;
        private final AvenraProperties platform;
        private final StripeGateway stripe;
        private final FlutterwaveGateway flutterwave;
        private final Fake sandbox;

        MultiRailGateway(
                BillingProperties properties,
                AvenraProperties platform,
                ProviderEvents events,
                HttpClient http,
                JsonMapper json,
                Clock clock) {
            this.properties = properties;
            this.platform = platform;
            this.stripe = new StripeGateway(properties, http, json);
            this.flutterwave = new FlutterwaveGateway(properties, http, json);
            this.sandbox = new Fake(events, clock);
        }

        @Override
        public String name() {
            return "multi";
        }

        @Override
        public URI checkout(
                SubscriptionRow current,
                Plan plan,
                BillingInterval interval,
                PaymentMethodType paymentMethod,
                @Nullable String phoneNumber,
                @Nullable String currency,
                URI returnUrl) {
            if (paymentMethod == PaymentMethodType.MOBILE_MONEY) {
                if (properties.flutterwaveConfigured()) {
                    return flutterwave.checkout(current, plan, interval, paymentMethod, phoneNumber, currency, returnUrl);
                }
            } else if (properties.stripeConfigured()) {
                return stripe.checkout(current, plan, interval, paymentMethod, phoneNumber, currency, returnUrl);
            } else if (properties.flutterwaveConfigured()) {
                return flutterwave.checkout(current, plan, interval, paymentMethod, phoneNumber, currency, returnUrl);
            }
            if (platform.environment() == AvenraProperties.Environment.PRODUCTION) {
                throw new ApiException(
                        "BILLING_CONFIGURATION_MISSING",
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Payment gateway credentials are not configured for " + paymentMethod.name());
            }
            return sandbox.checkout(current, plan, interval, paymentMethod, phoneNumber, currency, returnUrl);
        }

        @Override
        public URI billingPortal(SubscriptionRow current, URI returnUrl) {
            return properties.stripeConfigured() ? stripe.billingPortal(current, returnUrl) : returnUrl;
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {
            if (properties.stripeConfigured()) stripe.cancelAtPeriodEnd(current);
        }

        @Override
        public void reactivate(SubscriptionRow current) {
            if (properties.stripeConfigured()) stripe.reactivate(current);
        }
    }
}
