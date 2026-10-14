# ADR-025: Durable email and client reminders

**Status:** Accepted (amends ADR-015 and ADR-020)

## Context

ADR-015 sent email after commit from memory: a crash between commit and send
lost the email. Request links (ADR-020) store only a token hash, so the
platform could never send the link again, which reminders need.

## Decision

- **Every email is a job** (`email.send`) enqueued in the transaction that
  causes it. The payload (recipient, subject, body with any single-use link) is
  encrypted with the application key (`SecretBox`, AES-GCM, key id stored) and
  erased when the job finishes, delivered or not. Transient SMTP failures are
  retried with backoff; permanent ones (rejected recipient) are not. An email
  that cannot be delivered raises a `DELIVERY_FAILED` exception for tenant
  emails.
- **Request-link tokens** are stored twice: the SHA-256 hash for lookup (as
  before) and an AES-GCM ciphertext bound to the link id, so reminders can
  contain the same link. Revoking or expiring a link erases the ciphertext.
- **Reminders** (product defaults): a scheduled job finds active links with
  required items still missing or rejected; the first reminder goes 3 days
  after the link was sent, then every 3 days, at most 3, never in the last day
  before expiry. Each reminder is an execution (ADR-023) with the reminder
  number as idempotency key, so it is sent at most once; reminders stop when
  everything asked for has been answered.

## Consequences

- No email is lost to a crash; delivery is visible as jobs and executions.
- A database leak exposes request-link tokens only together with the
  application key, which lives outside the database (as for TOTP secrets,
  ADR-017).
