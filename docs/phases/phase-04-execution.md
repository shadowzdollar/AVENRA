# Phase 4: Work execution

**Status:** In progress
**Guidelines:** §9, §26, §28–§30, §101–§107, §121 (Phase 4)
**Master Project:** §11–§12 (collect, follow up, and see what is blocked)

## Goal

Work moves forward without someone watching it. The platform runs durable
background jobs that survive restarts, retries what can be retried and stops
on what cannot, follows up with clients on a persisted schedule, moves work
between waiting and running on its own, records every automated action as an
execution, and turns anything that needs a person into an explicit human task
or exception that says exactly what is needed.

## Decisions (engineering, recorded in ADRs; product defaults marked)

- In-house PostgreSQL job engine (ADR-022), closing the open choice in ADR-007
- Execution records and their state machine; automatic work transitions (ADR-023)
- Exceptions and system-created human tasks (ADR-024)
- Durable email outbox and client reminders (ADR-025)
- Product defaults (changeable later): first reminder 3 days after a request
  is sent, then every 3 days, at most 3 reminders, none in the last day before
  the link expires

## Steps

1. ADRs 022–025; amendments to ADR-015, ADR-020, ADR-021
2. Job engine: table, claim/complete/fail through narrow database functions,
   leases, retry classes, exponential backoff, dead letter, persisted schedules,
   metrics
3. Durable email: every email is a job with an encrypted payload
4. Execution records with a controlled state machine (§28–§29)
5. Automatic work transitions (waiting for information ⇄ running) with a system actor
6. Reminders for unanswered request links (scheduled, idempotent, audited)
7. Exceptions (§26) with their own lifecycle; raised by dead jobs, failed
   deliveries, expired incomplete links, overdue work, malware on rescan
8. Human tasks (§106): review tasks created when information arrives, closed
   by the review
9. Rescanning stored documents on a schedule
10. Contract and web: executions, exceptions, work timeline with current
    step, blocked reason and next action (§107)
11. Hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 4.1 | ADRs for job engine, executions, exceptions and tasks, durable email and reminders | ADR-022 to ADR-025; amendments to ADR-015, ADR-020, ADR-021 | ☑ |
| 4.2 | Jobs are enqueued in the same transaction as the change that causes them | Integration tests | ☐ |
| 4.3 | Jobs survive a crash: an expired lease is reclaimed and the job runs once more | Integration tests | ☐ |
| 4.4 | Concurrent workers never run the same job at the same time | Integration tests | ☐ |
| 4.5 | Retry classes (§103): retryable with backoff, non-retryable stops, human-required raises an exception; exhausted retries dead-letter | Unit + integration tests | ☐ |
| 4.6 | Schedules are persisted and fire once per slot across instances and restarts | Integration tests | ☐ |
| 4.7 | Email is durable: delivery failures retry; payloads are encrypted at rest and removed after delivery | Integration tests | ☐ |
| 4.8 | Executions follow their state machine; every automated action is recorded with actor, input, result and error | Unit + integration tests | ☐ |
| 4.9 | Work moves between waiting for information and running automatically, recorded as system transitions | Integration tests | ☐ |
| 4.10 | Reminders follow the schedule, stop when answered, revoked or expired, and are never sent twice for a slot | Integration tests | ☐ |
| 4.11 | Exceptions have a controlled lifecycle, are raised by the listed events, and are tenant-isolated | Integration tests | ☐ |
| 4.12 | Human tasks say what is needed, why, by when, and with which choices; closed by the action they ask for | Integration tests | ☐ |
| 4.13 | Stored documents are rescanned; newly detected malware is quarantined, audited and raises an exception | Integration tests with EICAR | ☐ |
| 4.14 | New tables have row-level security; job claims bypass it only through the narrow functions | Integration tests | ☐ |
| 4.15 | The web shows status, progress, current step, blocked reason, next action, owner, deadline and exceptions (§107) | End-to-end test | ☐ |
| 4.16 | Metrics for jobs, executions and exceptions (§101) | Integration tests | ☐ |
| 4.17 | Threat model updated; CI green; hardening pass recorded | `docs/security/`, CI, this file | ☐ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| Approval records and approval gates (§27) | Phase 7 scope (approval gates) | Phase 7 |
| Executions of AI or integration actions | Need the AI foundation and integrations | Phases 6–8 |
| Verifying execution results beyond the platform's own state (§28) | Needs verification rules | Phase 5 |

## Hardening record

_To be completed at phase close._
