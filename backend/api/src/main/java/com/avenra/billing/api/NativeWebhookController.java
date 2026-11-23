package com.avenra.billing.api;

import com.avenra.billing.BillingProperties;
import com.avenra.billing.application.ProviderEvent;
import com.avenra.billing.application.ProviderEvents;
import com.avenra.billing.application.WebhookSignature;
import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import com.avenra.platform.web.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Native inbound webhook receivers for Stripe (Cards, Digital Wallets, ACH/Wire) and
 * Flutterwave (Mobile Money, Regional Cards, Bank Transfer).
 */
@RestController
@RequestMapping("/api/v1/billing/webhooks")
class NativeWebhookController {

    private final BillingProperties properties;
    private final ProviderEvents events;
    private final JsonMapper json;
    private final Clock clock;

    NativeWebhookController(BillingProperties properties, ProviderEvents events, JsonMapper json, Clock clock) {
        this.properties = properties;
        this.events = events;
        this.json = json;
        this.clock = clock;
    }

    @PostMapping("/stripe")
    ResponseEntity<Void> receiveStripe(
            @RequestHeader(value = "Stripe-Signature", required = false) String signature,
            @RequestBody byte[] rawBody) {
        String secret = properties.stripeWebhookSecret().isBlank()
                ? properties.webhookSecret()
                : properties.stripeWebhookSecret();
        if (signature == null || !WebhookSignature.valid(secret, signature, rawBody, clock.instant())) {
            throw new ApiException("BILLING_SIGNATURE_INVALID", HttpStatus.UNAUTHORIZED, "Invalid Stripe signature.");
        }
        JsonNode root = json.readTree(new String(rawBody, StandardCharsets.UTF_8));
        String eventId = root.path("id").asString("");
        String stripeType = root.path("type").asString("");
        JsonNode obj = root.path("data").path("object");
        JsonNode meta = obj.path("metadata");
        String orgRaw = meta.path("organization_id").asString(obj.path("client_reference_id").asString(""));
        if (eventId.isBlank() || orgRaw.isBlank()) {
            return ResponseEntity.noContent().build();
        }

        UUID orgId = UUID.fromString(orgRaw);
        OffsetDateTime occurred = OffsetDateTime.ofInstant(
                Instant.ofEpochSecond(root.path("created").asLong(clock.instant().getEpochSecond())), ZoneOffset.UTC);

        ProviderEvent.Type mappedType = switch (stripeType) {
            case "checkout.session.completed", "invoice.paid" -> ProviderEvent.Type.PAYMENT_SUCCEEDED;
            case "invoice.payment_failed" -> ProviderEvent.Type.PAYMENT_FAILED;
            case "customer.subscription.deleted" -> ProviderEvent.Type.SUBSCRIPTION_CANCELED;
            case "customer.subscription.updated" -> ProviderEvent.Type.SUBSCRIPTION_UPDATED;
            default -> null;
        };
        if (mappedType == null) {
            return ResponseEntity.noContent().build();
        }

        Plan plan = parsePlan(meta.path("plan").asString(""));
        BillingInterval interval = parseInterval(meta.path("billing_interval").asString(""));
        PaymentMethodType method = parseMethod(meta.path("payment_method").asString(""));
        long periodEndEpoch = obj.path("current_period_end").asLong(0L);
        OffsetDateTime periodEnd = periodEndEpoch > 0
                ? OffsetDateTime.ofInstant(Instant.ofEpochSecond(periodEndEpoch), ZoneOffset.UTC)
                : (interval != null ? interval.nextPeriodEnd(occurred) : occurred.plusMonths(1));
        Long amountCents = obj.has("amount_paid")
                ? obj.path("amount_paid").asLong()
                : (obj.has("amount_total") ? obj.path("amount_total").asLong() : null);
        String currency = obj.path("currency").asString("usd").toUpperCase();
        String receiptUrl = obj.path("hosted_invoice_url").asString(null);

        events.receiveVerified(new ProviderEvent(
                "stripe",
                eventId,
                mappedType,
                occurred,
                orgId,
                plan,
                interval,
                method,
                mappedType == ProviderEvent.Type.PAYMENT_SUCCEEDED ? SubscriptionStatus.ACTIVE : null,
                periodEnd,
                obj.path("cancel_at_period_end").asBoolean(false),
                obj.path("customer").asString(null),
                obj.path("subscription").asString(obj.path("id").asString(null)),
                amountCents,
                currency,
                receiptUrl));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/flutterwave")
    ResponseEntity<Void> receiveFlutterwave(
            @RequestHeader(value = "verif-hash", required = false) String verifHash,
            @RequestBody byte[] rawBody) {
        String expected = properties.flutterwaveWebhookHash();
        if (expected.isBlank()
                || verifHash == null
                || !MessageDigest.isEqual(
                        expected.getBytes(StandardCharsets.UTF_8), verifHash.getBytes(StandardCharsets.UTF_8))) {
            throw new ApiException(
                    "BILLING_SIGNATURE_INVALID", HttpStatus.UNAUTHORIZED, "Invalid Flutterwave webhook hash.");
        }
        JsonNode root = json.readTree(new String(rawBody, StandardCharsets.UTF_8));
        String flwEvent = root.path("event").asString("");
        JsonNode data = root.path("data");
        JsonNode meta = root.path("meta_data");
        String orgRaw = meta.path("organization_id").asString("");
        String eventId = data.path("id").asString("");
        if (orgRaw.isBlank() || eventId.isBlank()) {
            return ResponseEntity.noContent().build();
        }
        UUID orgId = UUID.fromString(orgRaw);
        OffsetDateTime now = OffsetDateTime.now(clock);
        String status = data.path("status").asString("").toLowerCase();
        ProviderEvent.Type type = "successful".equals(status)
                ? ProviderEvent.Type.PAYMENT_SUCCEEDED
                : ("subscription.cancelled".equals(flwEvent)
                        ? ProviderEvent.Type.SUBSCRIPTION_CANCELED
                        : ProviderEvent.Type.PAYMENT_FAILED);
        Plan plan = parsePlan(meta.path("plan").asString(""));
        BillingInterval interval = parseInterval(meta.path("billing_interval").asString(""));
        PaymentMethodType method = parseMethod(meta.path("payment_method").asString("MOBILE_MONEY"));
        long amountCents = Math.round(data.path("amount").asDouble(0.0) * 100.0);

        events.receiveVerified(new ProviderEvent(
                "flutterwave",
                "flw_" + eventId,
                type,
                now,
                orgId,
                plan,
                interval,
                method,
                type == ProviderEvent.Type.PAYMENT_SUCCEEDED ? SubscriptionStatus.ACTIVE : null,
                (interval != null ? interval : BillingInterval.MONTHLY).nextPeriodEnd(now),
                false,
                data.path("customer").path("id").asString(null),
                data.path("tx_ref").asString(null),
                amountCents > 0 ? amountCents : null,
                data.path("currency").asString("USD").toUpperCase(),
                null));
        return ResponseEntity.noContent().build();
    }

    private static Plan parsePlan(String raw) {
        try {
            return raw.isBlank() ? null : Plan.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static BillingInterval parseInterval(String raw) {
        try {
            return raw.isBlank() ? null : BillingInterval.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static PaymentMethodType parseMethod(String raw) {
        try {
            return raw.isBlank() ? null : PaymentMethodType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
