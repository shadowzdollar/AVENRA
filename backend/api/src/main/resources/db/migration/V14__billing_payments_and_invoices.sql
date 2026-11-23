-- Multi-rail payments, billing intervals, retries, and invoices/receipts.

ALTER TABLE subscriptions
    ADD COLUMN billing_interval        text        NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN payment_method          text        NOT NULL DEFAULT 'CARD',
    ADD COLUMN auto_renew              boolean     NOT NULL DEFAULT true,
    ADD COLUMN failed_payment_attempts integer     NOT NULL DEFAULT 0,
    ADD COLUMN next_retry_at           timestamptz,
    ADD CONSTRAINT subscriptions_interval_valid
        CHECK (billing_interval IN ('MONTHLY', 'ANNUAL')),
    ADD CONSTRAINT subscriptions_payment_method_valid
        CHECK (payment_method IN ('CARD', 'MOBILE_MONEY', 'DIGITAL_WALLET', 'BANK_TRANSFER')),
    ADD CONSTRAINT subscriptions_failed_attempts_valid
        CHECK (failed_payment_attempts >= 0);

-- Invoices & receipts (both self-service card/wallet/mobile-money and Enterprise bank transfers).
CREATE TABLE billing_invoices (
    id                   uuid        PRIMARY KEY,
    organization_id      uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    invoice_number       text        NOT NULL UNIQUE,
    plan                 text        NOT NULL,
    billing_interval     text        NOT NULL,
    payment_method       text        NOT NULL,
    amount_cents         bigint      NOT NULL,
    currency             text        NOT NULL DEFAULT 'USD',
    status               text        NOT NULL,
    provider             text        NOT NULL,
    provider_invoice_ref text,
    hosted_url           text,
    receipt_url          text,
    purchase_order       text,
    payment_terms        text,
    wire_reference       text,
    due_at               timestamptz,
    paid_at              timestamptz,
    created_at           timestamptz NOT NULL,
    CONSTRAINT billing_invoices_plan_valid CHECK (plan IN ('STARTER', 'BUSINESS', 'ENTERPRISE')),
    CONSTRAINT billing_invoices_interval_valid CHECK (billing_interval IN ('MONTHLY', 'ANNUAL')),
    CONSTRAINT billing_invoices_method_valid
        CHECK (payment_method IN ('CARD', 'MOBILE_MONEY', 'DIGITAL_WALLET', 'BANK_TRANSFER')),
    CONSTRAINT billing_invoices_amount_valid CHECK (amount_cents >= 0),
    CONSTRAINT billing_invoices_status_valid CHECK (status IN ('DRAFT', 'OPEN', 'PAID', 'PAST_DUE', 'VOID'))
);

CREATE INDEX billing_invoices_org_idx ON billing_invoices (organization_id, created_at DESC);

ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_invoices_tenant ON billing_invoices
    USING (organization_id = app_organization_id())
    WITH CHECK (organization_id = app_organization_id());

REVOKE DELETE, TRUNCATE ON billing_invoices FROM ${app_role};
