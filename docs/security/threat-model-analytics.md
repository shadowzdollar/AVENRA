# Threat model: analytics (Phase 12)

**Scope:** organization analytics and operator customer counts (ADR-038).
**Method:** STRIDE; each threat names its control and evidence. Reviewed
2026-10-29.

## Threats and controls

| # | Threat | Control | Evidence |
|---|---|---|---|
| AN1 | **Information disclosure:** one organization's analytics include another's work | Computed in the caller's organization scope after a membership check; every query filters on the organization and row-level security applies | `AnalyticsIT.operationalAndWorkflowMetrics…` (another organization's completed work not counted), `…onlyThoseAllowedSeeAnalytics` (stranger 404) |
| AN2 | **Elevation of privilege:** members read analytics they should not | `analytics.read` (owners, admins, managers) | `AnalyticsIT.onlyThoseAllowedSeeAnalytics` (member 403, manager 200) |
| AN3 | **Information disclosure:** content leaks through analytics (titles, answers, client addresses) | Contributors return counts and durations only; work types are the organization's own category labels | `AnalyticsIT` (titles, exception text, answers and client address absent) |
| AN4 | **Information disclosure:** operator analytics expose tenants | A definer function returns seven counts and nothing else; the stored rows and gauges have no organization ids or names | `AnalyticsIT.operatorsGetAggregateCountsOnly`, `V13__analytics.sql` |
| AN5 | **Information disclosure:** one caller's report served to another | Reports are computed per request in the caller's organization scope; there is no shared cache (ADR-039) | `AnalyticsService` |
| AN6 | **Denial of service:** expensive reports requested repeatedly | Periods limited to 7, 30 or 90 days; indexed queries; default rate limit (no cache since ADR-039, for freshness) | `V13__analytics.sql`, `AnalyticsService` |
| AN7 | **Privacy:** tracking people across the product | No third-party analytics and no tracking scripts in the web app; the content security policy allows no external hosts | `csp.ts` |

## Accepted risks

| Risk | Decision | Revisit |
|---|---|---|
| Small organizations' counts can be traced to specific work by their own members | Accepted: members can already see that work | Never |
