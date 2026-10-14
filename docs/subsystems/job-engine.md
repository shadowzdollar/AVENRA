# Job engine

Durable background jobs and schedules on PostgreSQL (ADR-007, ADR-022). Code:
`apps/api/.../platform/jobs`; schema and functions: `V5__execution.sql`.

## Purpose and responsibilities

- Run work outside HTTP requests (Guidelines §9): email, reminders, automatic
  work transitions, expiry and overdue checks, document rescans.
- Survive restarts, crashes and deployments (§104); persist schedules (§105).
- Classify failures and retry only what can succeed later (§102–§103).

## Inputs and outputs

- **In:** `JobQueue.enqueue(type, organization, payload, idempotency key,
  delay, max attempts)` inside the transaction of the change that causes the
  job; `JobSchedule` beans (name, job type, interval).
- **Out:** each job runs its `JobHandler` once per attempt; final failures
  publish `JobEvents.JobStopped`, which the work module turns into exceptions.

## How it works

1. `jobs_enqueue` inserts the job if the organization matches the transaction
   (request, request link, or none for platform jobs).
2. The poller calls `jobs_claim` (`FOR UPDATE SKIP LOCKED`, lease, attempt
   counted). A commit that enqueued a job wakes the local poller at once.
3. The handler runs in a transaction scoped to the job's organization with no
   user; `jobs_succeed` runs in the same transaction, so database effects and
   completion commit together.
4. On failure the handler's transaction rolls back and the job is retried
   (`jobs_retry`, capped exponential backoff with jitter), stopped
   (`jobs_fail` → `FAILED`), or dead-lettered (`DEAD`) after its last attempt.
5. The scheduler registers schedules, then calls `schedules_fire` every
   `avenra.jobs.schedule-interval`; each slot enqueues one job, keyed by slot.

## Dependencies

PostgreSQL only. Email jobs use the SMTP sender; rescans use storage and
ClamAV.

## Security

- The runtime role cannot insert, update or delete `jobs` directly; it reads
  only its organization's jobs. Claims, completion and sweeps are `SECURITY
  DEFINER` functions with a fixed `search_path`, executable only by the runtime
  role; finishing requires holding the lease (mutation-checked).
- Sensitive payloads (email) are encrypted with the application key and erased
  when the job finishes. Unexpected errors record only their type, never their
  message.
- Sweeps cross tenants only to enqueue per-tenant jobs; they return counts, not
  data.

## Failure modes

| Failure | Behaviour |
|---|---|
| Worker crashes mid-job | Lease expires (default 5 min); another worker runs the job again. Handlers with effects outside the database must be idempotent (email may be sent twice rather than lost). |
| Database unreachable | Polling and scheduling log and retry; the application still starts (alive, not ready). |
| Handler throws unexpectedly | Treated as retryable; dead-lettered after the last attempt, raising a `JOB_FAILED` exception for tenant jobs. |
| Two instances fire one schedule | `SKIP LOCKED` plus the slot key: one job per slot. |
| Clock skew between instances | Run times use the database clock (`now()`). |

## Operations

- Settings: `avenra.jobs.*` (worker on/off per instance, poll interval,
  concurrency, lease, retry base and cap, schedule interval).
- Metrics: `avenra.job.enqueued|succeeded|retried|failed|dead` by type,
  `avenra.job.duration`, `avenra.job.depth` by status. Alert on growing
  `QUEUED` depth and on any `DEAD`.
- A dead job can be inspected in `jobs` (status, attempts, last error class and
  message). Re-running is a deliberate action: enqueue a new job; dead jobs are
  never resurrected automatically.
