# Notifications

Tells people what needs them (ADR-035). Code: `apps/api/.../notification`;
escalation sweep in `work/application/UnattendedExceptions`; schema
`V10__notifications.sql`; web: the header link, `/notifications`, and email
preferences on `/account`.

## How it works

1. Facts from other modules (exceptions raised or unattended, client answers,
   expired requests, plans waiting, paused integrations) are turned into a
   notice and queued as a job in the organization's scope.
2. The job resolves recipients from current memberships, writes one
   notification per person and key through `notifications_create`, and queues
   an email through the durable email job when the person's preference (or the
   category's default) says so and their address is verified.
3. People read their notifications across organizations and choose email per
   category; in-app notifications cannot be switched off.

## Failure modes

| Failure | Behaviour |
|---|---|
| Job retried or fact repeated | Nothing new: one notification per person and key |
| Email delivery fails | The email job retries; delivery failures raise `DELIVERY_FAILED` (Phase 4) |
| Recipient left the organization | Not resolved; nothing created |

## Operations

- Metric `avenra.notifications` (category, email).
- Escalation: `avenra.work.escalation.after` (24h) and `sweep-every` (1h).
