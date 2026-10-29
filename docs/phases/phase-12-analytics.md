# Phase 12: Analytics

**Status:** Complete (2026-10-29)
**Guidelines:** §112, §60, §121 (Phase 12)
**Master Project:** §27

## Goal

Organizations see how their work is going (how much gets done, how fast,
where people had to step in, how quickly clients answer) and how much they
use; Avenra's operators see whether customers activate and stay, without
seeing any customer's data.

## Decisions (recorded in ADRs; product defaults marked)

- Organization analytics through module contributors, operator analytics as
  aggregate counts only (ADR-038)
- Product defaults: periods of 7, 30 or 90 days (30 by default), compared
  with the period before; "activated" means a first completed work item

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 12.1 | ADR for analytics | ADR-038 | ☑ |
| 12.2 | Operational analytics: completed, completion rate, completion time, exceptions, intervention rate, verification rate | `WorkAnalytics`, `VerificationAnalytics`; `AnalyticsIT.operationalAndWorkflowMetricsDescribeTheOrganizationsOwnWork` (completed, rate, median, intervention, exceptions, previous period) | ☑ |
| 12.3 | Workflow metrics: by work type, weekly completions, client response time, automation rate | `WorkAnalytics` (by type, weekly), `InformationAnalytics`, `AgentAnalytics`; `AnalyticsIT.operational…` (work types, weekly), `…clientResponseTimeComesFromTheFirstAnswerToARequest` | ☑ |
| 12.4 | Usage analytics from billing's usage records | `UsageAnalytics` (billing usage records); `AnalyticsIT.usageAnalyticsShowTheRecordsBillingKeeps` | ☑ |
| 12.5 | Customer analytics for operators as aggregate counts only | `platform_daily_counts()`, `platform_daily_metrics`, gauge `avenra.customers`; `AnalyticsIT.operatorsGetAggregateCountsOnly` | ☑ |
| 12.6 | Privacy and boundaries: `analytics.read`, tenant isolation, no content in analytics | `analytics.read`; `AnalyticsIT.onlyThoseAllowedSeeAnalytics` (member 403, stranger 404), `…operational…` (other organization not counted; no titles), `…clientResponseTime…` (no answers or addresses); CSP `connect-src 'self'` | ☑ |
| 12.7 | Web: analytics page | `/organizations/{id}/analytics`; `e2e/analytics.spec.ts`; `analytics.test.ts` | ☑ |
| 12.8 | Threat model for analytics | `docs/security/threat-model-analytics.md` | ☑ |

## Hardening record

- Local runs of every CI check (`make check`: API 114 unit and 187 integration
  tests, web 61, AI service 82) and the browser journeys (10/10) against a
  production web build.
- Found while hardening: the web build now stops once to warn that Next.js
  16.4.0 has a known vulnerability; the upgrade (Dependabot #63, #59) follows
  as its own change right after this phase.

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| Business metrics (revenue, margin, acquisition cost, lifetime value) | Need the real billing provider | With the real provider |
| Customer satisfaction | Needs a feedback channel | When asked |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
