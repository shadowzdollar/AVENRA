# ADR-038: Analytics

**Status:** Accepted; amended by ADR-039 (no cache)

## Context

Guidelines §112 and Phase 12: operational analytics, workflow metrics,
customer analytics and usage analytics, respecting privacy and customer data
boundaries. The Master Project (§27) lists the operational, customer and
business metrics, and names the strongest one: useful business work
completed through Avenra.

## Decision

- **Two audiences, two boundaries.**
  - *Organizations* see analytics of their own work only, computed in their
    tenant scope under row-level security (permission `analytics.read`:
    owners, admins and managers).
  - *Avenra's operators* see customer analytics (activation, active
    organizations, retention) as aggregate counts with no organization ids,
    names or content, exported as metrics (§60). No operator can read a
    tenant's analytics through this path.
- **Contributors, again.** The platform defines `AnalyticsContributor`; each
  module computes its metrics from its own tables for one organization and a
  period (ADR-036 pattern). Work: created, completed, completion rate,
  median and 90th-percentile completion time, work by type (workflow
  metrics), weekly completions, human intervention rate (completed work that
  needed an exception). Information: items collected, accepted on review,
  client response time (median, request sent to first answer).
  Verification: pass rate. Exceptions: raised, resolved, median time to
  resolve. Agent: plan steps proposed and executed (automation rate).
- **Usage analytics** read billing's daily usage records (ADR-037), so usage
  shown matches usage billed.
- **Periods** are the last 7, 30 or 90 days (**product default** 30), each
  compared with the period before.
- **Computed on read**, from indexed tables; no copy of tenant data is kept
  for analytics. Results are cached per organization and period for five
  minutes.
- **Customer analytics** come from a daily platform job that calls a
  definer function returning only counts (organizations created, activated —
  completed a first work item — and active in the last 7 and 30 days); the
  counts are kept in `platform_daily_metrics` and published as gauges.
- No third-party analytics service and no tracking in the web app (§112
  privacy).

## Consequences

- A new module adds metrics by implementing a contributor.
- Analytics can never be broader than what row-level security lets the
  organization see.
- Business metrics (revenue, margin, acquisition cost) wait for the real
  billing provider.
