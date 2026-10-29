package com.avenra.billing.infrastructure;

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

/** Subscriptions, provider events and usage records. Every query runs under row-level security. */
@Repository
public class BillingRepository {

    public record SubscriptionRow(
            UUID organizationId,
            Plan plan,
            SubscriptionStatus status,
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

    public record UsageRow(String metric, LocalDate day, long value) {}

    private static final String SUBSCRIPTION_COLUMNS = "organization_id, plan, status, trial_ends_at,"
            + " current_period_end, cancel_at_period_end, past_due_since, provider, customer_ref,"
            + " subscription_ref, last_event_at, updated_at";

    private final JdbcClient jdbc;

    BillingRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insertSubscription(
            UUID organizationId, Plan plan, OffsetDateTime trialEndsAt, String provider, OffsetDateTime now) {
        jdbc.sql("""
                        insert into subscriptions (organization_id, plan, status, trial_ends_at, provider, created_at, updated_at)
                        values (:org, :plan, 'TRIALING', :trialEnds, :provider, :now, :now)
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

    /** Locks the subscription for a change. */
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

    /** Writes the whole subscription as decided by the state machine. */
    public void update(SubscriptionRow row, OffsetDateTime now) {
        jdbc.sql("""
                        update subscriptions set plan = :plan, status = :status, trial_ends_at = :trialEnds,
                            current_period_end = :periodEnd, cancel_at_period_end = :cancel,
                            past_due_since = :pastDue, provider = :provider, customer_ref = :customer,
                            subscription_ref = :subscription, last_event_at = :lastEvent, updated_at = :now
                        where organization_id = :org
                        """)
                .param("org", row.organizationId())
                .param("plan", row.plan().name())
                .param("status", row.status().name())
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

    /** Stores a provider event once; false when it was already stored. */
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

    /** Records a day's figure once; a second recording of the same day changes nothing. */
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
