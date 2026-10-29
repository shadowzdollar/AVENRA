-- Billing (Phase 11): subscriptions, provider events and usage records (ADR-037).

-- One subscription per organization. Status changes go through the
-- application's state machine; prices live only at the billing provider.
CREATE TABLE subscriptions (
    organization_id      uuid        PRIMARY KEY REFERENCES organizations (id) ON DELETE CASCADE,
    plan                 text        NOT NULL,
    status               text        NOT NULL,
    trial_ends_at        timestamptz,
    current_period_end   timestamptz,
    cancel_at_period_end boolean     NOT NULL DEFAULT false,
    past_due_since       timestamptz,
    provider             text        NOT NULL,
    customer_ref         text,
    subscription_ref     text,
    last_event_at        timestamptz,
    created_at           timestamptz NOT NULL,
    updated_at           timestamptz NOT NULL,
    CONSTRAINT subscriptions_plan_valid CHECK (plan IN ('STARTER', 'BUSINESS', 'ENTERPRISE')),
    CONSTRAINT subscriptions_status_valid CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED')),
    CONSTRAINT subscriptions_trial_has_end CHECK (status <> 'TRIALING' OR trial_ends_at IS NOT NULL),
    CONSTRAINT subscriptions_past_due_has_start CHECK ((status = 'PAST_DUE') = (past_due_since IS NOT NULL)),
    CONSTRAINT subscriptions_refs_length CHECK (char_length(coalesce(customer_ref, '')) <= 200
        AND char_length(coalesce(subscription_ref, '')) <= 200)
);

-- Organizations that exist before billing start on a trial from today.
INSERT INTO subscriptions (organization_id, plan, status, trial_ends_at, provider, created_at, updated_at)
SELECT id, 'STARTER', 'TRIALING', now() + interval '30 days', 'none', now(), now() FROM organizations;

-- Every provider event, stored once by its id, with what it did.
CREATE TABLE billing_events (
    provider        text        NOT NULL,
    event_id        text        NOT NULL,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    type            text        NOT NULL,
    occurred_at     timestamptz NOT NULL,
    received_at     timestamptz NOT NULL,
    payload         jsonb       NOT NULL,
    outcome         text        NOT NULL,
    PRIMARY KEY (provider, event_id),
    CONSTRAINT billing_events_outcome_valid CHECK (outcome IN ('APPLIED', 'STALE', 'REFUSED'))
);
CREATE INDEX billing_events_org_idx ON billing_events (organization_id, occurred_at DESC);

-- Append-only daily usage, one record per organization, metric and day, so a
-- bill can be recalculated from the records alone (Guidelines §111).
CREATE TABLE usage_records (
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    metric          text        NOT NULL,
    day             date        NOT NULL,
    value           bigint      NOT NULL,
    recorded_at     timestamptz NOT NULL,
    PRIMARY KEY (organization_id, metric, day),
    CONSTRAINT usage_records_value_valid CHECK (value >= 0)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_tenant ON subscriptions
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY billing_events_tenant ON billing_events
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY usage_records_tenant ON usage_records
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());

REVOKE DELETE, TRUNCATE ON subscriptions FROM ${app_role};
REVOKE UPDATE, DELETE, TRUNCATE ON billing_events FROM ${app_role};
REVOKE UPDATE, DELETE, TRUNCATE ON usage_records FROM ${app_role};

-- Once a day: one job per organization records usage and moves ended trials.
CREATE FUNCTION sweep_billing_daily()
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'billing.daily', '{}'::jsonb, 'QUEUED', 5, now(),
               'billing-daily:' || organization_id || ':' || (now() AT TIME ZONE 'UTC')::date, now(), now()
        FROM subscriptions
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;
REVOKE EXECUTE ON FUNCTION sweep_billing_daily() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sweep_billing_daily() TO ${app_role};
