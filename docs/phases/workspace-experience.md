# Workspace experience (Lovable design adopted into the web app)

**Status:** In progress
**Decision:** ADR-039
**Requested by:** product owner, 2026-10-29 (outside the numbered phases;
recorded here with the same discipline)

## Goal

The web app looks and works like the designed workspace, on real data: a
public landing page, sign-in and sign-up in the designed style, and an
organization workspace with an overview, work, requests, approvals,
exceptions, evidence, analytics, integrations, team, settings and billing.

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| W.1 | ADR for the workspace and the token amendment | ADR-039 | ☐ |
| W.2 | API: organization-wide request links, manual reminder, approvals inbox, organization-wide evidence, work search | | ☐ |
| W.3 | Design system: tokens, shell, panels, pills, buttons, forms | | ☐ |
| W.4 | Public pages: landing, sign-in, sign-up, password reset, verification | | ☐ |
| W.5 | Workspace pages on real data: overview, work (list, new, detail), requests, approvals, exceptions, evidence, analytics, integrations, team, settings, billing | | ☐ |
| W.6 | No sample data, no claims the product does not support | | ☐ |
| W.7 | Tests: unit, API integration, browser journeys for the new pages; all earlier journeys still pass | | ☐ |
| W.8 | Security review: CSP unchanged, no new external hosts, permissions respected in the UI | | ☐ |

## Deferrals

| Item | Reason | When |
|---|---|---|
| Social sign-in and SSO shown in the prototype | Not supported by the identity module | When identity adds them |
| Third-party connectors shown in the prototype (Slack, HubSpot, …) | Only webhooks and storage export exist (ADR-034) | As connectors are built |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
