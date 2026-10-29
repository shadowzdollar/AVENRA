# Analytics

How an organization's work is going, and whether customers activate and stay
(ADR-038). Code: `apps/api/.../analytics`, `platform/analytics`; schema
`V13__analytics.sql`; web: `/organizations/{id}/analytics`.

## Organization analytics

`GET /api/v1/organizations/{id}/analytics?days=7|30|90` (`analytics.read`).
Each module's `AnalyticsContributor` reports on its own tables for the period
and the period before:

| Module | Metrics |
|---|---|
| work | completed, created, completion rate, median and 90th-percentile time to complete, intervention rate, exceptions raised and resolved, median time to resolve; weekly completions; by type of work |
| information | collected, accepted on review, requests sent, requests answered, median client response time |
| verification | checks, pass rate |
| agent | steps proposed, automation rate |
| billing | daily usage from the usage records |

Reports are computed on every request (ADR-039).

## Customer analytics (operators)

Every six hours a platform job stores one row a day in
`platform_daily_metrics` from `platform_daily_counts()` and publishes the
gauge `avenra.customers{measure=…}`: organizations, created in the last 30
days, activated (a first completed work item), active in the last 7 and 30
days, and the 30–60-day cohort with how many of it were active in the last
week. Counts only.

## Adding a metric

Implement or extend the module's contributor, read only that module's
tables, and return counts or durations, never content.
