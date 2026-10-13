-- Organizations, memberships and invitations: the tenant model (ADR-005).
--
-- Row-level security is the second isolation layer behind application
-- authorization. The application sets two transaction-scoped settings:
--   app.user_id          the authenticated user
--   app.organization_id  the organization the request acts in (validated
--                        against the user's membership before it is set)
-- Unset settings read as NULL, which matches no row.

CREATE FUNCTION app_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE FUNCTION app_organization_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(current_setting('app.organization_id', true), '')::uuid $$;

CREATE TABLE organizations (
    id          uuid        PRIMARY KEY,
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL,
    CONSTRAINT organizations_name_length CHECK (char_length(name) BETWEEN 1 AND 120)
);

CREATE TABLE memberships (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role            text        NOT NULL,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    CONSTRAINT memberships_role_valid CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')),
    CONSTRAINT memberships_unique UNIQUE (organization_id, user_id)
);
CREATE INDEX memberships_user_idx ON memberships (user_id);

CREATE TABLE invitations (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    email_normalized text       NOT NULL,
    role            text        NOT NULL,
    token_hash      bytea       NOT NULL,
    invited_by      uuid        NOT NULL REFERENCES users (id),
    created_at      timestamptz NOT NULL,
    expires_at      timestamptz NOT NULL,
    accepted_at     timestamptz,
    revoked_at      timestamptz,
    CONSTRAINT invitations_role_valid CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')),
    CONSTRAINT invitations_token_hash_unique UNIQUE (token_hash)
);
CREATE INDEX invitations_org_pending_idx ON invitations (organization_id)
    WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- An organization is visible when it is the current organization or the
-- current user is a member of it (to list "my organizations").
CREATE POLICY organizations_visible ON organizations FOR SELECT
    USING (id = app_organization_id()
           OR EXISTS (SELECT 1 FROM memberships m WHERE m.organization_id = organizations.id
                      AND m.user_id = app_user_id()));
-- Creating an organization happens before any membership exists; the new
-- row must be the organization the transaction declared.
CREATE POLICY organizations_insert ON organizations FOR INSERT
    WITH CHECK (id = app_organization_id());
-- Writes are limited to the current organization only.
CREATE POLICY organizations_update ON organizations FOR UPDATE
    USING (id = app_organization_id()) WITH CHECK (id = app_organization_id());

-- Read: memberships of the current organization, plus the user's own
-- memberships. Write: the current organization only.
CREATE POLICY memberships_visible ON memberships FOR SELECT
    USING (organization_id = app_organization_id() OR user_id = app_user_id());
CREATE POLICY memberships_write ON memberships FOR INSERT
    WITH CHECK (organization_id = app_organization_id());
CREATE POLICY memberships_update ON memberships FOR UPDATE
    USING (organization_id = app_organization_id())
    WITH CHECK (organization_id = app_organization_id());
CREATE POLICY memberships_delete ON memberships FOR DELETE
    USING (organization_id = app_organization_id());

-- Invitations of the current organization. An invitee is not yet a member,
-- so acceptance looks the invitation up by the hash of the token they hold,
-- passed in the transaction-scoped setting app.invitation_token_hash.
CREATE POLICY invitations_visible ON invitations FOR SELECT
    USING (organization_id = app_organization_id()
           OR token_hash = decode(nullif(current_setting('app.invitation_token_hash', true), ''), 'hex'));
-- Revoking (current organization) and accepting (holder of the token).
CREATE POLICY invitations_update ON invitations FOR UPDATE
    USING (organization_id = app_organization_id()
           OR token_hash = decode(nullif(current_setting('app.invitation_token_hash', true), ''), 'hex'));
CREATE POLICY invitations_insert ON invitations FOR INSERT
    WITH CHECK (organization_id = app_organization_id());

-- Append-only audit trail (Guidelines §59). Phase 10 adds the audit UI.
CREATE TABLE audit_events (
    id              uuid        PRIMARY KEY,
    occurred_at     timestamptz NOT NULL,
    organization_id uuid        REFERENCES organizations (id),
    actor_user_id   uuid        REFERENCES users (id),
    action          text        NOT NULL,
    resource_type   text,
    resource_id     uuid,
    request_id      text,
    trace_id        text,
    details         jsonb       NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX audit_events_org_time_idx ON audit_events (organization_id, occurred_at DESC);
CREATE INDEX audit_events_actor_time_idx ON audit_events (actor_user_id, occurred_at DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_events_insert ON audit_events FOR INSERT
    WITH CHECK (organization_id IS NULL OR organization_id = app_organization_id());
CREATE POLICY audit_events_visible ON audit_events FOR SELECT
    USING (organization_id = app_organization_id()
           OR (organization_id IS NULL AND actor_user_id = app_user_id()));
-- Default privileges grant UPDATE and DELETE; audit history is immutable.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM ${app_role};

-- Idempotency keys for operations marked key-required (Guidelines §30).
CREATE TABLE idempotency_records (
    user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    idempotency_key text        NOT NULL,
    operation       text        NOT NULL,
    request_hash    bytea       NOT NULL,
    response_status integer     NOT NULL,
    response_body   jsonb,
    created_at      timestamptz NOT NULL,
    PRIMARY KEY (user_id, operation, idempotency_key)
);
ALTER TABLE idempotency_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY idempotency_records_own ON idempotency_records
    USING (user_id = app_user_id()) WITH CHECK (user_id = app_user_id());
