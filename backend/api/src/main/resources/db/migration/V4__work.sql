-- Core business objects (ADR-018, ADR-019, ADR-020): clients, projects, work,
-- tasks, requirements, information items, documents and request links.
--
-- Every table carries organization_id and row-level security (ADR-005).
-- References between tenant-owned rows are composite (organization_id, id), so
-- a row can never point at another tenant's row, whatever the application does.
--
-- A third access path joins the two from V3: a client holding a request link.
-- The application passes the hash of the link token in the transaction-scoped
-- setting app.request_link_token_hash; the policies below then expose only
-- that link, its own requirements and what is needed to answer them, and only
-- while the link is neither expired nor revoked.

ALTER TABLE memberships ADD CONSTRAINT memberships_org_id_unique UNIQUE (organization_id, id);

CREATE TABLE clients (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    email           text,
    reference       text,
    created_by      uuid        NOT NULL REFERENCES users (id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    CONSTRAINT clients_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
    CONSTRAINT clients_org_id_unique UNIQUE (organization_id, id)
);
CREATE INDEX clients_org_name_idx ON clients (organization_id, lower(name));

CREATE TABLE projects (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    client_id       uuid,
    name            text        NOT NULL,
    description     text,
    created_by      uuid        NOT NULL REFERENCES users (id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    CONSTRAINT projects_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
    CONSTRAINT projects_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT projects_client_fk FOREIGN KEY (organization_id, client_id) REFERENCES clients (organization_id, id)
);
CREATE INDEX projects_org_client_idx ON projects (organization_id, client_id);

CREATE TABLE work (
    id                  uuid        PRIMARY KEY,
    organization_id     uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    client_id           uuid,
    project_id          uuid,
    title               text        NOT NULL,
    description         text,
    type                text,
    priority            text        NOT NULL,
    status              text        NOT NULL,
    owner_membership_id uuid,
    requested_by        uuid        NOT NULL REFERENCES users (id),
    due_at              timestamptz,
    started_at          timestamptz,
    completed_at        timestamptz,
    completion_reason   text,
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,
    CONSTRAINT work_title_length CHECK (char_length(title) BETWEEN 1 AND 200),
    CONSTRAINT work_priority_valid CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT work_status_valid CHECK (status IN ('DRAFT', 'READY', 'RUNNING', 'WAITING_FOR_INFORMATION',
        'WAITING_FOR_APPROVAL', 'BLOCKED', 'FAILED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT work_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT work_client_fk FOREIGN KEY (organization_id, client_id) REFERENCES clients (organization_id, id),
    CONSTRAINT work_project_fk FOREIGN KEY (organization_id, project_id) REFERENCES projects (organization_id, id),
    CONSTRAINT work_owner_fk FOREIGN KEY (organization_id, owner_membership_id)
        REFERENCES memberships (organization_id, id) ON DELETE SET NULL (owner_membership_id)
);
CREATE INDEX work_org_updated_idx ON work (organization_id, updated_at DESC);
CREATE INDEX work_org_project_idx ON work (organization_id, project_id);
CREATE INDEX work_org_client_idx ON work (organization_id, client_id);

-- Status history; append-only like the audit trail.
CREATE TABLE work_transitions (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL,
    work_id         uuid        NOT NULL,
    from_status     text,
    to_status       text        NOT NULL,
    actor_user_id   uuid        REFERENCES users (id),
    reason          text,
    occurred_at     timestamptz NOT NULL,
    CONSTRAINT work_transitions_work_fk FOREIGN KEY (organization_id, work_id)
        REFERENCES work (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX work_transitions_work_idx ON work_transitions (organization_id, work_id, occurred_at);

CREATE TABLE tasks (
    id                     uuid        PRIMARY KEY,
    organization_id        uuid        NOT NULL,
    work_id                uuid        NOT NULL,
    title                  text        NOT NULL,
    kind                   text        NOT NULL,
    completion_condition   text        NOT NULL,
    status                 text        NOT NULL,
    assignee_membership_id uuid,
    due_at                 timestamptz,
    note                   text,
    completed_at           timestamptz,
    completed_by           uuid        REFERENCES users (id),
    created_by             uuid        NOT NULL REFERENCES users (id),
    created_at             timestamptz NOT NULL,
    updated_at             timestamptz NOT NULL,
    CONSTRAINT tasks_kind_valid CHECK (kind IN ('HUMAN', 'AUTOMATED', 'AI_ASSISTED', 'INTEGRATION', 'APPROVAL')),
    CONSTRAINT tasks_status_valid CHECK (status IN ('OPEN', 'DONE', 'CANCELLED')),
    CONSTRAINT tasks_condition_present CHECK (char_length(completion_condition) BETWEEN 1 AND 1000),
    CONSTRAINT tasks_work_fk FOREIGN KEY (organization_id, work_id) REFERENCES work (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT tasks_assignee_fk FOREIGN KEY (organization_id, assignee_membership_id)
        REFERENCES memberships (organization_id, id) ON DELETE SET NULL (assignee_membership_id)
);
CREATE INDEX tasks_work_idx ON tasks (organization_id, work_id);

CREATE TABLE requirements (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL,
    work_id         uuid        NOT NULL,
    title           text        NOT NULL,
    instructions    text,
    kind            text        NOT NULL,
    required        boolean     NOT NULL,
    current_item_id uuid,
    created_by      uuid        NOT NULL REFERENCES users (id),
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    CONSTRAINT requirements_kind_valid CHECK (kind IN ('DOCUMENT', 'TEXT', 'NUMBER', 'DATE', 'BOOLEAN')),
    CONSTRAINT requirements_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT requirements_work_fk FOREIGN KEY (organization_id, work_id)
        REFERENCES work (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX requirements_work_idx ON requirements (organization_id, work_id);

-- One document per document requirement; every upload is a new version.
CREATE TABLE documents (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    requirement_id  uuid,
    created_at      timestamptz NOT NULL,
    CONSTRAINT documents_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT documents_requirement_unique UNIQUE (requirement_id),
    CONSTRAINT documents_requirement_fk FOREIGN KEY (organization_id, requirement_id)
        REFERENCES requirements (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE request_links (
    id              uuid        PRIMARY KEY,
    organization_id uuid        NOT NULL,
    work_id         uuid        NOT NULL,
    token_hash      bytea       NOT NULL,
    recipient_email text        NOT NULL,
    recipient_name  text,
    message         text,
    created_by      uuid        NOT NULL REFERENCES users (id),
    created_at      timestamptz NOT NULL,
    expires_at      timestamptz NOT NULL,
    revoked_at      timestamptz,
    last_opened_at  timestamptz,
    CONSTRAINT request_links_token_hash_unique UNIQUE (token_hash),
    CONSTRAINT request_links_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT request_links_work_fk FOREIGN KEY (organization_id, work_id)
        REFERENCES work (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT request_links_expiry CHECK (expires_at > created_at AND expires_at <= created_at + interval '30 days')
);
CREATE INDEX request_links_work_idx ON request_links (organization_id, work_id, created_at DESC);

CREATE TABLE request_link_requirements (
    request_link_id uuid NOT NULL,
    requirement_id  uuid NOT NULL,
    organization_id uuid NOT NULL,
    PRIMARY KEY (request_link_id, requirement_id),
    CONSTRAINT rlr_link_fk FOREIGN KEY (organization_id, request_link_id)
        REFERENCES request_links (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT rlr_requirement_fk FOREIGN KEY (organization_id, requirement_id)
        REFERENCES requirements (organization_id, id) ON DELETE CASCADE
);

-- Immutable file versions (Guidelines §23). Only clean files are stored under
-- the documents prefix; infected ones are recorded with their quarantine key.
CREATE TABLE document_versions (
    document_id          uuid        NOT NULL,
    version              integer     NOT NULL,
    organization_id      uuid        NOT NULL,
    file_name            text        NOT NULL,
    content_type         text        NOT NULL,
    size_bytes           bigint      NOT NULL,
    sha256               bytea       NOT NULL,
    storage_key          text        NOT NULL,
    scan_status          text        NOT NULL,
    scan_signature       text,
    extraction_state     text        NOT NULL DEFAULT 'NOT_STARTED',
    uploaded_by_user_id  uuid        REFERENCES users (id),
    uploaded_via_link_id uuid,
    uploaded_at          timestamptz NOT NULL,
    PRIMARY KEY (document_id, version),
    CONSTRAINT document_versions_document_fk FOREIGN KEY (organization_id, document_id)
        REFERENCES documents (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT document_versions_link_fk FOREIGN KEY (organization_id, uploaded_via_link_id)
        REFERENCES request_links (organization_id, id),
    CONSTRAINT document_versions_scan_valid CHECK (scan_status IN ('CLEAN', 'INFECTED')),
    CONSTRAINT document_versions_sha256_length CHECK (octet_length(sha256) = 32),
    CONSTRAINT document_versions_version_positive CHECK (version >= 1),
    CONSTRAINT document_versions_uploader CHECK (num_nonnulls(uploaded_by_user_id, uploaded_via_link_id) = 1),
    CONSTRAINT document_versions_key_scoped CHECK (
        storage_key LIKE 'org/' || organization_id::text || '/%'
        OR storage_key LIKE 'quarantine/org/' || organization_id::text || '/%')
);

-- Submitted information with its provenance (Guidelines §22, §136). Items are
-- never rewritten: only the review columns can change (enforced by column
-- privileges below).
CREATE TABLE information_items (
    id                 uuid        PRIMARY KEY,
    organization_id    uuid        NOT NULL,
    requirement_id     uuid        NOT NULL,
    kind               text        NOT NULL,
    value_text         text,
    document_id        uuid,
    document_version   integer,
    source_type        text        NOT NULL,
    source_user_id     uuid        REFERENCES users (id),
    source_link_id     uuid,
    received_at        timestamptz NOT NULL,
    confidence         numeric(4, 3),
    verification_state text        NOT NULL,
    reviewed_by        uuid        REFERENCES users (id),
    reviewed_at        timestamptz,
    review_reason      text,
    CONSTRAINT information_items_org_id_unique UNIQUE (organization_id, id),
    CONSTRAINT information_items_requirement_fk FOREIGN KEY (organization_id, requirement_id)
        REFERENCES requirements (organization_id, id) ON DELETE CASCADE,
    CONSTRAINT information_items_link_fk FOREIGN KEY (organization_id, source_link_id)
        REFERENCES request_links (organization_id, id),
    CONSTRAINT information_items_document_fk FOREIGN KEY (document_id, document_version)
        REFERENCES document_versions (document_id, version),
    CONSTRAINT information_items_kind_valid CHECK (kind IN ('DOCUMENT', 'TEXT', 'NUMBER', 'DATE', 'BOOLEAN')),
    CONSTRAINT information_items_payload CHECK (
        (kind = 'DOCUMENT' AND document_id IS NOT NULL AND document_version IS NOT NULL AND value_text IS NULL)
        OR (kind <> 'DOCUMENT' AND value_text IS NOT NULL AND document_id IS NULL)),
    CONSTRAINT information_items_source_valid CHECK (
        (source_type = 'CLIENT_LINK' AND source_link_id IS NOT NULL AND source_user_id IS NULL)
        OR (source_type = 'TEAM_MEMBER' AND source_user_id IS NOT NULL AND source_link_id IS NULL)),
    CONSTRAINT information_items_verification_valid CHECK (verification_state IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT information_items_rejection_reason CHECK (verification_state <> 'REJECTED' OR review_reason IS NOT NULL),
    CONSTRAINT information_items_confidence_range CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)
);
CREATE INDEX information_items_requirement_idx ON information_items (organization_id, requirement_id, received_at DESC);

ALTER TABLE requirements ADD CONSTRAINT requirements_current_item_fk FOREIGN KEY (organization_id, current_item_id)
    REFERENCES information_items (organization_id, id);

-- Request-link access path ----------------------------------------------------

CREATE FUNCTION app_request_link_token_hash() RETURNS bytea
    LANGUAGE sql STABLE
    AS $$ SELECT decode(nullif(current_setting('app.request_link_token_hash', true), ''), 'hex') $$;

-- The link the transaction holds, while it is usable; NULL otherwise.
CREATE FUNCTION app_request_link_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT id FROM request_links
          WHERE token_hash = app_request_link_token_hash() AND revoked_at IS NULL AND expires_at > now() $$;

CREATE FUNCTION app_request_link_organization_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT organization_id FROM request_links WHERE id = app_request_link_id() $$;

-- Policies --------------------------------------------------------------------

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_link_requirements ENABLE ROW LEVEL SECURITY;

-- Team members: everything of the current organization only.
CREATE POLICY clients_tenant ON clients
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY projects_tenant ON projects
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY tasks_tenant ON tasks
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY work_transitions_tenant ON work_transitions
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());

-- Work: the team, or a link holder reading the title of its own work.
CREATE POLICY work_tenant ON work
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY work_link_read ON work FOR SELECT
    USING (id = (SELECT work_id FROM request_links WHERE id = app_request_link_id()));

-- Request links: the team, or the holder of the token (to resolve it).
CREATE POLICY request_links_tenant ON request_links
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY request_links_holder_read ON request_links FOR SELECT
    USING (token_hash = app_request_link_token_hash());
CREATE POLICY request_links_holder_touch ON request_links FOR UPDATE
    USING (id = app_request_link_id()) WITH CHECK (id = app_request_link_id());

CREATE POLICY rlr_tenant ON request_link_requirements
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY rlr_link_read ON request_link_requirements FOR SELECT
    USING (request_link_id = app_request_link_id());

-- Requirements: the team, or a link holder for the link's requirements only
-- (read, and pointing them at a newly submitted item).
CREATE POLICY requirements_tenant ON requirements
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY requirements_link_read ON requirements FOR SELECT
    USING (id IN (SELECT requirement_id FROM request_link_requirements WHERE request_link_id = app_request_link_id()));
CREATE POLICY requirements_link_update ON requirements FOR UPDATE
    USING (id IN (SELECT requirement_id FROM request_link_requirements WHERE request_link_id = app_request_link_id()))
    WITH CHECK (id IN (SELECT requirement_id FROM request_link_requirements
                       WHERE request_link_id = app_request_link_id()));

-- Information: a link holder sees and adds items of its requirements only,
-- and only items attributed to its own link may be inserted.
CREATE POLICY information_items_tenant ON information_items
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY information_items_link_read ON information_items FOR SELECT
    USING (requirement_id IN (SELECT requirement_id FROM request_link_requirements
                              WHERE request_link_id = app_request_link_id()));
CREATE POLICY information_items_link_insert ON information_items FOR INSERT
    WITH CHECK (source_link_id = app_request_link_id()
                AND requirement_id IN (SELECT requirement_id FROM request_link_requirements
                                       WHERE request_link_id = app_request_link_id()));

-- Documents: a link holder may add versions to the documents of its
-- requirements; it never reads stored files (the API does not offer that).
CREATE POLICY documents_tenant ON documents
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY documents_link_read ON documents FOR SELECT
    USING (requirement_id IN (SELECT requirement_id FROM request_link_requirements
                              WHERE request_link_id = app_request_link_id()));
CREATE POLICY documents_link_insert ON documents FOR INSERT
    WITH CHECK (requirement_id IN (SELECT requirement_id FROM request_link_requirements
                                   WHERE request_link_id = app_request_link_id()));
CREATE POLICY document_versions_tenant ON document_versions
    USING (organization_id = app_organization_id()) WITH CHECK (organization_id = app_organization_id());
CREATE POLICY document_versions_link_read ON document_versions FOR SELECT
    USING (document_id IN (SELECT d.id FROM documents d JOIN request_link_requirements r
                               ON r.requirement_id = d.requirement_id
                           WHERE r.request_link_id = app_request_link_id()));
CREATE POLICY document_versions_link_insert ON document_versions FOR INSERT
    WITH CHECK (uploaded_via_link_id = app_request_link_id()
                AND document_id IN (SELECT d.id FROM documents d JOIN request_link_requirements r
                                        ON r.requirement_id = d.requirement_id
                                    WHERE r.request_link_id = app_request_link_id()));

-- A link holder may read the name of the organization that asked, and its
-- actions are audited in that organization.
CREATE POLICY organizations_link_read ON organizations FOR SELECT
    USING (id = app_request_link_organization_id());
CREATE POLICY audit_events_link_insert ON audit_events FOR INSERT
    WITH CHECK (organization_id = app_request_link_organization_id() AND actor_user_id IS NULL);

-- Immutability ----------------------------------------------------------------

REVOKE UPDATE, DELETE, TRUNCATE ON work_transitions FROM ${app_role};
REVOKE UPDATE, DELETE, TRUNCATE ON document_versions FROM ${app_role};
REVOKE UPDATE, DELETE, TRUNCATE ON information_items FROM ${app_role};
GRANT UPDATE (verification_state, reviewed_by, reviewed_at, review_reason, confidence)
    ON information_items TO ${app_role};
-- Work, requirements and documents are kept for their history; normal
-- operations never delete them (Guidelines §23).
REVOKE DELETE, TRUNCATE ON work, requirements, documents, request_link_requirements FROM ${app_role};
