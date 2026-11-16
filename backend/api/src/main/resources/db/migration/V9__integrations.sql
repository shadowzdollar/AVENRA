-- Integrations (Phase 8): connections to other systems and the deliveries made
-- through them (ADR-034).

CREATE TABLE integration_connections (
    id                    uuid        PRIMARY KEY,
    organization_id       uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    provider              text        NOT NULL,
    name                  text        NOT NULL,
    status                text        NOT NULL,
    events                text[]      NOT NULL DEFAULT '{}',
    settings              jsonb       NOT NULL,
    -- Secrets only as AES-GCM ciphertext (ADR-034, Guidelines §55); null once revoked.
    credential_key_id     text,
    credential_ciphertext bytea,
    credential_hint       text,
    consecutive_failures  integer     NOT NULL DEFAULT 0,
    last_delivery_at      timestamptz,
    created_by            uuid        NOT NULL REFERENCES users (id),
    created_at            timestamptz NOT NULL,
    updated_at            timestamptz NOT NULL,
    revoked_at            timestamptz,
    CONSTRAINT integration_connections_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT integration_connections_provider_valid CHECK (provider IN ('WEBHOOK', 'S3_EXPORT')),
    CONSTRAINT integration_connections_status_valid CHECK (status IN ('ACTIVE', 'PAUSED', 'REVOKED')),
    CONSTRAINT integration_connections_name_length CHECK (char_length(name) BETWEEN 1 AND 100),
    CONSTRAINT integration_connections_revoked CHECK ((status = 'REVOKED') = (revoked_at IS NOT NULL)),
    CONSTRAINT integration_connections_revoked_has_no_secret CHECK (status <> 'REVOKED'
        OR (credential_ciphertext IS NULL AND credential_key_id IS NULL)),
    CONSTRAINT integration_connections_failures CHECK (consecutive_failures >= 0)
);
CREATE INDEX integration_connections_org_idx ON integration_connections (organization_id, created_at);

-- One delivery per event and connection; the payload never holds secrets.
CREATE TABLE integration_deliveries (
    id               uuid        PRIMARY KEY,
    organization_id  uuid        NOT NULL,
    connection_id    uuid        NOT NULL,
    event_id         uuid        NOT NULL,
    event_type       text        NOT NULL,
    payload          jsonb       NOT NULL,
    status           text        NOT NULL,
    attempts         integer     NOT NULL DEFAULT 0,
    last_status_code integer,
    last_error       text,
    created_at       timestamptz NOT NULL,
    delivered_at     timestamptz,
    CONSTRAINT integration_deliveries_connection_fk FOREIGN KEY (organization_id, connection_id)
        REFERENCES integration_connections (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT integration_deliveries_once UNIQUE (connection_id, event_id),
    CONSTRAINT integration_deliveries_status_valid CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
    CONSTRAINT integration_deliveries_error_length CHECK (last_error IS NULL OR char_length(last_error) <= 500)
);
CREATE INDEX integration_deliveries_connection_idx ON integration_deliveries (organization_id, connection_id, created_at DESC);

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_connections_tenant ON integration_connections
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY integration_deliveries_tenant ON integration_deliveries
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());

-- A delivery's event never changes after it is recorded; only its outcome does.
REVOKE UPDATE, DELETE, TRUNCATE ON integration_deliveries FROM ${app_role};
GRANT UPDATE (status, attempts, last_status_code, last_error, delivered_at) ON integration_deliveries TO ${app_role};
REVOKE DELETE, TRUNCATE ON integration_connections FROM ${app_role};
