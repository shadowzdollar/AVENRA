# Phase 4: Work execution

**Status:** Complete (2026-10-14)
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
| 4.2 | Jobs are enqueued in the same transaction as the change that causes them | `JobEngineIT.aJobExistsOnlyIfItsTransactionCommits`, `…aJobsDatabaseEffectsCommitOnlyWithItsCompletion` | ☑ |
| 4.3 | Jobs survive a crash: an expired lease is reclaimed and the job runs once more | `JobEngineIT.aCrashedWorkersJobIsReclaimedAfterItsLease`, `…aWorkerCannotFinishAJobAnotherWorkerNowHolds` (mutation-checked) | ☑ |
| 4.4 | Concurrent workers never run the same job at the same time | `JobEngineIT.concurrentWorkersNeverClaimTheSameJob` (4 workers, 40 jobs, no duplicates) | ☑ |
| 4.5 | Retry classes (§103): retryable with backoff, non-retryable stops, human-required raises an exception; exhausted retries dead-letter | `JobEngineIT.retryableFailuresBackOffAndThenDeadLetter`, `…permanentAndHumanFailuresStopAtOnce`, `…unexpectedErrors…`, `…backoffGrowsExponentially…`; `StoppedJobs` raises exceptions (`AutomationIT.undeliverableEmail…`) | ☑ |
| 4.6 | Schedules are persisted and fire once per slot across instances and restarts | `JobEngineIT.aSchedulesSlotFiresOnceAcrossInstances` (3 concurrent firings, re-registration keeps the slot); `ReadinessWithoutDatabaseIT` (registration retries) | ☑ |
| 4.7 | Email is durable: delivery failures retry; payloads are encrypted at rest and removed after delivery | `JobEngineIT.emailIsEncryptedAtRestRetriedWhenTransientAndErasedAfterDelivery`, `…permanentEmailFailuresAreNotRetried`; all Phase 2–3 email flows pass through the queue | ☑ |
| 4.8 | Executions follow their state machine; every automated action is recorded with actor, input, result and error | `ExecutionStatusTest` (every pair against ADR-023), `AutomationIT` (executions for advances and reminders with actor, input, result) | ☑ |
| 4.9 | Work moves between waiting for information and running automatically, recorded as system transitions | `AutomationIT.workWaitsForTheClient…`, `…answersCreateReviewTasks…` (rules `information.requested`, `.received`, `.rejected`) | ☑ |
| 4.10 | Reminders follow the schedule, stop when answered, revoked or expired, and are never sent twice for a slot | `AutomationIT.remindersFollowTheSchedule…`, `…remindersStopAtTheMaximumAndForRevokedLinks` | ☑ |
| 4.11 | Exceptions have a controlled lifecycle, are raised by the listed events, and are tenant-isolated | `ExceptionStatusTest`, `AutomationIT.anExpiredIncomplete…`, `…overdueWork…`, `…undeliverableEmail…`; `WorkRowLevelSecurityIT` includes `work_exceptions` | ☑ |
| 4.12 | Human tasks say what is needed, why, by when, and with which choices; closed by the action they ask for | `AutomationIT.answersCreateReviewTasksThatTheReviewCloses` (action, reason, deadline, choices, about; `TASK_SYSTEM_MANAGED`) | ☑ |
| 4.13 | Stored documents are rescanned; newly detected malware is quarantined, audited and raises an exception | `AutomationIT.aRescanFindsMalwareInAStoredFileAndQuarantinesIt` (EICAR, quarantine key, original removed, `MALWARE_FOUND`, audit) | ☑ |
| 4.14 | New tables have row-level security; job claims bypass it only through the narrow functions | `WorkRowLevelSecurityIT` (executions, exceptions; quarantine trigger), `JobEngineIT.jobsCanOnlyBeCreated…`; mutation check: 3 of 3 broken guards caught | ☑ |
| 4.15 | The web shows status, progress, current step, blocked reason, next action, owner, deadline and exceptions (§107) | `e2e/work.spec.ts` (waiting/running by rules, next action, review tasks, automated actions), `exception-row.test.tsx` | ☑ |
| 4.16 | Metrics for jobs, executions and exceptions (§101) | `JobEngineIT` (`avenra.job.succeeded`), `AutomationIT` (`avenra.execution.completed`, `avenra.exception.raised`), `DocumentsIT` (scanner gauge) | ☑ |
| 4.17 | Threat model updated; CI green; hardening pass recorded | [threat-model-execution.md](../security/threat-model-execution.md) (14 threats); CI run 38545372455 on PR #21: all 10 jobs green (56 unit + 125 integration tests, both browser journeys against the built images, clean image scans); hardening record below | ☑ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| Approval records and approval gates (§27) | Phase 7 scope (approval gates) | Phase 7 |
| Executions of AI or integration actions | Need the AI foundation and integrations | Phases 6–8 |
| Verifying execution results beyond the platform's own state (§28) | Needs verification rules | Phase 5 |

## Hardening record

Phase 4 Guidelines sections re-read and checked against the code on
2026-10-14.

| Section | Rule | Result |
|---|---|---|
| §9 | Asynchronous work outside HTTP requests; no broker without need | Met. PostgreSQL job engine (ADR-022); email, follow-ups, transitions and rescans are jobs |
| §26 | Exceptions as business states with a lifecycle | Met. Six types, severity, source, assignee, resolution; lifecycle enforced (ADR-024) |
| §28 | Executions recorded; success is not "the call returned" | Met. Actor, action, target, input, result, error; `VERIFIED` only after the platform checked the resulting state |
| §29 | Controlled execution state machine | Met. Exact table in ADR-023, checked on every move |
| §30 | Idempotent side effects | Met. Keys on jobs, executions, reminders, exceptions; completion in the handler's transaction |
| §100 | Subsystem documentation | Met. [job-engine.md](../subsystems/job-engine.md) |
| §101 | Telemetry naming | Met. `avenra.job.*`, `avenra.execution.*`, `avenra.exception.raised`, `avenra.malware_scanner.available` |
| §102–§103 | Timeouts, backoff, dead letter; retry classes | Met. Retryable, non-retryable, human-required; capped exponential backoff with jitter; `DEAD` |
| §104 | Long-running workflows survive restarts | Met. Persisted state, leases, reclaim; startup without database |
| §105 | Persisted schedules | Met. `job_schedules`, once per slot |
| §106 | Human tasks say exactly what is needed | Met. Required action, reason, deadline, choices, reference |
| §107 | Execution state visible without logs | Met. Progress (step, next action, blocked reason), owner, deadline, exceptions, automated actions |

Findings fixed during the phase, before merge:

- `NOT (false OR NULL)` let `jobs_enqueue` accept another organization; the
  check now uses `coalesce` (found by `JobEngineIT`).
- `ON CONFLICT` needs the new row to be readable, so enqueueing through row-level
  security failed for platform jobs; enqueueing moved into a checked function
  and direct inserts were revoked, instead of widening read access.
- Rescans needed `UPDATE` on `storage_key`; a trigger now allows only the move
  to the version's own quarantine key and never back.
- Rescans deleted the original before commit; the delete now runs after
  commit.
- The API could not start without a database because schedules were
  registered at startup; registration now retries in the scheduler loop.
- Finishing a job whose lease another worker holds was untested (a mutation
  went unnoticed); now covered.
- Tests assumed they were alone in the shared database; they now check their
  own rows.
