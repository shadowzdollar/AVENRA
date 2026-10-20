-- Notifications (Phase 9): what needs a person, in the app and by email
-- (ADR-035).

CREATE TABLE notifications (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category        text        NOT NULL,
    title           text        NOT NULL,
    body            text        NOT NULL,
    link            text,
    source_type     text        NOT NULL,
    source_id       text        NOT NULL,
    dedupe_key      text        NOT NULL,
    email_status    text        NOT NULL,
    created_at      timestamptz NOT NULL,
    read_at         timestamptz,
    CONSTRAINT notifications_once UNIQUE (user_id, dedupe_key),
    CONSTRAINT notifications_category_valid CHECK (category IN ('exception', 'answer', 'request', 'approval',
        'integration', 'escalation')),
    CONSTRAINT notifications_email_status_valid CHECK (email_status IN ('NOT_SENT', 'QUEUED')),
    CONSTRAINT notifications_lengths CHECK (char_length(title) <= 200 AND char_length(body) <= 2000
        AND (link IS NULL OR (char_length(link) <= 500 AND link LIKE '/%')))
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);

-- Per person, across organizations. No row means the product default.
CREATE TABLE notification_preferences (
    user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category   text        NOT NULL,
    email      boolean     NOT NULL,
    updated_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, category),
    CONSTRAINT notification_preferences_category_valid CHECK (category IN ('exception', 'answer', 'request',
        'approval', 'integration', 'escalation'))
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- The organization's own jobs create notifications for its members; a person
-- reads and marks only their own.
-- Recipients are resolved from current memberships by the application.
CREATE POLICY notifications_create ON notifications FOR INSERT
    WITH CHECK (organization_id = app_organization_id());
CREATE POLICY notifications_own_read ON notifications FOR SELECT
    USING (user_id = app_user_id());
CREATE POLICY notifications_own_mark ON notifications FOR UPDATE
    USING (user_id = app_user_id()) WITH CHECK (user_id = app_user_id());

CREATE POLICY notification_preferences_own ON notification_preferences
    USING (user_id = app_user_id()) WITH CHECK (user_id = app_user_id());
-- The organization's jobs read its members' preferences to decide on email.
CREATE POLICY notification_preferences_members_read ON notification_preferences FOR SELECT
    USING (user_id IN (SELECT user_id FROM memberships WHERE organization_id = app_organization_id()));

-- Only the read time of a notification changes.
REVOKE UPDATE, DELETE, TRUNCATE ON notifications FROM ${app_role};
GRANT UPDATE (read_at) ON notifications TO ${app_role};

-- High-severity exceptions still open and unassigned after 24 hours are
-- escalated once (ADR-035): one tenant job per exception, idempotent.
CREATE FUNCTION sweep_unattended_exceptions(p_older_than_seconds integer)
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'work.exception_unattended',
               jsonb_build_object('exceptionId', id), 'QUEUED', 5, now(), 'unattended:' || id, now(), now()
        FROM work_exceptions
        WHERE severity = 'HIGH' AND status = 'OPEN' AND assignee_membership_id IS NULL
          AND created_at < now() - make_interval(secs => p_older_than_seconds)
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;
REVOKE EXECUTE ON FUNCTION sweep_unattended_exceptions(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sweep_unattended_exceptions(integer) TO ${app_role};
