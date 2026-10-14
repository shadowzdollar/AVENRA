# ADR-015: Transactional email in Phase 2

**Status:** Accepted — delivery amended by ADR-025 (durable outbox)

## Context

Identity needs email for verification, password reset and invitations.
Notifications as a full capability (templates, preferences, delivery status)
are Phase 9, and durable jobs (ADR-007) are Phase 4.

## Decision

- An `EmailSender` interface in the platform module with an **SMTP**
  implementation. The production provider is chosen with the deployment
  platform (Phase 13); any provider with SMTP works without code changes.
- Locally, **Mailpit** (added to `make infra-up`) receives every message and
  shows it in a web UI; nothing leaves the machine.
- Emails are sent **after the database transaction commits**, so no email is
  sent for a change that rolled back. Sending failures are logged and
  retried a few times in-process.
- Emails contain links with single-use tokens and never contain secrets
  such as passwords.

## Alternatives

- **Provider SDK now** — rejected: premature lock-in before the deployment
  platform is chosen.

## Consequences

- Known gap until Phase 4: a crash between commit and send can lose an email.
  Users can request a new verification or reset email, and invitations can
  be resent. Phase 4 moves sending onto the durable job queue.
