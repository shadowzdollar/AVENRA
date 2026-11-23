package com.avenra.billing.application;

import com.avenra.audit.AuditLog;
import com.avenra.billing.BillingProperties;
import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.infrastructure.BillingRepository;
import com.avenra.billing.infrastructure.BillingRepository.InvoiceRow;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import com.avenra.contract.v1.model.BillingHistoryItem;
import com.avenra.contract.v1.model.BillingInvoice;
import com.avenra.contract.v1.model.BillingLimit;
import com.avenra.contract.v1.model.BillingOverview;
import com.avenra.contract.v1.model.BillingPortal;
import com.avenra.contract.v1.model.Checkout;
import com.avenra.contract.v1.model.Entitlement;
import com.avenra.contract.v1.model.EnterpriseInvoiceRequest;
import com.avenra.contract.v1.model.InvoiceStatus;
import com.avenra.contract.v1.model.PlanDescription;
import com.avenra.contract.v1.model.PlanLimit;
import com.avenra.contract.v1.model.Subscription;
import com.avenra.contract.v1.model.UsageRecord;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.OrganizationEvents;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.entitlements.Entitlements.Limit;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.web.ApiException;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/** Central billing engine: multi-rail subscriptions, renewals, retries, invoices, and usage (ADR-037). */
@Service
public class BillingService {

    static final Duration TRIAL = Duration.ofDays(30);
    static final int MAX_USAGE_DAYS = 92;

    private final BillingRepository repository;
    private final BillingEntitlements entitlements;
    private final Subscriptions subscriptions;
    private final BillingProvider provider;
    private final BillingProperties billingProperties;
    private final OrganizationAccess access;
    private final Idempotency idempotency;
    private final AuditLog audit;
    private final URI publicBaseUrl;
    private final Clock clock;

    BillingService(
            BillingRepository repository,
            BillingEntitlements entitlements,
            Subscriptions subscriptions,
            BillingProvider provider,
            BillingProperties billingProperties,
            OrganizationAccess access,
            Idempotency idempotency,
            AuditLog audit,
            AvenraProperties properties,
            Clock clock) {
        this.repository = repository;
        this.entitlements = entitlements;
        this.subscriptions = subscriptions;
        this.provider = provider;
        this.billingProperties = billingProperties;
        this.access = access;
        this.idempotency = idempotency;
        this.audit = audit;
        this.publicBaseUrl = properties.web().publicBaseUrl();
        this.clock = clock;
    }

    @EventListener
    void on(OrganizationEvents.Created created) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        repository.insertSubscription(created.organizationId(), Plan.STARTER, now.plus(TRIAL), provider.name(), now);
    }

    public List<PlanDescription> plans() {
        return Arrays.stream(Plan.values())
                .map(plan -> new PlanDescription(
                        com.avenra.contract.v1.model.Plan.fromValue(plan.name()),
                        plan.displayName(),
                        plan.selfServe(),
                        Arrays.stream(Limit.values())
                                .map(limit -> {
                                    var allowed = plan.allowed(limit);
                                    return new PlanLimit(BillingLimit.fromValue(limit.code()), Labels.of(limit))
                                            .allowed(allowed.isPresent() ? allowed.getAsLong() : null);
                                })
                                .toList()))
                .toList();
    }

    public BillingOverview overview(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.BILLING_READ, granted -> {
            var subscription = repository.find(organizationId).orElseThrow(ApiException::notFound);
            var figures = entitlements.figures(organizationId);
            return new BillingOverview(
                    toApi(subscription),
                    Arrays.stream(Limit.values())
                            .map(limit -> {
                                var allowed = subscription.plan().allowed(limit);
                                return new Entitlement(
                                                BillingLimit.fromValue(limit.code()),
                                                Labels.of(limit),
                                                BillingEntitlements.used(figures, limit))
                                        .allowed(allowed.isPresent() ? allowed.getAsLong() : null);
                            })
                            .toList());
        });
    }

    public Checkout checkout(
            UUID userId,
            UUID organizationId,
            String idempotencyKey,
            Plan plan,
            BillingInterval interval,
            PaymentMethodType paymentMethod,
            @Nullable String phoneNumber,
            @Nullable String currency) {
        return access.run(
                userId,
                organizationId,
                Permission.BILLING_MANAGE,
                granted -> idempotency.once(
                        userId,
                        "startCheckout",
                        idempotencyKey,
                        organizationId + "|" + plan + "|" + interval + "|" + paymentMethod,
                        Checkout.class,
                        () -> {
                            if (!plan.selfServe()) {
                                throw ApiException.conflict(
                                        "PLAN_NOT_SELF_SERVE",
                                        "The " + plan.displayName()
                                                + " plan uses an Enterprise contract invoice.");
                            }
                            var current = repository.lock(organizationId).orElseThrow(ApiException::notFound);
                            URI back = URI.create(publicBaseUrl.toString().replaceAll("/+$", "")
                                    + "/dashboard/billing?checkout=returned");
                            URI url = provider.checkout(
                                    current, plan, interval, paymentMethod, phoneNumber, currency, back);
                            audit.record(AuditLog.Event.of("billing.checkout_started", organizationId, userId)
                                    .resource("subscription", organizationId)
                                    .detail("plan", plan.name())
                                    .detail("interval", interval.name())
                                    .detail("paymentMethod", paymentMethod.name()));
                            return new Checkout(url.toString());
                        }));
    }

    public Subscription cancel(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.BILLING_MANAGE, granted -> {
            var current = repository.lock(organizationId).orElseThrow(ApiException::notFound);
            if (current.status() == com.avenra.billing.domain.SubscriptionStatus.CANCELED
                    || current.cancelAtPeriodEnd()) {
                return toApi(current);
            }
            provider.cancelAtPeriodEnd(current);
            var updated = subscriptions.cancelAtPeriodEnd(current);
            audit.record(AuditLog.Event.of("billing.cancellation_requested", organizationId, userId)
                    .resource("subscription", organizationId));
            return toApi(updated);
        });
    }

    public Subscription reactivate(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.BILLING_MANAGE, granted -> {
            var current = repository.lock(organizationId).orElseThrow(ApiException::notFound);
            if (!current.cancelAtPeriodEnd()) {
                return toApi(current);
            }
            provider.reactivate(current);
            var updated = subscriptions.reactivate(current);
            audit.record(AuditLog.Event.of("billing.subscription_reactivated", organizationId, userId)
                    .resource("subscription", organizationId));
            return toApi(updated);
        });
    }

    public BillingPortal billingPortal(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.BILLING_MANAGE, granted -> {
            var current = repository.find(organizationId).orElseThrow(ApiException::notFound);
            URI back = URI.create(publicBaseUrl.toString().replaceAll("/+$", "") + "/dashboard/billing");
            return new BillingPortal(provider.billingPortal(current, back).toString());
        });
    }

    public List<BillingInvoice> invoices(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.BILLING_READ,
                granted -> repository.invoices(organizationId).stream().map(this::toApi).toList());
    }

    public BillingInvoice createEnterpriseInvoice(
            UUID userId, UUID organizationId, String idempotencyKey, EnterpriseInvoiceRequest request) {
        return access.run(
                userId,
                organizationId,
                Permission.BILLING_MANAGE,
                granted -> idempotency.once(
                        userId,
                        "createEnterpriseInvoice",
                        idempotencyKey,
                        organizationId + "|" + request.getBillingEmail() + "|" + request.getPurchaseOrder(),
                        BillingInvoice.class,
                        () -> {
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            int seats = request.getSeats() == null ? 15 : request.getSeats();
                            long annualCents = Math.max(382_800L, seats * 25_000L);
                            String currency =
                                    request.getCurrency() == null || request.getCurrency().isBlank()
                                            ? "USD"
                                            : request.getCurrency().toUpperCase();
                            String invNumber = "INV-ENT-" + now.getYear() + "-"
                                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                            String wireRef = "AVR-WIRE-"
                                    + organizationId.toString().substring(0, 6).toUpperCase()
                                    + "-"
                                    + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                            String terms = request.getPaymentTerms() == null || request.getPaymentTerms().isBlank()
                                    ? "Net 30 · Annual Bank Transfer (" + billingProperties.bankName() + " · "
                                            + billingProperties.bankAccountName() + ")"
                                    : request.getPaymentTerms();

                            InvoiceRow row = new InvoiceRow(
                                    UUID.randomUUID(),
                                    organizationId,
                                    invNumber,
                                    Plan.ENTERPRISE,
                                    BillingInterval.ANNUAL,
                                    PaymentMethodType.BANK_TRANSFER,
                                    annualCents,
                                    currency,
                                    "OPEN",
                                    "enterprise_wire",
                                    wireRef,
                                    null,
                                    null,
                                    request.getPurchaseOrder(),
                                    terms,
                                    wireRef,
                                    now.plusDays(30),
                                    null,
                                    now);
                            repository.insertInvoice(row);
                            audit.record(AuditLog.Event.of("billing.enterprise_invoice_created", organizationId, userId)
                                    .resource("invoice", row.id())
                                    .detail("invoiceNumber", invNumber)
                                    .detail("wireReference", wireRef));
                            return toApi(row);
                        }));
    }

    public List<BillingHistoryItem> history(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.BILLING_READ,
                granted -> repository.history(organizationId).stream()
                        .map(e -> new BillingHistoryItem(
                                e.eventId(),
                                e.provider(),
                                e.type(),
                                e.outcome(),
                                e.occurredAt().withOffsetSameInstant(ZoneOffset.UTC)))
                        .toList());
    }

    public List<UsageRecord> usage(UUID userId, UUID organizationId, @Nullable LocalDate from, @Nullable LocalDate to) {
        LocalDate last = to == null ? LocalDate.now(clock.withZone(ZoneOffset.UTC)) : to;
        LocalDate first = from == null ? last.minusDays(30) : from;
        if (first.isAfter(last)) {
            throw ApiException.invalid("from", "must not be after to");
        }
        if (ChronoUnit.DAYS.between(first, last) >= MAX_USAGE_DAYS) {
            throw ApiException.invalid("from", "at most " + MAX_USAGE_DAYS + " days at a time");
        }
        return access.run(
                userId,
                organizationId,
                Permission.BILLING_READ,
                granted -> repository.usage(organizationId, first, last).stream()
                        .map(row -> new UsageRecord(row.metric(), row.day(), row.value()))
                        .toList());
    }

    private Subscription toApi(SubscriptionRow row) {
        return new Subscription(
                        com.avenra.contract.v1.model.Plan.fromValue(row.plan().name()),
                        com.avenra.contract.v1.model.SubscriptionStatus.fromValue(
                                row.status().name()),
                        com.avenra.contract.v1.model.BillingInterval.fromValue(
                                row.billingInterval().name()),
                        com.avenra.contract.v1.model.PaymentMethodType.fromValue(
                                row.paymentMethod().name()),
                        row.autoRenew(),
                        row.failedPaymentAttempts(),
                        entitlements.inGoodStanding(row),
                        row.cancelAtPeriodEnd(),
                        row.provider(),
                        row.updatedAt().withOffsetSameInstant(ZoneOffset.UTC))
                .nextRetryAt(utc(row.nextRetryAt()))
                .trialEndsAt(utc(row.trialEndsAt()))
                .currentPeriodEnd(utc(row.currentPeriodEnd()));
    }

    private BillingInvoice toApi(InvoiceRow row) {
        return new BillingInvoice(
                        row.id(),
                        row.invoiceNumber(),
                        com.avenra.contract.v1.model.Plan.fromValue(row.plan().name()),
                        com.avenra.contract.v1.model.BillingInterval.fromValue(
                                row.billingInterval().name()),
                        com.avenra.contract.v1.model.PaymentMethodType.fromValue(
                                row.paymentMethod().name()),
                        row.amountCents(),
                        row.currency(),
                        InvoiceStatus.fromValue(row.status()),
                        row.provider(),
                        row.createdAt().withOffsetSameInstant(ZoneOffset.UTC))
                .hostedUrl(row.hostedUrl())
                .receiptUrl(row.receiptUrl())
                .purchaseOrder(row.purchaseOrder())
                .paymentTerms(row.paymentTerms())
                .wireReference(row.wireReference())
                .dueAt(utc(row.dueAt()))
                .paidAt(utc(row.paidAt()));
    }

    private static @Nullable OffsetDateTime utc(@Nullable OffsetDateTime value) {
        return value == null ? null : value.withOffsetSameInstant(ZoneOffset.UTC);
    }
}
