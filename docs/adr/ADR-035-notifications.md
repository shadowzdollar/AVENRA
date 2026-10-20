# ADR-035: Notifications

**Status:** Accepted

## Context

Guidelines §56: notifications over email and in-app, with retries,
deduplication, delivery status, user preferences, templates and audit history
where appropriate. Phases 4–8 produce facts that need a person (exceptions,
expired requests, plans waiting, paused integrations), but only clients were
emailed (reminders) and people had to look at pages to find out.

## Decision

- **Module.** `notification` listens to domain facts of other modules and
  decides who is told. Nothing depends on it.
- **Sources, recipients and categories:**

  | Fact | Category | Recipients |
  |---|---|---|
  | Work exception raised (`WorkEvents.ExceptionRaised`) | `exception` | the work's owner, or those with `work.approve` when it has none |
  | Answer received (`InformationEvents.AnswerReceived`, from a client) | `answer` | the work's owner, or those with `information.verify` |
  | Request expired incomplete | `request` | the request's sender and the work's owner |
  | Agent plan or high-risk step waiting (`AgentEvents.ApprovalNeeded`) | `approval` | those with `work.approve` |
  | Integration paused (`IntegrationEvents.ConnectionPaused`) | `integration` | those with `integration.manage` |
  | High-severity exception unattended for 24 hours | `escalation` | owners |

  Recipients are resolved at the time of the fact from current memberships and
  permissions, so nobody outside the organization is told.
- **Notification** (per person, tenant-owned): category, title, body (plain
  text from a template), link to the page in Avenra, the source, a dedupe key,
  read time, email status (`NOT_SENT`, `QUEUED`), created time. A unique
  (person, dedupe key) makes every source idempotent: a retried job or a
  repeated event creates nothing new.
- **Channels.** In-app is always created. Email is queued through the existing
  durable email job (ADR-025: encrypted, retried, delivery recorded) when the
  person's preference for the category allows it.
- **Preferences** per person and category (email on or off). Defaults
  (**product default**): email on for `exception`, `request`, `approval`,
  `integration`, `escalation`; off for `answer`. In-app cannot be switched off.
- **Templates** are code (plain text, no markup), with the organization and
  work titles and a link; never answer values, document content, tokens or
  client email addresses.
- **Escalation.** A sweep finds open HIGH exceptions without an assignee older
  than 24 hours (**product default**) and notifies owners once per exception
  (dedupe key `escalation:<exception id>`).
- **Reminders.** Client reminders stay as in Phase 4. A plan waiting for
  approval is bounded by its run's one-hour deadline (ADR-033): if nobody
  decides, the run stops and the resulting exception notifies people again, so
  no separate approval reminder is needed.
- **Escalation is detected by the work module** (it owns exceptions): its sweep
  publishes `WorkEvents.ExceptionUnattended`, and this module notifies owners.

## Consequences

- New facts become notifications by adding a listener and a template.
- Notifications are not an audit trail; the audit log stays the record (§59).
