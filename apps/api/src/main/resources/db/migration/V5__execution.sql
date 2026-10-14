-- Work execution (Phase 4): durable jobs and schedules (ADR-022), executions
-- and automatic transitions (ADR-023), exceptions and human tasks (ADR-024),
-- durable email and reminders (ADR-025), rescanning (ADR-021 amendment).
--
-- Workers must see jobs of every tenant. They never get that through row-level
-- security: the runtime role reaches across tenants only through the
-- SECURITY DEFINER functions below, each doing one narrow thing. They run as
-- the schema owner (which owns the tables and is therefore not subject to RLS),
-- with a fixed search_path, and only the runtime role may execute them.

-- Jobs ------------------------------------------------------------------------

CREATE TABLE jobs (
    id               uuid        PRIMARY KEY,
    organization_id  uuid        REFERENCES organizations (id) ON DELETE CASCADE,
    type             text        NOT NULL,
    payload          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    status           text        NOT NULL,
    attempts         integer     NOT NULL DEFAULT 0,
    max_attempts     integer     NOT NULL,
    run_at           timestamptz NOT NULL,
    locked_by        text,
    locked_until     timestamptz,
    last_error_class text,
    last_error       text,
    idempotency_key  text,
    trace_parent     text,
    created_at       timestamptz NOT NULL,
    updated_at       timestamptz NOT NULL,
    finished_at      timestamptz,
    CONSTRAINT jobs_status_valid CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD', 'CANCELLED')),
    CONSTRAINT jobs_attempts_valid CHECK (attempts >= 0 AND max_attempts BETWEEN 1 AND 100),
    CONSTRAINT jobs_error_class_valid CHECK (last_error_class IS NULL
        OR last_error_class IN ('RETRYABLE', 'NON_RETRYABLE', 'HUMAN_REQUIRED', 'LEASE_EXPIRED')),
    CONSTRAINT jobs_error_length CHECK (last_error IS NULL OR char_length(last_error) <= 1000)
);
CREATE UNIQUE INDEX jobs_idempotency_idx ON jobs (type, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX jobs_due_idx ON jobs (run_at) WHERE status = 'QUEUED';
CREATE INDEX jobs_leased_idx ON jobs (locked_until) WHERE status = 'RUNNING';
CREATE INDEX jobs_org_idx ON jobs (organization_id, created_at DESC);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- A request may read its organization's jobs. Enqueueing, claiming and
-- finishing go through the functions below.
CREATE POLICY jobs_read ON jobs FOR SELECT
    USING (organization_id = app_organization_id());
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON jobs FROM ${app_role};

-- Enqueues a job for the organization the transaction acts in (a request's
-- organization, the organization of the request link it holds, or none for
-- platform jobs such as account email). Any other organization is refused.
-- Returns false when the idempotency key was already used.
CREATE FUNCTION jobs_enqueue(p_id uuid, p_org uuid, p_type text, p_payload jsonb, p_max_attempts integer,
                             p_run_at timestamptz, p_idempotency_key text)
    RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    DECLARE
        created integer;
    BEGIN
        -- coalesce: a NULL comparison must refuse, not slip through as "unknown".
        IF NOT coalesce(p_org IS NOT DISTINCT FROM app_organization_id()
                        OR (p_org IS NOT NULL AND p_org = app_request_link_organization_id()), false) THEN
            RAISE EXCEPTION 'job organization does not match the transaction' USING ERRCODE = 'insufficient_privilege';
        END IF;
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        VALUES (p_id, p_org, p_type, p_payload, 'QUEUED', p_max_attempts, p_run_at, p_idempotency_key, now(), now())
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
        GET DIAGNOSTICS created = ROW_COUNT;
        RETURN created = 1;
    END
    $$;

CREATE TABLE job_schedules (
    name             text        PRIMARY KEY,
    job_type         text        NOT NULL,
    interval_seconds integer     NOT NULL,
    next_run_at      timestamptz NOT NULL,
    last_run_at      timestamptz,
    CONSTRAINT job_schedules_interval_valid CHECK (interval_seconds BETWEEN 1 AND 604800)
);
-- Platform data: no policy, so the runtime role sees nothing directly.
ALTER TABLE job_schedules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON job_schedules FROM ${app_role};

-- Claims up to p_limit due jobs: queued and due, or running with an expired
-- lease (a crashed worker). The claim counts as an attempt.
CREATE FUNCTION jobs_claim(p_worker text, p_limit integer, p_lease_seconds integer)
    RETURNS SETOF jobs
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH due AS (
        SELECT id FROM jobs
        WHERE (status = 'QUEUED' AND run_at <= now())
           OR (status = 'RUNNING' AND locked_until < now())
        ORDER BY run_at, id
        LIMIT least(greatest(p_limit, 0), 100)
        FOR UPDATE SKIP LOCKED
    )
    UPDATE jobs j
       SET status = 'RUNNING', locked_by = p_worker,
           locked_until = now() + make_interval(secs => p_lease_seconds),
           attempts = j.attempts + 1,
           last_error_class = CASE WHEN j.status = 'RUNNING' THEN 'LEASE_EXPIRED' ELSE j.last_error_class END,
           updated_at = now()
      FROM due WHERE j.id = due.id
    RETURNING j.*
    $$;

-- Finishing requires holding the lease: a worker can only finish its own claim.
CREATE FUNCTION jobs_succeed(p_id uuid, p_worker text, p_clear_payload boolean)
    RETURNS boolean
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH done AS (
        UPDATE jobs SET status = 'SUCCEEDED', finished_at = now(), updated_at = now(),
                        locked_by = NULL, locked_until = NULL,
                        payload = CASE WHEN p_clear_payload THEN '{}'::jsonb ELSE payload END
        WHERE id = p_id AND status = 'RUNNING' AND locked_by = p_worker
        RETURNING 1)
    SELECT count(*) = 1 FROM done
    $$;

CREATE FUNCTION jobs_retry(p_id uuid, p_worker text, p_delay_seconds integer, p_error text)
    RETURNS boolean
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH retried AS (
        UPDATE jobs SET status = 'QUEUED', run_at = now() + make_interval(secs => greatest(p_delay_seconds, 0)),
                        locked_by = NULL, locked_until = NULL, last_error_class = 'RETRYABLE',
                        last_error = left(p_error, 1000), updated_at = now()
        WHERE id = p_id AND status = 'RUNNING' AND locked_by = p_worker
        RETURNING 1)
    SELECT count(*) = 1 FROM retried
    $$;

CREATE FUNCTION jobs_fail(p_id uuid, p_worker text, p_status text, p_error_class text, p_error text,
                          p_clear_payload boolean)
    RETURNS boolean
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH failed AS (
        UPDATE jobs SET status = p_status, finished_at = now(), updated_at = now(),
                        locked_by = NULL, locked_until = NULL, last_error_class = p_error_class,
                        last_error = left(p_error, 1000),
                        payload = CASE WHEN p_clear_payload THEN '{}'::jsonb ELSE payload END
        WHERE id = p_id AND status = 'RUNNING' AND locked_by = p_worker AND p_status IN ('FAILED', 'DEAD')
        RETURNING 1)
    SELECT count(*) = 1 FROM failed
    $$;

-- Queue depth by status, for metrics.
CREATE FUNCTION jobs_depth()
    RETURNS TABLE (status text, jobs bigint)
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$ SELECT status, count(*) FROM jobs WHERE status IN ('QUEUED', 'RUNNING', 'DEAD') GROUP BY status $$;

-- Registers or updates a schedule; an existing next run is kept.
CREATE FUNCTION schedules_register(p_name text, p_job_type text, p_interval_seconds integer)
    RETURNS void
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    INSERT INTO job_schedules (name, job_type, interval_seconds, next_run_at)
    VALUES (p_name, p_job_type, p_interval_seconds, now())
    ON CONFLICT (name) DO UPDATE SET job_type = excluded.job_type, interval_seconds = excluded.interval_seconds
    $$;

-- Fires every due schedule once: enqueues one platform job per slot (the slot
-- is the idempotency key) and moves the schedule to its next slot. Concurrent
-- callers skip schedules another caller is firing.
CREATE FUNCTION schedules_fire()
    RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    DECLARE
        s job_schedules%ROWTYPE;
        fired integer := 0;
    BEGIN
        FOR s IN SELECT * FROM job_schedules WHERE next_run_at <= now() ORDER BY name FOR UPDATE SKIP LOCKED LOOP
            INSERT INTO jobs (id, organization_id, type, status, max_attempts, run_at, idempotency_key,
                              created_at, updated_at)
            VALUES (gen_random_uuid(), NULL, s.job_type, 'QUEUED', 3, now(),
                    s.name || '@' || to_char(s.next_run_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS'),
                    now(), now())
            ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
            UPDATE job_schedules
               SET last_run_at = now(),
                   next_run_at = greatest(s.next_run_at + make_interval(secs => s.interval_seconds), now())
             WHERE name = s.name;
            fired := fired + 1;
        END LOOP;
        RETURN fired;
    END
    $$;

-- Work transitions by rules, executions, exceptions ----------------------------

ALTER TABLE work_transitions ADD COLUMN actor_rule text;
ALTER TABLE work_transitions ADD CONSTRAINT work_transitions_actor
    CHECK (actor_user_id IS NULL OR actor_rule IS NULL);
ALTER TABLE work ADD COLUMN overdue_flagged_at timestamptz;

CREATE TABLE executions (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL,
    work_id         uuid        NOT NULL,
    step_type       text,
    step_id         uuid,
    actor_type      text        NOT NULL,
    actor_user_id   uuid        REFERENCES users (id),
    actor_rule      text,
    action          text        NOT NULL,
    target          text,
    input_reference text,
    status          text        NOT NULL,
    result          jsonb,
    error           text,
    retry_count     integer     NOT NULL DEFAULT 0,
    job_id          uuid,
    idempotency_key text,
    created_at      timestamptz NOT NULL,
    started_at      timestamptz,
    completed_at    timestamptz,
    updated_at      timestamptz NOT NULL,
    CONSTRAINT executions_work_fk FOREIGN KEY (organization_id, work_id)
        REFERENCES work (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT executions_status_valid CHECK (status IN ('PLANNED', 'AUTHORIZED', 'READY', 'RUNNING', 'WAITING',
        'REQUIRES_APPROVAL', 'FAILED', 'SUCCEEDED', 'VERIFIED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT executions_actor_valid CHECK (
        (actor_type = 'USER' AND actor_user_id IS NOT NULL AND actor_rule IS NULL)
        OR (actor_type = 'SYSTEM' AND actor_user_id IS NULL AND actor_rule IS NOT NULL)),
    CONSTRAINT executions_error_length CHECK (error IS NULL OR char_length(error) <= 1000)
);
CREATE UNIQUE INDEX executions_idempotency_idx ON executions (organization_id, action, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX executions_work_idx ON executions (organization_id, work_id, created_at DESC);

CREATE TABLE work_exceptions (
    id                     uuid        PRIMARY KEY,
    organization_id        uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    work_id                uuid,
    type                   text        NOT NULL,
    severity               text        NOT NULL,
    description            text        NOT NULL,
    source_type            text        NOT NULL,
    source_id              text        NOT NULL,
    status                 text        NOT NULL,
    assignee_membership_id uuid,
    resolution             text,
    created_at             timestamptz NOT NULL,
    updated_at             timestamptz NOT NULL,
    resolved_at            timestamptz,
    resolved_by            uuid        REFERENCES users (id),
    CONSTRAINT work_exceptions_work_fk FOREIGN KEY (organization_id, work_id)
        REFERENCES work (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT work_exceptions_assignee_fk FOREIGN KEY (organization_id, assignee_membership_id)
        REFERENCES memberships (organization_id, id) ON DELETE SET NULL (assignee_membership_id),
    CONSTRAINT work_exceptions_type_valid CHECK (type IN ('JOB_FAILED', 'DELIVERY_FAILED',
        'REQUEST_EXPIRED_INCOMPLETE', 'WORK_OVERDUE', 'MALWARE_FOUND', 'HUMAN_REQUIRED')),
    CONSTRAINT work_exceptions_severity_valid CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT work_exceptions_status_valid CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED',
        'DISMISSED')),
    CONSTRAINT work_exceptions_resolution CHECK (status NOT IN ('RESOLVED', 'DISMISSED') OR resolution IS NOT NULL)
);
-- One open exception per source: raising is idempotent.
CREATE UNIQUE INDEX work_exceptions_open_source_idx ON work_exceptions (organization_id, type, source_type, source_id)
    WHERE status NOT IN ('RESOLVED', 'DISMISSED');
CREATE INDEX work_exceptions_org_idx ON work_exceptions (organization_id, status, created_at DESC);
CREATE INDEX work_exceptions_work_idx ON work_exceptions (organization_id, work_id);

ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY executions_tenant ON executions
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY work_exceptions_tenant ON work_exceptions
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
REVOKE DELETE, TRUNCATE ON executions, work_exceptions FROM ${app_role};

-- Human tasks (ADR-024) ---------------------------------------------------------

ALTER TABLE tasks ADD COLUMN origin text NOT NULL DEFAULT 'MANUAL';
ALTER TABLE tasks ADD COLUMN required_action text;
ALTER TABLE tasks ADD COLUMN reason text;
ALTER TABLE tasks ADD COLUMN choices text[];
ALTER TABLE tasks ADD COLUMN source_type text;
ALTER TABLE tasks ADD COLUMN source_id uuid;
ALTER TABLE tasks ADD CONSTRAINT tasks_origin_valid CHECK (origin IN ('MANUAL', 'SYSTEM'));
ALTER TABLE tasks ADD CONSTRAINT tasks_system_explained CHECK (
    origin = 'MANUAL' OR (required_action IS NOT NULL AND reason IS NOT NULL AND source_type IS NOT NULL
                          AND source_id IS NOT NULL));
-- One open system task per source.
CREATE UNIQUE INDEX tasks_open_system_source_idx ON tasks (organization_id, source_type, source_id)
    WHERE origin = 'SYSTEM' AND status = 'OPEN';
ALTER TABLE tasks ALTER COLUMN created_by DROP NOT NULL;

-- Request links: encrypted token for reminders (ADR-025) ------------------------

ALTER TABLE request_links ADD COLUMN token_key_id text;
ALTER TABLE request_links ADD COLUMN token_ciphertext bytea;
ALTER TABLE request_links ADD COLUMN reminders_sent integer NOT NULL DEFAULT 0;
ALTER TABLE request_links ADD COLUMN last_reminded_at timestamptz;
ALTER TABLE request_links ADD COLUMN expiry_handled_at timestamptz;
ALTER TABLE request_links ADD CONSTRAINT request_links_reminders_valid CHECK (reminders_sent BETWEEN 0 AND 20);

-- Rescanning (ADR-021 amendment) ----------------------------------------------

ALTER TABLE document_versions ADD COLUMN last_scanned_at timestamptz;
UPDATE document_versions SET last_scanned_at = uploaded_at;
ALTER TABLE document_versions ALTER COLUMN last_scanned_at SET NOT NULL;
-- Rescanning may change only the scan result and move the object to quarantine.
GRANT UPDATE (scan_status, scan_signature, storage_key, last_scanned_at) ON document_versions TO ${app_role};
ALTER TABLE document_versions ADD CONSTRAINT document_versions_infected_quarantined
    CHECK (scan_status = 'CLEAN' OR storage_key LIKE 'quarantine/%');

-- Sweeps: find work across tenants and enqueue one tenant job per item --------
-- Each returns the number of jobs enqueued; idempotency keys make repeats harmless.

CREATE FUNCTION sweep_reminders(p_first_seconds integer, p_every_seconds integer, p_max integer)
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH due AS (
        SELECT l.id, l.organization_id, l.reminders_sent + 1 AS reminder
        FROM request_links l
        JOIN work w ON w.organization_id = l.organization_id AND w.id = l.work_id
        WHERE l.revoked_at IS NULL
          AND l.token_ciphertext IS NOT NULL
          AND l.expires_at > now() + interval '1 day'
          AND l.reminders_sent < p_max
          AND coalesce(l.last_reminded_at, l.created_at)
              + make_interval(secs => CASE WHEN l.reminders_sent = 0 THEN p_first_seconds ELSE p_every_seconds END)
              <= now()
          AND w.status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
          AND EXISTS (
              SELECT 1 FROM request_link_requirements lr
              JOIN requirements r ON r.id = lr.requirement_id
              LEFT JOIN information_items i ON i.id = r.current_item_id
              WHERE lr.request_link_id = l.id AND r.required
                AND (r.current_item_id IS NULL OR i.verification_state = 'REJECTED'))
    ), queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'request_link.remind',
               jsonb_build_object('requestLinkId', id, 'reminder', reminder), 'QUEUED', 5, now(),
               id || ':' || reminder, now(), now()
        FROM due
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;

CREATE FUNCTION sweep_expired_links()
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'request_link.expired', jsonb_build_object('requestLinkId', id),
               'QUEUED', 5, now(), id::text, now(), now()
        FROM request_links
        WHERE expires_at <= now() AND revoked_at IS NULL AND expiry_handled_at IS NULL
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;

CREATE FUNCTION sweep_overdue_work()
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'work.overdue', jsonb_build_object('workId', id),
               'QUEUED', 5, now(), id || ':' || to_char(due_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS'),
               now(), now()
        FROM work
        WHERE due_at < now() AND overdue_flagged_at IS NULL AND status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;

-- Rescans clean versions whose last scan is older than p_older_than_seconds,
-- oldest first, at most p_batch per sweep.
CREATE FUNCTION sweep_rescans(p_older_than_seconds integer, p_batch integer)
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH due AS (
        SELECT organization_id, document_id, version, last_scanned_at FROM document_versions
        WHERE scan_status = 'CLEAN' AND last_scanned_at < now() - make_interval(secs => p_older_than_seconds)
        ORDER BY last_scanned_at
        LIMIT least(greatest(p_batch, 0), 1000)
    ), queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'document.rescan',
               jsonb_build_object('documentId', document_id, 'version', version), 'QUEUED', 5, now(),
               document_id || ':' || version || ':' || to_char(last_scanned_at AT TIME ZONE 'UTC',
                                                                'YYYY-MM-DD"T"HH24:MI:SS'),
               now(), now()
        FROM due
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;

-- Only the runtime role may call the functions; PostgreSQL grants EXECUTE to
-- PUBLIC by default.
REVOKE EXECUTE ON FUNCTION jobs_enqueue(uuid, uuid, text, jsonb, integer, timestamptz, text),
    jobs_claim(text, integer, integer), jobs_succeed(uuid, text, boolean),
    jobs_retry(uuid, text, integer, text), jobs_fail(uuid, text, text, text, text, boolean), jobs_depth(),
    schedules_register(text, text, integer), schedules_fire(), sweep_reminders(integer, integer, integer),
    sweep_expired_links(), sweep_overdue_work(), sweep_rescans(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION jobs_enqueue(uuid, uuid, text, jsonb, integer, timestamptz, text),
    jobs_claim(text, integer, integer), jobs_succeed(uuid, text, boolean),
    jobs_retry(uuid, text, integer, text), jobs_fail(uuid, text, text, text, text, boolean), jobs_depth(),
    schedules_register(text, text, integer), schedules_fire(), sweep_reminders(integer, integer, integer),
    sweep_expired_links(), sweep_overdue_work(), sweep_rescans(integer, integer) TO ${app_role};
