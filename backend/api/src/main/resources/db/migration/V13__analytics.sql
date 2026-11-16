-- Analytics (Phase 12, ADR-038). Organization analytics are computed on read
-- from the organization's own rows; these indexes keep the period queries
-- cheap.
CREATE INDEX work_org_created_idx ON work (organization_id, created_at);
CREATE INDEX work_org_completed_idx ON work (organization_id, completed_at) WHERE status = 'COMPLETED';
CREATE INDEX work_transitions_org_status_idx ON work_transitions (organization_id, to_status, occurred_at);
CREATE INDEX information_items_org_received_idx ON information_items (organization_id, received_at);
CREATE INDEX information_items_link_idx ON information_items (organization_id, source_link_id, received_at)
    WHERE source_link_id IS NOT NULL;
CREATE INDEX request_links_org_created_idx ON request_links (organization_id, created_at);
CREATE INDEX verifications_org_created_idx ON verifications (organization_id, created_at);
CREATE INDEX agent_steps_org_created_idx ON agent_steps (organization_id, created_at);

-- Customer analytics for Avenra's operators: counts only, never an
-- organization id, name or content. One row per day.
CREATE TABLE platform_daily_metrics (
    day                 date        PRIMARY KEY,
    organizations       bigint      NOT NULL,
    created_last_30d    bigint      NOT NULL,
    activated           bigint      NOT NULL,
    active_last_7d      bigint      NOT NULL,
    active_last_30d     bigint      NOT NULL,
    cohort_30_to_60d    bigint      NOT NULL,
    cohort_retained     bigint      NOT NULL,
    recorded_at         timestamptz NOT NULL
);
REVOKE UPDATE, DELETE, TRUNCATE ON platform_daily_metrics FROM ${app_role};

-- Counts across all organizations. A definer function, because no tenant
-- scope may read other tenants' rows; it returns numbers only.
--   activated: completed at least one work item
--   active: someone signed in to it did something (an audit event with a person)
--   retained: of organizations created 30 to 60 days ago, those active in the last 7 days
CREATE FUNCTION platform_daily_counts()
    RETURNS TABLE (organizations bigint, created_last_30d bigint, activated bigint, active_last_7d bigint,
                   active_last_30d bigint, cohort_30_to_60d bigint, cohort_retained bigint)
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
    AS $$
    WITH active7 AS (
        SELECT DISTINCT organization_id FROM audit_events
        WHERE organization_id IS NOT NULL AND actor_user_id IS NOT NULL AND occurred_at > now() - interval '7 days'),
    cohort AS (
        SELECT id FROM organizations
        WHERE created_at <= now() - interval '30 days' AND created_at > now() - interval '60 days')
    SELECT
        (SELECT count(*) FROM organizations),
        (SELECT count(*) FROM organizations WHERE created_at > now() - interval '30 days'),
        (SELECT count(DISTINCT organization_id) FROM work WHERE status = 'COMPLETED'),
        (SELECT count(*) FROM active7),
        (SELECT count(DISTINCT organization_id) FROM audit_events
         WHERE organization_id IS NOT NULL AND actor_user_id IS NOT NULL AND occurred_at > now() - interval '30 days'),
        (SELECT count(*) FROM cohort),
        (SELECT count(*) FROM cohort c WHERE c.id IN (SELECT organization_id FROM active7))
    $$;
REVOKE EXECUTE ON FUNCTION platform_daily_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform_daily_counts() TO ${app_role};
