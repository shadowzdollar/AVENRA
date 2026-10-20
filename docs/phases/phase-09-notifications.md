# Phase 9: Notifications

**Status:** In progress
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
| 9.1 | ADR for notifications | | ☐ |
| 9.2 | Each source fact notifies the right people (by permission or ownership), never people outside the organization | | ☐ |
| 9.3 | Notifications are deduplicated; a retried or repeated fact does not notify twice | | ☐ |
| 9.4 | Email goes through the durable email job, with retries and delivery status, only when the person's preference allows | | ☐ |
| 9.5 | Preferences per person and category; in-app cannot be switched off for safety-relevant categories | | ☐ |
| 9.6 | Templates produce plain text without secrets or client documents | | ☐ |
| 9.7 | Unattended high-severity exceptions are escalated once to owners | | ☐ |
| 9.8 | A person sees and reads only their own notifications; tenants are isolated | | ☐ |
| 9.9 | Reminders: client reminders (Phase 4) remain; a plan nobody decides on ends at its deadline and notifies people again | | ☐ |
| 9.10 | Web: bell, list, read, preferences | | ☐ |
| 9.11 | Threat model for notifications | | ☐ |

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| Push, SMS and chat channels | No customer need yet; the channel model allows adding them | When asked |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
