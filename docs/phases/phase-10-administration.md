# Phase 10: Audit and Administration

**Status:** Complete (2026-10-20)
**Guidelines:** §18, §59, §60–§61, §128, §121 (Phase 10)
**Master Project:** §14.6, §16.5

## Goal

An organization's administrators can run it without asking anyone: see what
happened and who did it (audit history, filterable and exportable), set the
organization's defaults, understand who can do what, manage integrations,
see how much they use, and see whether anything is wrong right now (stuck or
failed jobs, paused integrations, quarantined files, open high exceptions).

## Decisions (recorded in ADRs; product defaults marked)

- Audit history, settings, permissions view, usage and health through module
  contributors (ADR-036)
- Product defaults: request links valid for 14 days unless the organization
  chooses 1–30; health turns to "needs attention" on any failed job, failed
  email, paused integration, quarantined file or open high exception in the
  last 24 hours

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 10.1 | ADR for administration | ADR-036 | ☑ |
| 10.2 | Audit history: filter by action, person and time; paged; exported as CSV; only `audit.read`; tenants isolated | `AdministrationIT.auditHistoryIsPagedNewestFirstWithoutGapsOrRepeats`, `…FilteredByActionPersonAndTime`, `…theExportIsCsvSafeToOpenInASpreadsheet`, `…onlyThoseAllowedReadAdministration` (manager 403, stranger 404, other organization absent) | ☑ |
| 10.3 | Organization settings: name and request-link validity, used by new requests, changes audited | `AdministrationIT.settingsChangeTheDefaultRequestLinkValidity` (30 days used by a new link, `organization.settings_changed` audited, 0 and 31+ refused, member 403); `RequestLinkService` uses the organization default | ☑ |
| 10.4 | Permissions administration: who can do what per role, and role changes (existing) | `GET …/roles` from `Role`; `AdministrationIT.theRolesMatrixIsTheOneEnforced`; role changes stay on the members page (Phase 2 tests) | ☑ |
| 10.5 | Integration administration (Phase 8 page) reachable from administration | Administration page links to `/organizations/{id}/integrations` (Phase 8) | ☑ |
| 10.6 | Usage: members, work, documents and storage, AI calls, deliveries — each module reports its own | Contributors `OrganizationFigures`, `WorkFigures`, `DocumentFigures`, `AiFigures`, `IntegrationFigures`; `AdministrationIT.usageAndHealthComeFromTheModulesThatOwnTheData` | ☑ |
| 10.7 | System health for the organization: jobs, email, integrations, files, exceptions | `JobHealth`, `WorkFigures`, `DocumentFigures`, `IntegrationFigures` checks; `AdministrationIT.usageAndHealth…` (failed job turns health to ATTENTION) | ☑ |
| 10.8 | Web: administration page | `/organizations/{id}/administration`; `e2e/administration.spec.ts`; `administration.test.ts` | ☑ |
| 10.9 | Security review of administration | `docs/security/threat-model-administration.md` | ☑ |

## Hardening record

- Local runs of every CI check (`make check`: API 107 unit and 175 integration
  tests, web 55, AI service 82) and the browser journeys (8/8) against a
  production web build.
- Found and fixed while hardening: the contract fixed a default of 14 days for
  each request link, which would have hidden the organization's setting; the
  setting now has the same 1–30 range as a single link. A notification
  preference could flip back when a load was still on its way (the browser
  journey caught it); the change now cancels that load first. One full
  browser run had the agent journey fail once; it passed alone and in the
  next full run, and is noted as possibly flaky.

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| Platform operator console (all tenants) | Operators use metrics, traces and logs (§60); a console needs operator roles | Phase 13 |
| Audit retention and archiving policy | Part of compliance work | Phase 12+ |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
