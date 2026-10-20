-- AI foundation (Phase 6): the organization's AI setting, a record of every AI
-- call, document readings and the rules that use them (ADR-029 to ADR-031).

-- Document reading is off until an owner switches it on (ADR-030). No row means off.
CREATE TABLE ai_settings (
    organization_id  uuid        PRIMARY KEY REFERENCES organizations (id) ON DELETE CASCADE,
    document_reading boolean     NOT NULL DEFAULT false,
    updated_by       uuid        REFERENCES users (id),
    updated_at       timestamptz NOT NULL
);

-- One insert-only row per call to the AI service, successful or not (§53).
CREATE TABLE ai_invocations (
    id                    uuid        PRIMARY KEY,
    organization_id       uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    purpose               text        NOT NULL,
    subject_id            uuid,
    subject_version       integer,
    actor_user_id         uuid        REFERENCES users (id),
    provider              text        NOT NULL,
    model_requested       text        NOT NULL,
    model                 text,
    prompt_name           text        NOT NULL,
    prompt_version        integer     NOT NULL,
    prompt_sha256         text        NOT NULL,
    input_tokens          integer     NOT NULL,
    output_tokens         integer     NOT NULL,
    cache_read_tokens     integer     NOT NULL,
    cache_write_tokens    integer     NOT NULL,
    latency_ms            integer     NOT NULL,
    estimated_cost_micros bigint,
    outcome               text        NOT NULL,
    error_code            text,
    attempt               integer     NOT NULL,
    trace_id              text,
    created_at            timestamptz NOT NULL,
    CONSTRAINT ai_invocations_purpose_valid CHECK (purpose IN ('document.read')),
    CONSTRAINT ai_invocations_outcome_valid
        CHECK (outcome IN ('SUCCEEDED', 'REFUSED', 'INVALID_OUTPUT', 'TRUNCATED', 'FAILED')),
    CONSTRAINT ai_invocations_counts_valid CHECK (input_tokens >= 0 AND output_tokens >= 0
        AND cache_read_tokens >= 0 AND cache_write_tokens >= 0 AND latency_ms >= 0 AND attempt >= 1),
    CONSTRAINT ai_invocations_prompt_sha_format CHECK (prompt_sha256 ~ '^[0-9a-f]{64}$')
);
CREATE INDEX ai_invocations_org_time_idx ON ai_invocations (organization_id, created_at DESC);

-- What an automatic reading found in a document version, for one reading spec
-- (the kinds and fields the rules ask for). Written by the system only.
CREATE TABLE document_readings (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    document_id     uuid        NOT NULL,
    version         integer     NOT NULL,
    spec_hash       text        NOT NULL,
    spec            jsonb       NOT NULL,
    status          text        NOT NULL,
    reason          text,
    result          jsonb,
    invocation_id   uuid        REFERENCES ai_invocations (id),
    created_at      timestamptz NOT NULL,
    completed_at    timestamptz,
    CONSTRAINT document_readings_version_fk FOREIGN KEY (document_id, version)
        REFERENCES document_versions (document_id, version) ON DELETE CASCADE,
    CONSTRAINT document_readings_status_valid CHECK (status IN ('PENDING', 'DONE', 'FAILED', 'SKIPPED')),
    CONSTRAINT document_readings_done_has_result CHECK ((status = 'DONE') = (result IS NOT NULL)),
    CONSTRAINT document_readings_spec_hash_format CHECK (spec_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT document_readings_unique UNIQUE (document_id, version, spec_hash)
);
CREATE INDEX document_readings_org_idx ON document_readings (organization_id, document_id, version);

-- A reading is settled once: only a pending reading may change, and never back to pending.
CREATE FUNCTION document_readings_guard() RETURNS trigger
    LANGUAGE plpgsql SET search_path = public, pg_temp
    AS $$
    BEGIN
        IF OLD.status <> 'PENDING' OR NEW.status = 'PENDING' THEN
            RAISE EXCEPTION 'a document reading is settled once' USING ERRCODE = 'insufficient_privilege';
        END IF;
        RETURN NEW;
    END
    $$;
CREATE TRIGGER document_readings_guard BEFORE UPDATE ON document_readings
    FOR EACH ROW EXECUTE FUNCTION document_readings_guard();

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_settings_tenant ON ai_settings
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY ai_invocations_tenant ON ai_invocations
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY document_readings_tenant ON document_readings
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
-- A client holding a request link may learn whether its documents may be read
-- automatically (the notice on the request page), and nothing else here.
CREATE POLICY ai_settings_link_read ON ai_settings FOR SELECT
    USING (organization_id = app_request_link_organization_id());

REVOKE UPDATE, DELETE, TRUNCATE ON ai_invocations FROM ${app_role};
-- Only the outcome columns of a reading can be written after it is created.
REVOKE UPDATE, DELETE, TRUNCATE ON document_readings FROM ${app_role};
GRANT UPDATE (status, reason, result, invocation_id, completed_at) ON document_readings TO ${app_role};
REVOKE DELETE, TRUNCATE ON ai_settings FROM ${app_role};

-- Rules that read documents, always advisory (ADR-031).
ALTER TABLE verification_rules DROP CONSTRAINT verification_rules_type_valid;
ALTER TABLE verification_rules ADD CONSTRAINT verification_rules_type_valid CHECK (type IN ('PATTERN', 'LENGTH',
    'ONE_OF', 'RANGE', 'DATE_RANGE', 'EQUALS_REQUIREMENT', 'DATE_ORDER', 'FILE_TYPE', 'FILE_SIZE',
    'DOCUMENT_KIND', 'DOCUMENT_FIELD'));
ALTER TABLE verification_rules ADD CONSTRAINT verification_rules_ai_advisory
    CHECK (type NOT IN ('DOCUMENT_KIND', 'DOCUMENT_FIELD') OR severity = 'ADVISORY');
