package com.avenra.billing.infrastructure;

import com.avenra.billing.domain.BillingInterval;
import com.avenra.billing.domain.PaymentMethodType;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Subscriptions, provider events, invoices, and usage records. Every query runs under row-level security. */
@Repository
public class BillingRepository {

    public record SubscriptionRow(
            UUID organizationId,
            Plan plan,
            SubscriptionStatus status,
            BillingInterval billingInterval,
            PaymentMethodType paymentMethod,
            boolean autoRenew,
            int failedPaymentAttempts,
            @Nullable OffsetDateTime nextRetryAt,
            @Nullable OffsetDateTime trialEndsAt,
            @Nullable OffsetDateTime currentPeriodEnd,
            boolean cancelAtPeriodEnd,
            @Nullable OffsetDateTime pastDueSince,
            String provider,
            @Nullable String customerRef,
            @Nullable String subscriptionRef,
            @Nullable OffsetDateTime lastEventAt,
            OffsetDateTime updatedAt) {}

    public record EventRow(
            String provider,
            String eventId,
            UUID organizationId,
            String type,
            OffsetDateTime occurredAt,
            String payload,
            String outcome) {}

    public record InvoiceRow(
            UUID id,
            UUID organizationId,
            String invoiceNumber,
            Plan plan,
            BillingInterval billingInterval,
            PaymentMethodType paymentMethod,
            long amountCents,
            String currency,
            String status,
            String provider,
            @Nullable String providerInvoiceRef,
            @Nullable String hostedUrl,
            @Nullable String receiptUrl,
            @Nullable String purchaseOrder,
            @Nullable String paymentTerms,
            @Nullable String wireReference,
            @Nullable OffsetDateTime dueAt,
            @Nullable OffsetDateTime paidAt,
            OffsetDateTime createdAt) {}

    public record UsageRow(String metric, LocalDate day, long value) {}

    private static final String SUBSCRIPTION_COLUMNS = "organization_id, plan, status, billing_interval,"
            + " payment_method, auto_renew, failed_payment_attempts, next_retry_at, trial_ends_at,"
            + " current_period_end, cancel_at_period_end, past_due_since, provider, customer_ref,"
            + " subscription_ref, last_event_at, updated_at";

    private final JdbcClient jdbc;

    BillingRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insertSubscription(
            UUID organizationId, Plan plan, OffsetDateTime trialEndsAt, String provider, OffsetDateTime now) {
        jdbc.sql("""
                        insert into subscriptions (organization_id, plan, status, billing_interval, payment_method,
                                                   auto_renew, failed_payment_attempts, trial_ends_at, provider,
                                                   created_at, updated_at)
                        values (:org, :plan, 'TRIALING', 'MONTHLY', 'CARD', true, 0, :trialEnds, :provider, :now, :now)
                        on conflict (organization_id) do nothing
                        """)
                .param("org", organizationId)
                .param("plan", plan.name())
                .param("trialEnds", trialEndsAt)
                .param("provider", provider)
                .param("now", now)
                .update();
    }

    public Optional<SubscriptionRow> find(UUID organizationId) {
        return query(
                "select " + SUBSCRIPTION_COLUMNS + " from subscriptions where organization_id = :org", organizationId);
    }

    public Optional<SubscriptionRow> lock(UUID organizationId) {
        return query(
                "select " + SUBSCRIPTION_COLUMNS + " from subscriptions where organization_id = :org for update",
                organizationId);
    }

    private Optional<SubscriptionRow> query(String sql, UUID organizationId) {
        return jdbc.sql(sql)
                .param("org", organizationId)
                .query((rs, row) -> new SubscriptionRow(
                        rs.getObject("organization_id", UUID.class),
                        Plan.valueOf(rs.getString("plan")),
                        SubscriptionStatus.valueOf(rs.getString("status")),
                        BillingInterval.valueOf(rs.getString("billing_interval")),
                        PaymentMethodType.valueOf(rs.getString("payment_method")),
                        rs.getBoolean("auto_renew"),
                        rs.getInt("failed_payment_attempts"),
                        rs.getObject("next_retry_at", OffsetDateTime.class),
                        rs.getObject("trial_ends_at", OffsetDateTime.class),
                        rs.getObject("current_period_end", OffsetDateTime.class),
                        rs.getBoolean("cancel_at_period_end"),
                        rs.getObject("past_due_since", OffsetDateTime.class),
                        rs.getString("provider"),
                        rs.getString("customer_ref"),
                        rs.getString("subscription_ref"),
                        rs.getObject("last_event_at", OffsetDateTime.class),
                        rs.getObject("updated_at", OffsetDateTime.class)))
                .optional();
    }

    public void update(SubscriptionRow row, OffsetDateTime now) {
        jdbc.sql("""
                        update subscriptions set plan = :plan, status = :status, billing_interval = :interval,
                            payment_method = :method, auto_renew = :autoRenew,
                            failed_payment_attempts = :failedAttempts, next_retry_at = :nextRetry,
                            trial_ends_at = :trialEnds, current_period_end = :periodEnd,
                            cancel_at_period_end = :cancel, past_due_since = :pastDue, provider = :provider,
                            customer_ref = :customer, subscription_ref = :subscription,
                            last_event_at = :lastEvent, updated_at = :now
                        where organization_id = :org
                        """)
                .param("org", row.organizationId())
                .param("plan", row.plan().name())
                .param("status", row.status().name())
                .param("interval", row.billingInterval().name())
                .param("method", row.paymentMethod().name())
                .param("autoRenew", row.autoRenew())
                .param("failedAttempts", row.failedPaymentAttempts())
                .param("nextRetry", row.nextRetryAt())
                .param("trialEnds", row.trialEndsAt())
                .param("periodEnd", row.currentPeriodEnd())
                .param("cancel", row.cancelAtPeriodEnd())
                .param("pastDue", row.pastDueSince())
                .param("provider", row.provider())
                .param("customer", row.customerRef())
                .param("subscription", row.subscriptionRef())
                .param("lastEvent", row.lastEventAt())
                .param("now", now)
                .update();
    }

    public boolean insertEvent(EventRow event, OffsetDateTime now) {
        return jdbc.sql("""
                        insert into billing_events (provider, event_id, organization_id, type, occurred_at,
                                                    received_at, payload, outcome)
                        values (:provider, :id, :org, :type, :at, :now, cast(:payload as jsonb), :outcome)
                        on conflict (provider, event_id) do nothing
                        """)
                        .param("provider", event.provider())
                        .param("id", event.eventId())
                        .param("org", event.organizationId())
                        .param("type", event.type())
                        .param("at", event.occurredAt())
                        .param("now", now)
                        .param("payload", event.payload())
                        .param("outcome", event.outcome())
                        .update()
                == 1;
    }

    public boolean eventExists(String provider, String eventId) {
        return jdbc.sql("select count(*) from billing_events where provider = :provider and event_id = :id")
                        .param("provider", provider)
                        .param("id", eventId)
                        .query(Long.class)
                        .single()
                > 0;
    }

    public List<EventRow> history(UUID organizationId) {
        return jdbc.sql("""
                        select provider, event_id, organization_id, type, occurred_at, payload::text, outcome
                        from billing_events
                        where organization_id = :org
                        order by occurred_at desc
                        limit 50
                        """)
                .param("org", organizationId)
                .query((rs, row) -> new EventRow(
                        rs.getString("provider"),
                        rs.getString("event_id"),
                        rs.getObject("organization_id", UUID.class),
                        rs.getString("type"),
                        rs.getObject("occurred_at", OffsetDateTime.class),
                        rs.getString("payload"),
                        rs.getString("outcome")))
                .list();
    }

    public void insertInvoice(InvoiceRow invoice) {
        jdbc.sql("""
                        insert into billing_invoices (
                            id, organization_id, invoice_number, plan, billing_interval, payment_method,
                            amount_cents, currency, status, provider, provider_invoice_ref, hosted_url,
                            receipt_url, purchase_order, payment_terms, wire_reference, due_at, paid_at, created_at
                        ) values (
                            :id, :org, :num, :plan, :interval, :method, :amount, :currency, :status, :provider,
                            :providerRef, :hostedUrl, :receiptUrl, :po, :terms, :wireRef, :dueAt, :paidAt, :createdAt
                        )
                        on conflict (invoice_number) do nothing
                        """)
                .param("id", invoice.id())
                .param("org", invoice.organizationId())
                .param("num", invoice.invoiceNumber())
                .param("plan", invoice.plan().name())
                .param("interval", invoice.billingInterval().name())
                .param("method", invoice.paymentMethod().name())
                .param("amount", invoice.amountCents())
                .param("currency", invoice.currency())
                .param("status", invoice.status())
                .param("provider", invoice.provider())
                .param("providerRef", invoice.providerInvoiceRef())
                .param("hostedUrl", invoice.hostedUrl())
                .param("receiptUrl", invoice.receiptUrl())
                .param("po", invoice.purchaseOrder())
                .param("terms", invoice.paymentTerms())
                .param("wireRef", invoice.wireReference())
                .param("dueAt", invoice.dueAt())
                .param("paidAt", invoice.paidAt())
                .param("createdAt", invoice.createdAt())
                .update();
    }

    public List<InvoiceRow> invoices(UUID organizationId) {
        return jdbc.sql("""
                        select id, organization_id, invoice_number, plan, billing_interval, payment_method,
                               amount_cents, currency, status, provider, provider_invoice_ref, hosted_url,
                               receipt_url, purchase_order, payment_terms, wire_reference, due_at, paid_at, created_at
                        from billing_invoices
                        where organization_id = :org
                        order by created_at desc
                        limit 50
                        """)
                .param("org", organizationId)
                .query((rs, row) -> new InvoiceRow(
                        rs.getObject("id", UUID.class),
                        rs.getObject("organization_id", UUID.class),
                        rs.getString("invoice_number"),
                        Plan.valueOf(rs.getString("plan")),
                        BillingInterval.valueOf(rs.getString("billing_interval")),
                        PaymentMethodType.valueOf(rs.getString("payment_method")),
                        rs.getLong("amount_cents"),
                        rs.getString("currency"),
                        rs.getString("status"),
                        rs.getString("provider"),
                        rs.getString("provider_invoice_ref"),
                        rs.getString("hosted_url"),
                        rs.getString("receipt_url"),
                        rs.getString("purchase_order"),
                        rs.getString("payment_terms"),
                        rs.getString("wire_reference"),
                        rs.getObject("due_at", OffsetDateTime.class),
                        rs.getObject("paid_at", OffsetDateTime.class),
                        rs.getObject("created_at", OffsetDateTime.class)))
                .list();
    }

    public boolean insertUsage(UUID organizationId, String metric, LocalDate day, long value, OffsetDateTime now) {
        return jdbc.sql("""
                        insert into usage_records (organization_id, metric, day, value, recorded_at)
                        values (:org, :metric, :day, :value, :now)
                        on conflict (organization_id, metric, day) do nothing
                        """)
                        .param("org", organizationId)
                        .param("metric", metric)
                        .param("day", day)
                        .param("value", value)
                        .param("now", now)
                        .update()
                == 1;
    }

    public List<UsageRow> usage(UUID organizationId, LocalDate from, LocalDate to) {
        return jdbc.sql("""
                        select metric, day, value from usage_records
                        where organization_id = :org and day between :from and :to
                        order by day, metric
                        """)
                .param("org", organizationId)
                .param("from", from)
                .param("to", to)
                .query((rs, row) ->
                        new UsageRow(rs.getString("metric"), rs.getObject("day", LocalDate.class), rs.getLong("value")))
                .list();
    }
}
