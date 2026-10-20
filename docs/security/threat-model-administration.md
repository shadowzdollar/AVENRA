# Threat model: administration (Phase 10)

**Scope:** audit history and export, organization settings, the roles matrix,
usage and health (ADR-036).
**Method:** STRIDE; each threat names its control and evidence. Reviewed
2026-10-20.

## Threats and controls

| # | Threat | Control | Evidence |
|---|---|---|---|
| A1 | **Information disclosure:** reading another organization's history, usage or health | Every endpoint runs in the caller's organization scope after a membership check; history queries filter on the organization and row-level security limits reads to it; account-level events (no organization) are never included | `AdministrationIT.onlyThoseAllowedReadAdministration` (stranger 404, other organization's events absent) |
| A2 | **Elevation of privilege:** members without the permission read history or health | `audit.read` for history and export, `organization.manage` for usage, health and settings, `members.read` for the roles matrix; permissions, not roles | `AdministrationIT.onlyThoseAllowedReadAdministration` (manager 403), `…settingsChange…` (member 403) |
| A3 | **Tampering:** a crafted cursor or filter reaches other rows or alters the query | Cursor is decoded into a time and an id and bound as parameters; the action prefix is matched literally (`starts_with`, no pattern characters); filters only narrow the organization's rows; an invalid cursor is refused | `AdministrationIT.auditHistoryIsPaged…` (bad cursor 400), `…FilteredBy…` (`%` matches nothing) |
| A4 | **Tampering:** formulas in an exported CSV run in a spreadsheet | Every cell is quoted; cells starting with `= + - @`, tab or carriage return get a leading apostrophe | `AdministrationIT.theExportIsCsvSafeToOpenInASpreadsheet` |
| A5 | **Information disclosure:** secrets or client documents in the history | Audit details never hold secrets, tokens or document content by construction (§59); history is shown as stored | Review of every `AuditLog.Event.detail` key (2026-10-20): ids, versions, outcomes, reasons, settings |
| A6 | **Denial of service:** large exports or deep paging | Pages of 50 by an indexed (organization, time) or (organization, action, time) order; exports stop at 10,000 rows; default rate limit | `JdbcAuditHistory`, `V11__administration.sql` |
| A7 | **Repudiation:** settings change without a trace | Name and request-link validity changes are audited with who and what | `AdministrationIT.settingsChangeTheDefaultRequestLinkValidity` (`organization.settings_changed`) |
| A8 | **Tampering:** the audit history is changed or deleted | Unchanged from Phase 2: the application role cannot update or delete audit events; administration only reads | `V3__organizations.sql` (revoked privileges) |

## Accepted risks

| Risk | Decision | Revisit |
|---|---|---|
| Exporting the history is not itself audited | Accepted: export is a read like browsing; requests are logged with their request id | Phase 12 (compliance) |
| A notification stays readable after the person leaves the organization (from Phase 9) | Still accepted: it only holds titles, and the link no longer opens the work | When retention is designed |
| Health is per organization, not per platform | Operators use metrics, traces and logs (§60) | Phase 13 |
