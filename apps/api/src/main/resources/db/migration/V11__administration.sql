-- Administration (Phase 10): the organization's own defaults (ADR-036).

ALTER TABLE organizations ADD COLUMN request_link_days integer NOT NULL DEFAULT 14;
ALTER TABLE organizations ADD CONSTRAINT organizations_request_link_days_valid
    CHECK (request_link_days BETWEEN 1 AND 30);

-- Audit history is read newest first per organization, filtered by action.
CREATE INDEX audit_events_org_action_idx ON audit_events (organization_id, action, occurred_at DESC);
