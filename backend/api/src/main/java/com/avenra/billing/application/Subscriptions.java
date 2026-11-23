package com.avenra.billing.application;

import com.avenra.audit.AuditLog;
import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import com.avenra.billing.infrastructure.BillingRepository;
import com.avenra.billing.infrastructure.BillingRepository.EventRow;
import com.avenra.billing.infrastructure.BillingRepository.InvoiceRow;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * The subscription state machine (ADR-037). Every status change, renewal, failed-payment retry,
 * invoice receipt, and cancellation goes through here in the organization's tenant scope.
 */
@Component
class Subscriptions {

    enum Outcome {
        APPLIED,
        STALE,
        REFUSED,
        REPEATED
    }

    private static final Logger log = LoggerFactory.getLogger(Subscriptions.class);

    private final BillingRepository repository;
    private final AuditLog audit;
    private final JsonMapper json;
    private final Clock clock;

    Subscriptions(BillingRepository repository, AuditLog audit, JsonMapper json, Clock clock) {
        this.repository = repository;
        this.audit = audit;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    Outcome apply(ProviderEvent event) {
        if (repository.eventExists(event.provider(), event.id())) {
            return Outcome.REPEATED;
        }
        Optional<SubscriptionRow> locked = repository.lock(event.organizationId());
        if (locked.isEmpty()) {
            log.atWarn()
                    .addKeyValue("billing.event_id", event.id())
                    .log("Billing event for an organization without a subscription ignored");
            return Outcome.REFUSED;
        }
        SubscriptionRow current = locked.get();
        OffsetDateTime now = OffsetDateTime.now(clock);
        Outcome outcome;
        if (current.lastEventAt() != null && !event.occurredAt().isAfter(current.lastEventAt())) {
            outcome = Outcome.STALE;
        } else {
            SubscriptionRow next = next(current, event);
            if (next == null) {
                outcome = Outcome.REFUSED;
                log.atWarn()
                        .addKeyValue("billing.event_id", event.id())
                        .addKeyValue("billing.from", current.status().name())
                        .log("Billing event refused by the subscription state machine");
            } else {
                repository.update(next, now);
                recordInvoiceIfApplicable(next, event, now);
                record(current, next, "billing.subscription_changed", event.id());
                outcome = Outcome.APPLIED;
            }
        }
        repository.insertEvent(
                new EventRow(
                        event.provider(),
                        event.id(),
                        event.organizationId(),
                        event.type().code(),
                        event.occurredAt(),
                        json.writeValueAsString(event),
                        outcome.name()),
                now);
        return outcome;
    }

    private void recordInvoiceIfApplicable(SubscriptionRow next, ProviderEvent event, OffsetDateTime now) {
        if (event.type() != ProviderEvent.Type.PAYMENT_SUCCEEDED
                && event.type() != ProviderEvent.Type.PAYMENT_FAILED
                && !(event.type() == ProviderEvent.Type.SUBSCRIPTION_UPDATED
                        && next.status() == SubscriptionStatus.ACTIVE
                        && event.amountCents() != null)) {
            return;
        }
        Plan plan = next.plan();
        BillingInterval interval = next.billingInterval();
        PaymentMethodType method = next.paymentMethod();
        long amount = event.amountCents() != null ? event.amountCents() : interval.listAmountCents(plan);
        String currency = event.currency() != null ? event.currency() : "USD";
        boolean paid = event.type() != ProviderEvent.Type.PAYMENT_FAILED;
        String invoiceNum = "INV-" + now.getYear() + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        repository.insertInvoice(new InvoiceRow(
                UUID.randomUUID(),
                next.organizationId(),
                invoiceNum,
                plan,
                interval,
                method,
                amount,
                currency,
                paid ? "PAID" : "PAST_DUE",
                event.provider(),
                event.id(),
                event.receiptUrl(),
                event.receiptUrl(),
                null,
                interval == BillingInterval.ANNUAL ? "Annual subscription" : "Monthly subscription",
                null,
                now,
                paid ? now : null,
                now));
    }

    private static @Nullable SubscriptionRow next(SubscriptionRow current, ProviderEvent event) {
        SubscriptionStatus target = switch (event.type()) {
            case SUBSCRIPTION_UPDATED -> event.status() == null ? current.status() : event.status();
            case SUBSCRIPTION_CANCELED -> SubscriptionStatus.CANCELED;
            case PAYMENT_FAILED -> SubscriptionStatus.PAST_DUE;
            case PAYMENT_SUCCEEDED -> SubscriptionStatus.ACTIVE;
        };
        if (target != current.status() && !current.status().mayMoveTo(target)) {
            return null;
        }
        OffsetDateTime pastDueSince = target != SubscriptionStatus.PAST_DUE
                ? null
                : current.status() == SubscriptionStatus.PAST_DUE ? current.pastDueSince() : event.occurredAt();

        int failedAttempts = target == SubscriptionStatus.PAST_DUE
                ? current.failedPaymentAttempts() + 1
                : target == SubscriptionStatus.ACTIVE ? 0 : current.failedPaymentAttempts();

        OffsetDateTime nextRetry = target == SubscriptionStatus.PAST_DUE && failedAttempts <= 3
                ? event.occurredAt().plusHours(48)
                : null;

        boolean cancelAtEnd = target == SubscriptionStatus.CANCELED
                ? false
                : event.cancelAtPeriodEnd() == null ? current.cancelAtPeriodEnd() : event.cancelAtPeriodEnd();

        return new SubscriptionRow(
                current.organizationId(),
                event.plan() == null ? current.plan() : event.plan(),
                target,
                event.billingInterval() == null ? current.billingInterval() : event.billingInterval(),
                event.paymentMethod() == null ? current.paymentMethod() : event.paymentMethod(),
                !cancelAtEnd && target != SubscriptionStatus.CANCELED,
                failedAttempts,
                nextRetry,
                current.trialEndsAt(),
                event.currentPeriodEnd() == null ? current.currentPeriodEnd() : event.currentPeriodEnd(),
                cancelAtEnd,
                pastDueSince,
                event.provider(),
                event.customerRef() == null ? current.customerRef() : event.customerRef(),
                event.subscriptionRef() == null ? current.subscriptionRef() : event.subscriptionRef(),
                event.occurredAt(),
                current.updatedAt());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    void settle(UUID organizationId) {
        var locked = repository.lock(organizationId);
        if (locked.isEmpty()) {
            return;
        }
        SubscriptionRow current = locked.get();
        OffsetDateTime now = OffsetDateTime.now(clock);
        OffsetDateTime periodEnd =
                current.status() == SubscriptionStatus.TRIALING ? current.trialEndsAt() : current.currentPeriodEnd();
        SubscriptionRow next = null;
        if (current.cancelAtPeriodEnd()
                && current.status() != SubscriptionStatus.CANCELED
                && periodEnd != null
                && !now.isBefore(periodEnd)) {
            next = with(current, SubscriptionStatus.CANCELED, null);
        } else if (current.status() == SubscriptionStatus.TRIALING
                && current.trialEndsAt() != null
                && !now.isBefore(current.trialEndsAt())) {
            next = with(current, SubscriptionStatus.PAST_DUE, current.trialEndsAt());
        }
        if (next != null) {
            repository.update(next, now);
            record(current, next, "billing.subscription_changed", null);
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    SubscriptionRow cancelAtPeriodEnd(SubscriptionRow current) {
        var next = new SubscriptionRow(
                current.organizationId(),
                current.plan(),
                current.status(),
                current.billingInterval(),
                current.paymentMethod(),
                false,
                current.failedPaymentAttempts(),
                current.nextRetryAt(),
                current.trialEndsAt(),
                current.currentPeriodEnd(),
                true,
                current.pastDueSince(),
                current.provider(),
                current.customerRef(),
                current.subscriptionRef(),
                current.lastEventAt(),
                current.updatedAt());
        repository.update(next, OffsetDateTime.now(clock));
        return repository.find(current.organizationId()).orElseThrow();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    SubscriptionRow reactivate(SubscriptionRow current) {
        var next = new SubscriptionRow(
                current.organizationId(),
                current.plan(),
                current.status(),
                current.billingInterval(),
                current.paymentMethod(),
                true,
                current.failedPaymentAttempts(),
                current.nextRetryAt(),
                current.trialEndsAt(),
                current.currentPeriodEnd(),
                false,
                current.pastDueSince(),
                current.provider(),
                current.customerRef(),
                current.subscriptionRef(),
                current.lastEventAt(),
                current.updatedAt());
        repository.update(next, OffsetDateTime.now(clock));
        return repository.find(current.organizationId()).orElseThrow();
    }

    private static SubscriptionRow with(
            SubscriptionRow current, SubscriptionStatus status, @Nullable OffsetDateTime pastDueSince) {
        if (!current.status().mayMoveTo(status)) {
            throw new IllegalStateException(current.status() + " may not become " + status);
        }
        return new SubscriptionRow(
                current.organizationId(),
                current.plan(),
                status,
                current.billingInterval(),
                current.paymentMethod(),
                status != SubscriptionStatus.CANCELED && current.autoRenew(),
                current.failedPaymentAttempts(),
                status == SubscriptionStatus.PAST_DUE ? pastDueSince.plusHours(48) : null,
                current.trialEndsAt(),
                current.currentPeriodEnd(),
                status == SubscriptionStatus.CANCELED ? false : current.cancelAtPeriodEnd(),
                pastDueSince,
                current.provider(),
                current.customerRef(),
                current.subscriptionRef(),
                current.lastEventAt(),
                current.updatedAt());
    }

    private void record(SubscriptionRow from, SubscriptionRow to, String action, @Nullable String eventId) {
        var event = AuditLog.Event.of(action, from.organizationId(), null)
                .resource("subscription", from.organizationId())
                .detail("from", from.status().name() + "/" + from.plan().name())
                .detail("to", to.status().name() + "/" + to.plan().name());
        audit.record(eventId == null ? event : event.detail("eventId", eventId));
    }
}
