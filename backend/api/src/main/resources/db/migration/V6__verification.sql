-- Verification (Phase 5): rules, results, evidence and completion manifests
-- (ADR-026 to ADR-028). Everything here is tenant-owned with row-level
-- security, and every record of what was checked or decided is insert-only.

-- How a requirement is verified, owned by the information module.
ALTER TABLE requirements ADD COLUMN acceptance text NOT NULL DEFAULT 'MANUAL';
ALTER TABLE requirements ADD COLUMN risk text NOT NULL DEFAULT 'NORMAL';
ALTER TABLE requirements ADD COLUMN rules_version integer NOT NULL DEFAULT 0;
ALTER TABLE requirements ADD CONSTRAINT requirements_acceptance_valid CHECK (acceptance IN ('MANUAL', 'AUTOMATIC'));
ALTER TABLE requirements ADD CONSTRAINT requirements_risk_valid CHECK (risk IN ('NORMAL', 'HIGH'));
-- High-risk requirements are always decided by a person (ADR-027).
ALTER TABLE requirements ADD CONSTRAINT requirements_high_risk_manual CHECK (risk = 'NORMAL' OR acceptance = 'MANUAL');

-- Who decided on an answer, and why a person overrode failed checks.
ALTER TABLE information_items ADD COLUMN decided_by text;
ALTER TABLE information_items ADD COLUMN override_reason text;
ALTER TABLE information_items ADD CONSTRAINT information_items_decided_by_valid
    CHECK (decided_by IS NULL OR decided_by IN ('PERSON', 'RULES'));
ALTER TABLE information_items ADD CONSTRAINT information_items_decision_recorded
    CHECK (verification_state = 'PENDING' OR decided_by IS NOT NULL OR reviewed_by IS NOT NULL);
UPDATE information_items SET decided_by = 'PERSON' WHERE verification_state <> 'PENDING';
GRANT UPDATE (decided_by, override_reason) ON information_items TO ${app_role};

-- Rules: one row per rule and rule-set version; a new version replaces the set.
CREATE TABLE verification_rules (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    requirement_id  uuid        NOT NULL,
    version         integer     NOT NULL,
    position        integer     NOT NULL,
    type            text        NOT NULL,
    severity        text        NOT NULL,
    message         text        NOT NULL,
    params          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_by      uuid        REFERENCES users (id),
    created_at      timestamptz NOT NULL,
    CONSTRAINT verification_rules_requirement_fk FOREIGN KEY (organization_id, requirement_id)
        REFERENCES requirements (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT verification_rules_type_valid CHECK (type IN ('PATTERN', 'LENGTH', 'ONE_OF', 'RANGE', 'DATE_RANGE',
        'EQUALS_REQUIREMENT', 'DATE_ORDER', 'FILE_TYPE', 'FILE_SIZE')),
    CONSTRAINT verification_rules_severity_valid CHECK (severity IN ('BLOCKING', 'ADVISORY')),
    CONSTRAINT verification_rules_message_length CHECK (char_length(message) BETWEEN 1 AND 300),
    CONSTRAINT verification_rules_unique UNIQUE (requirement_id, version, position)
);
CREATE INDEX verification_rules_requirement_idx ON verification_rules (organization_id, requirement_id, version);
-- Consistency rules are found by the requirement they refer to.
CREATE INDEX verification_rules_other_idx ON verification_rules (organization_id, ((params->>'otherRequirementId')))
    WHERE params ? 'otherRequirementId';

-- One immutable result per verification run (Guidelines §25).
CREATE TABLE verifications (
    id              uuid         PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    work_id         uuid         NOT NULL,
    requirement_id  uuid         NOT NULL,
    item_id         uuid         NOT NULL,
    rules_version   integer      NOT NULL,
    status          text         NOT NULL,
    confidence      numeric(4, 3),
    checks          jsonb        NOT NULL,
    evidence        jsonb        NOT NULL,
    method          text         NOT NULL,
    created_at      timestamptz  NOT NULL,
    CONSTRAINT verifications_item_fk FOREIGN KEY (organization_id, item_id)
        REFERENCES information_items (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT verifications_status_valid CHECK (status IN ('PASSED', 'FAILED', 'NEEDS_REVIEW')),
    CONSTRAINT verifications_method_valid CHECK (method IN ('RULES')),
    CONSTRAINT verifications_confidence_range CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)
);
CREATE INDEX verifications_item_idx ON verifications (organization_id, item_id, created_at DESC);
CREATE INDEX verifications_requirement_idx ON verifications (organization_id, requirement_id, created_at DESC);

-- First-class evidence (Guidelines §24).
CREATE TABLE evidence (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    work_id         uuid        NOT NULL,
    requirement_id  uuid,
    kind            text        NOT NULL,
    reference_type  text        NOT NULL,
    reference_id    uuid        NOT NULL,
    description     text        NOT NULL,
    fingerprint     text,
    created_at      timestamptz NOT NULL,
    CONSTRAINT evidence_kind_valid CHECK (kind IN ('ANSWER', 'DOCUMENT_VERSION', 'VERIFICATION', 'HUMAN_DECISION',
        'SYSTEM_DECISION')),
    CONSTRAINT evidence_fingerprint_format CHECK (fingerprint IS NULL OR fingerprint ~ '^[0-9a-f]{64}$')
);
CREATE INDEX evidence_work_idx ON evidence (organization_id, work_id, created_at DESC);

-- The proof of completion (ADR-028): canonical JSON and its SHA-256.
CREATE TABLE work_completions (
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    work_id         uuid        PRIMARY KEY,
    manifest        text        NOT NULL,
    sha256          text        NOT NULL,
    completed_at    timestamptz NOT NULL,
    CONSTRAINT work_completions_sha_format CHECK (sha256 ~ '^[0-9a-f]{64}$')
);

ALTER TABLE verification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_rules_tenant ON verification_rules
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY verifications_tenant ON verifications
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY evidence_tenant ON evidence
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY work_completions_tenant ON work_completions
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());

-- A client answering through a request link is verified in the link's scope:
-- it reads the rules of the link's requirements and records results and
-- evidence for its own answers only.
CREATE POLICY verification_rules_link_read ON verification_rules FOR SELECT
    USING (requirement_id IN (SELECT requirement_id FROM request_link_requirements
                              WHERE request_link_id = app_request_link_id()));
-- The link cannot see other requirements, so consistency checks are skipped in
-- its scope and completed by a job in the organization's scope (ADR-027).
CREATE POLICY verifications_link_insert ON verifications FOR INSERT
    WITH CHECK (requirement_id IN (SELECT requirement_id FROM request_link_requirements
                                   WHERE request_link_id = app_request_link_id()));
CREATE POLICY verifications_link_read ON verifications FOR SELECT
    USING (requirement_id IN (SELECT requirement_id FROM request_link_requirements
                              WHERE request_link_id = app_request_link_id()));
CREATE POLICY evidence_link_insert ON evidence FOR INSERT
    WITH CHECK (organization_id = app_request_link_organization_id()
                AND requirement_id IN (SELECT requirement_id FROM request_link_requirements
                                       WHERE request_link_id = app_request_link_id()));

-- The rules decide on a client's answer in the link's scope (ADR-027): the link
-- may update only its own answers, and only with a decision made by the rules,
-- never one attributed to a person. Column privileges still limit the update
-- to the decision and confidence columns.
CREATE POLICY information_items_link_decide ON information_items FOR UPDATE
    USING (source_link_id = app_request_link_id()
           AND requirement_id IN (SELECT requirement_id FROM request_link_requirements
                                  WHERE request_link_id = app_request_link_id()))
    WITH CHECK (source_link_id = app_request_link_id()
                AND reviewed_by IS NULL
                AND override_reason IS NULL
                AND (decided_by IS NULL OR decided_by = 'RULES'));

REVOKE UPDATE, DELETE, TRUNCATE ON verification_rules, verifications, evidence, work_completions FROM ${app_role};

-- Exceptions raised when an accepted answer stops passing its checks.
ALTER TABLE work_exceptions DROP CONSTRAINT work_exceptions_type_valid;
ALTER TABLE work_exceptions ADD CONSTRAINT work_exceptions_type_valid CHECK (type IN ('JOB_FAILED', 'DELIVERY_FAILED',
    'REQUEST_EXPIRED_INCOMPLETE', 'WORK_OVERDUE', 'MALWARE_FOUND', 'HUMAN_REQUIRED', 'INCONSISTENT_INFORMATION'));
