# Phase 9: Notifications

**Status:** Complete (2026-10-20)
**Guidelines:** §56, §58, §59, §103, §121 (Phase 9)
**Master Project:** §12 steps 8–9, §14.3

## Goal

The right person learns what needs them, once, in the way they chose. When an
exception is raised on work they own, a client answers, a request expires
incomplete, the assistant's plan waits for a decision, or an integration
stops, Avenra creates an in-app notification and, if their preferences say so,
an email. Nothing is sent twice. High-severity exceptions that nobody picks up
are escalated to the organization's owners.

## Decisions (recorded in ADRs; product defaults marked)

- Notification model, recipients, channels, preferences and escalation
  (ADR-035)
- Product defaults: in-app is always on; email is on for exceptions, expired
  requests, approvals waiting and integration problems, off for answers
  received; an open high-severity exception that is still unassigned after 24
  hours is escalated once to owners

## Steps

1. ADR-035 and this phase file
2. Contract: notifications, unread count, read, preferences
3. Database: notifications and preferences with row-level security
4. API: `notification` module (recipients from permissions, templates,
   deduplication, email through the durable email job, escalation sweep)
5. Web: bell with unread count, notifications page, preferences on the account page
6. Threat model, subsystem documentation, hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 9.1 | ADR for notifications | ADR-035 | ☑ |
| 9.2 | Each source fact notifies the right people (by permission or ownership), never people outside the organization | `NotificationsIT.anExceptionTellsTheWorksOwner…` (owner told), `…aClientsAnswerTellsTheOwner…`, `…aPlanWaitingForApprovalTellsTheApprovers` (viewer not told), `…peopleReadOnlyTheirOwn…` (member not told); `notifications_create` refuses non-members | ☑ |
| 9.3 | Notifications are deduplicated; a retried or repeated fact does not notify twice | `NotificationsIT.anExceptionTellsTheWorksOwnerInTheAppAndByEmailOnce` (replayed job: one notification, one email), `…EscalatedOnceToOwners`; unique (person, key) | ☑ |
| 9.4 | Email goes through the durable email job, with retries and delivery status, only when the person's preference allows | Email through `OutgoingEmail` (ADR-025) only to verified addresses as chosen; `NotificationsIT.anException…` (email queued), `…preferencesDecideOnEmail…` (none when off), `…aClientsAnswer…` (default off) | ☑ |
| 9.5 | Preferences per person and category; in-app cannot be switched off for safety-relevant categories | `NotificationsIT.preferencesDecideOnEmailButNotOnTheInAppNotification`; `inApp` always true; `e2e/notifications.spec.ts` (saved) | ☑ |
| 9.6 | Templates produce plain text without secrets or client documents | `TemplatesTest`; `NotificationsIT.aClientsAnswer…` (answer value absent) | ☑ |
| 9.7 | Unattended high-severity exceptions are escalated once to owners | `UnattendedExceptions` sweep; `NotificationsIT.anUnattendedHighSeverityExceptionIsEscalatedOnceToOwners` | ☑ |
| 9.8 | A person sees and reads only their own notifications; tenants are isolated | `NotificationsIT.peopleReadOnlyTheirOwnNotifications`, `WorkRowLevelSecurityIT` (notifications) | ☑ |
| 9.9 | Reminders: client reminders (Phase 4) remain; a plan nobody decides on ends at its deadline and notifies people again | Client reminders unchanged (Phase 4 tests); waiting plans end at the run deadline with a notifying exception (`AgentRunIT.aRunPastItsDeadline…`) | ☑ |
| 9.10 | Web: bell, list, read, preferences | Header link with unread count, `/notifications`, preferences on `/account`; `e2e/notifications.spec.ts`; `notifications.test.ts` | ☑ |
| 9.11 | Threat model for notifications | `docs/security/threat-model-notifications.md` | ☑ |

## Hardening record

- Local runs of every CI check (`make check`: API 107 unit and 168 integration
  tests, web 50, AI service 82) and the browser journeys (7/7) against a
  production web build.
- Found and fixed while hardening: `INSERT … ON CONFLICT` needs the
  conflicting rows to be visible, which would have meant letting organization
  sessions read everyone's notifications; creation now goes through a definer
  function that checks the organization and membership itself. Preference
  checkboxes now change at once (they waited for the server).

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| Push, SMS and chat channels | No customer need yet; the channel model allows adding them | When asked |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
