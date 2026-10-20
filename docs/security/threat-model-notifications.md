# Threat model: notifications (Phase 9)

**Scope:** notifications, preferences, email copies and escalation (ADR-035).
**Method:** STRIDE; each threat names its control and evidence. Reviewed
2026-10-20.

## Threats and controls

| # | Threat | Control | Evidence |
|---|---|---|---|
| N1 | **Information disclosure:** a person reads someone else's notifications | Reads and marking only where `user_id = app_user_id()`; every endpoint acts for the caller only; organization sessions cannot read notifications at all | `NotificationsIT.peopleReadOnlyTheirOwnNotifications` (colleague 404, stranger sees none), `WorkRowLevelSecurityIT` |
| N2 | **Information disclosure:** notifying people outside the organization | Recipients come from current memberships and permissions; the creating function refuses non-members and other organizations | `notifications_create` (V10), `NotificationsIT.aPlanWaitingForApprovalTellsTheApprovers` (viewer not told) |
| N3 | **Information disclosure:** client data copied into notifications or emails | Templates use organization, work and requirement titles only; never answer values, documents, tokens or client addresses | `NotificationsIT.aClientsAnswerTells…` (answer value absent), `TemplatesTest` |
| N4 | **Spam / repudiation:** the same fact notifies again on retries | One notification per person and key, enforced by the database; job keys per fact | `NotificationsIT.anExceptionTellsTheWorksOwner…Once` (replayed job: one notification, one email), `…EscalatedOnce…` |
| N5 | **Tampering:** header injection or markup in emails | Plain text; control characters removed from titles and bodies; subjects sanitized by `EmailMessage` | `TemplatesTest` |
| N6 | **Denial of service:** email to unverified addresses | Email only to verified addresses and only as the person chose; durable job with retries | `Notifier`, `NotificationsIT.preferencesDecideOnEmail…` |

## Accepted risks

| Risk | Decision | Revisit |
|---|---|---|
| A notification stays readable after the person leaves the organization | Accepted: it only holds titles; the link no longer opens the work | Phase 10 (administration) |
