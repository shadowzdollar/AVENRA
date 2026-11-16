package com.avenra.billing.application;

import com.avenra.audit.AuditLog;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.infrastructure.BillingRepository;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import com.avenra.contract.v1.model.BillingLimit;
import com.avenra.contract.v1.model.BillingOverview;
import com.avenra.contract.v1.model.Checkout;
import com.avenra.contract.v1.model.Entitlement;
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

/** Plans, the organization's subscription and its usage, as people see and change them (ADR-037). */
@Service
public class BillingService {

    /** New organizations try the Starter plan this long (product default). */
    static final Duration TRIAL = Duration.ofDays(30);

    /** The longest stretch of usage records one request returns. */
    static final int MAX_USAGE_DAYS = 92;

    private final BillingRepository repository;
    private final BillingEntitlements entitlements;
    private final Subscriptions subscriptions;
    private final BillingProvider provider;
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
            OrganizationAccess access,
            Idempotency idempotency,
            AuditLog audit,
            AvenraProperties properties,
            Clock clock) {
        this.repository = repository;
        this.entitlements = entitlements;
        this.subscriptions = subscriptions;
        this.provider = provider;
        this.access = access;
        this.idempotency = idempotency;
        this.audit = audit;
        this.publicBaseUrl = properties.web().publicBaseUrl();
        this.clock = clock;
    }

    /** Every new organization starts on a trial, in the transaction that creates it. */
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

    /** Sends the browser to the provider to pay for a self-serve plan. */
    public Checkout checkout(UUID userId, UUID organizationId, String idempotencyKey, Plan plan) {
        return access.run(
                userId,
                organizationId,
                Permission.BILLING_MANAGE,
                granted -> idempotency.once(
                        userId, "startCheckout", idempotencyKey, organizationId + "|" + plan, Checkout.class, () -> {
                            if (!plan.selfServe()) {
                                throw ApiException.conflict(
                                        "PLAN_NOT_SELF_SERVE",
                                        "The " + plan.displayName() + " plan is agreed with us; please contact us.");
                            }
                            var current = repository.lock(organizationId).orElseThrow(ApiException::notFound);
                            URI back = URI.create(publicBaseUrl.toString().replaceAll("/+$", "") + "/organizations/"
                                    + organizationId + "/billing?checkout=returned");
                            URI url = provider.checkout(current, plan, back);
                            audit.record(AuditLog.Event.of("billing.checkout_started", organizationId, userId)
                                    .resource("subscription", organizationId)
                                    .detail("plan", plan.name()));
                            return new Checkout(url.toString());
                        }));
    }

    /** Ends the subscription at the end of its period (the trial's end, for a trial). */
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
                        entitlements.inGoodStanding(row),
                        row.cancelAtPeriodEnd(),
                        row.provider(),
                        row.updatedAt().withOffsetSameInstant(ZoneOffset.UTC))
                .trialEndsAt(utc(row.trialEndsAt()))
                .currentPeriodEnd(utc(row.currentPeriodEnd()));
    }

    private static @Nullable OffsetDateTime utc(@Nullable OffsetDateTime value) {
        return value == null ? null : value.withOffsetSameInstant(ZoneOffset.UTC);
    }
}
