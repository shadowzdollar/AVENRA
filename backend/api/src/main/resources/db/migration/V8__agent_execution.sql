-- Agent execution (Phase 7): agent runs and their steps (ADR-033), and the
-- organization's planning setting (amends ADR-030).

ALTER TABLE ai_settings ADD COLUMN work_planning boolean NOT NULL DEFAULT false;
ALTER TABLE ai_invocations DROP CONSTRAINT ai_invocations_purpose_valid;
ALTER TABLE ai_invocations ADD CONSTRAINT ai_invocations_purpose_valid CHECK (purpose IN ('document.read', 'work.plan'));

-- One run of an agent capability for one work item, with its runtime context (§130).
CREATE TABLE agent_runs (
    id                  uuid        PRIMARY KEY,
    organization_id     uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    work_id             uuid        NOT NULL,
    capability          text        NOT NULL,
    status              text        NOT NULL,
    started_by          uuid        NOT NULL REFERENCES users (id),
    allowed_tools       text[]      NOT NULL,
    summary             text,
    max_model_calls     integer     NOT NULL,
    max_tool_calls      integer     NOT NULL,
    max_side_effects    integer     NOT NULL,
    max_cost_micros     bigint      NOT NULL,
    deadline            timestamptz NOT NULL,
    model_calls         integer     NOT NULL DEFAULT 0,
    tool_calls          integer     NOT NULL DEFAULT 0,
    side_effects        integer     NOT NULL DEFAULT 0,
    cost_micros         bigint      NOT NULL DEFAULT 0,
    stop_reason         text,
    trace_id            text,
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,
    finished_at         timestamptz,
    CONSTRAINT agent_runs_work_fk FOREIGN KEY (organization_id, work_id)
        REFERENCES work (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT agent_runs_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT agent_runs_capability_valid CHECK (capability IN ('information.plan')),
    CONSTRAINT agent_runs_status_valid CHECK (status IN ('PLANNING', 'AWAITING_APPROVAL', 'RUNNING', 'COMPLETED',
        'REJECTED', 'STOPPED', 'FAILED')),
    CONSTRAINT agent_runs_budget_valid CHECK (max_model_calls >= 0 AND max_tool_calls >= 0 AND max_side_effects >= 0
        AND max_cost_micros >= 0 AND model_calls >= 0 AND tool_calls >= 0 AND side_effects >= 0 AND cost_micros >= 0),
    CONSTRAINT agent_runs_finished CHECK ((status IN ('COMPLETED', 'REJECTED', 'STOPPED', 'FAILED'))
        = (finished_at IS NOT NULL)),
    CONSTRAINT agent_runs_stop_reason_length CHECK (stop_reason IS NULL OR char_length(stop_reason) <= 1000)
);
CREATE INDEX agent_runs_work_idx ON agent_runs (organization_id, work_id, created_at DESC);
CREATE INDEX agent_runs_open_idx ON agent_runs (deadline) WHERE finished_at IS NULL;

CREATE TABLE agent_steps (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL,
    run_id          uuid        NOT NULL,
    position        integer     NOT NULL,
    tool            text        NOT NULL,
    risk            text        NOT NULL,
    input           jsonb       NOT NULL,
    reason          text,
    status          text        NOT NULL,
    approved_by     uuid        REFERENCES users (id),
    approved_at     timestamptz,
    attempts        integer     NOT NULL DEFAULT 0,
    result          text,
    error           text,
    created_at      timestamptz NOT NULL,
    finished_at     timestamptz,
    CONSTRAINT agent_steps_run_fk FOREIGN KEY (organization_id, run_id)
        REFERENCES agent_runs (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT agent_steps_position_unique UNIQUE (run_id, position),
    CONSTRAINT agent_steps_tool_valid CHECK (tool IN ('create_requirement', 'create_task', 'send_information_request')),
    CONSTRAINT agent_steps_risk_valid CHECK (risk IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT agent_steps_status_valid CHECK (status IN ('PROPOSED', 'APPROVED', 'RUNNING', 'SUCCEEDED', 'REJECTED',
        'FAILED', 'SKIPPED')),
    -- Nothing runs without a recorded approval (ADR-033).
    CONSTRAINT agent_steps_approved_before_running CHECK (status IN ('PROPOSED', 'REJECTED', 'SKIPPED')
        OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
    CONSTRAINT agent_steps_text_lengths CHECK ((reason IS NULL OR char_length(reason) <= 300)
        AND (result IS NULL OR char_length(result) <= 1000) AND (error IS NULL OR char_length(error) <= 1000))
);
CREATE INDEX agent_steps_run_idx ON agent_steps (organization_id, run_id, position);

-- Only these columns change after a step is planned; the tool and its input never do.
REVOKE UPDATE, DELETE, TRUNCATE ON agent_steps FROM ${app_role};
GRANT UPDATE (status, approved_by, approved_at, attempts, result, error, finished_at) ON agent_steps TO ${app_role};
REVOKE UPDATE, DELETE, TRUNCATE ON agent_runs FROM ${app_role};
GRANT UPDATE (status, summary, model_calls, tool_calls, side_effects, cost_micros, stop_reason, updated_at,
              finished_at) ON agent_runs TO ${app_role};

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_runs_tenant ON agent_runs
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY agent_steps_tenant ON agent_steps
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());

-- Runs past their deadline are stopped by a tenant job each, so a run never has
-- to end on its own (§130). Idempotent per run.
CREATE FUNCTION sweep_agent_deadlines()
    RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH queued AS (
        INSERT INTO jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,
                          created_at, updated_at)
        SELECT gen_random_uuid(), organization_id, 'agent.deadline', jsonb_build_object('runId', id),
               'QUEUED', 5, now(), 'deadline:' || id, now(), now()
        FROM agent_runs
        WHERE finished_at IS NULL AND deadline < now()
        ON CONFLICT (type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
        RETURNING 1)
    SELECT count(*)::integer FROM queued
    $$;
REVOKE EXECUTE ON FUNCTION sweep_agent_deadlines() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sweep_agent_deadlines() TO ${app_role};
