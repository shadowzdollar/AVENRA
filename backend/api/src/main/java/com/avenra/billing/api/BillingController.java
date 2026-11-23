package com.avenra.billing.api;

import com.avenra.billing.application.BillingService;
import com.avenra.billing.application.ProviderEvent;
import com.avenra.billing.application.ProviderEvents;
import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import com.avenra.contract.v1.api.BillingApi;
import com.avenra.contract.v1.model.BillingHistoryItem;
import com.avenra.contract.v1.model.BillingInvoice;
import com.avenra.contract.v1.model.BillingOverview;
import com.avenra.contract.v1.model.BillingPortal;
import com.avenra.contract.v1.model.BillingProviderEvent;
import com.avenra.contract.v1.model.Checkout;
import com.avenra.contract.v1.model.CheckoutRequest;
import com.avenra.contract.v1.model.EnterpriseInvoiceRequest;
import com.avenra.contract.v1.model.PlanDescription;
import com.avenra.contract.v1.model.Subscription;
import com.avenra.contract.v1.model.UsageRecord;
import com.avenra.platform.security.CurrentUser;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.WebUtils;

/** Implements the contract's billing operations (ADR-037). */
@RestController
class BillingController implements BillingApi {

    private final BillingService billing;
    private final ProviderEvents events;

    BillingController(BillingService billing, ProviderEvents events) {
        this.billing = billing;
        this.events = events;
    }

    @Override
    public ResponseEntity<List<PlanDescription>> listPlans() {
        CurrentUser.require();
        return ResponseEntity.ok(billing.plans());
    }

    @Override
    public ResponseEntity<BillingOverview> getBilling(UUID organizationId) {
        return ResponseEntity.ok(billing.overview(userId(), organizationId));
    }

    @Override
    public ResponseEntity<Checkout> startCheckout(UUID organizationId, String idempotencyKey, CheckoutRequest body) {
        BillingInterval interval = body.getInterval() == null
                ? BillingInterval.MONTHLY
                : BillingInterval.valueOf(body.getInterval().getValue());
        PaymentMethodType paymentMethod = body.getPaymentMethod() == null
                ? PaymentMethodType.CARD
                : PaymentMethodType.valueOf(body.getPaymentMethod().getValue());
        return ResponseEntity.ok(billing.checkout(
                userId(),
                organizationId,
                idempotencyKey,
                Plan.valueOf(body.getPlan().getValue()),
                interval,
                paymentMethod,
                body.getPhoneNumber(),
                body.getCurrency()));
    }

    @Override
    public ResponseEntity<Subscription> cancelSubscription(UUID organizationId) {
        return ResponseEntity.ok(billing.cancel(userId(), organizationId));
    }

    @Override
    public ResponseEntity<Subscription> reactivateSubscription(UUID organizationId) {
        return ResponseEntity.ok(billing.reactivate(userId(), organizationId));
    }

    @Override
    public ResponseEntity<BillingPortal> createBillingPortal(UUID organizationId) {
        return ResponseEntity.ok(billing.billingPortal(userId(), organizationId));
    }

    @Override
    public ResponseEntity<List<BillingInvoice>> listBillingInvoices(UUID organizationId) {
        return ResponseEntity.ok(billing.invoices(userId(), organizationId));
    }

    @Override
    public ResponseEntity<BillingInvoice> createEnterpriseInvoice(
            UUID organizationId, String idempotencyKey, EnterpriseInvoiceRequest body) {
        return ResponseEntity.ok(billing.createEnterpriseInvoice(userId(), organizationId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<List<BillingHistoryItem>> listBillingHistory(UUID organizationId) {
        return ResponseEntity.ok(billing.history(userId(), organizationId));
    }

    @Override
    public ResponseEntity<List<UsageRecord>> listUsageRecords(
            UUID organizationId, @Nullable LocalDate from, @Nullable LocalDate to) {
        return ResponseEntity.ok(billing.usage(userId(), organizationId, from, to));
    }

    @Override
    public ResponseEntity<Void> receiveBillingEvent(String provider, String signature, BillingProviderEvent body) {
        var current = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        var cached = WebUtils.getNativeRequest(current, ContentCachingRequestWrapper.class);
        byte[] raw = cached == null ? new byte[0] : cached.getContentAsByteArray();
        events.receive(
                provider,
                signature,
                raw,
                new ProviderEvent(
                        provider,
                        body.getId(),
                        ProviderEvent.Type.of(body.getType().getValue()),
                        body.getOccurredAt(),
                        body.getOrganizationId(),
                        body.getPlan() == null
                                ? null
                                : Plan.valueOf(body.getPlan().getValue()),
                        body.getStatus() == null
                                ? null
                                : SubscriptionStatus.valueOf(body.getStatus().getValue()),
                        body.getCurrentPeriodEnd(),
                        body.getCancelAtPeriodEnd(),
                        body.getCustomerRef(),
                        body.getSubscriptionRef()));
        return ResponseEntity.noContent().build();
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
