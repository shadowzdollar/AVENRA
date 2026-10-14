# ADR-022: In-house job engine on PostgreSQL

**Status:** Accepted (closes the engine choice left open in ADR-007)

## Context

ADR-007 put durable jobs in PostgreSQL and left the engine open. Every
tenant-owned table is protected by row-level security (ADR-005), and a worker
must claim jobs of every tenant without a user or organization in scope.

Candidates checked:

- **db-scheduler** (Apache-2.0): one table keyed by task name and instance,
  payloads serialized by the library, no tenant column; it would need its own
  RLS bypass for the whole table.
- **JobRunr** (LGPL core, commercial Pro): its own schema and dashboard, several
  features (batches, rate limiting of jobs) in Pro only; same RLS problem.
- **In-house**: one table, a worker loop, a handful of database functions.

## Decision

Build a small engine in the `platform.jobs` package:

- **Table `jobs`:** id, `organization_id` (null for platform jobs), type,
  payload (JSON; sensitive payloads encrypted, ADR-025), status (`QUEUED`,
  `RUNNING`, `SUCCEEDED`, `FAILED`, `DEAD`, `CANCELLED`), attempts, max
  attempts, run-at time, lease owner and expiry, last error class and a
  sanitized message, idempotency key (unique per type), trace parent, times.
- **Enqueue in the same transaction** as the business change, under the
  caller's row-level security (a job can only be created for the current
  organization).
- **Claim, finish, retry and fail only through `SECURITY DEFINER` functions**
  owned by the schema owner (`jobs_claim`, `jobs_succeed`, `jobs_retry`,
  `jobs_fail`). They are the only path around row-level security; each checks
  the lease, so a worker can only finish what it holds. The runtime role cannot
  read or update other tenants' jobs directly.
- **Claiming** uses `FOR UPDATE SKIP LOCKED` with a lease (default 5 minutes).
  An expired lease is claimable again, so a crashed worker's job runs again;
  handlers must therefore be idempotent (§30).
- **Handlers** run in a tenant transaction for the job's organization with a
  system actor; their outcome is one of: done; **retryable** failure (backoff
  `base × 2^attempt` with jitter, capped); **non-retryable** failure (stops,
  `FAILED`); **human-required** (stops and raises an exception, ADR-024).
  Exhausting the attempts moves a job to `DEAD` (dead letter) and raises an
  exception for tenant jobs.
- **Schedules** (`job_schedules`): name, interval, next run. A scheduler claims
  due schedules with `SKIP LOCKED`, enqueues one job per slot with the slot as
  idempotency key, and advances the next run, so a slot fires once across
  instances and restarts.
- **Wake-up:** after a commit that enqueued jobs, the local worker polls at
  once; otherwise it polls every second (configurable). No in-memory timers
  hold business state.
- **Metrics:** `avenra.job.enqueued`, `avenra.job.succeeded`,
  `avenra.job.failed`, `avenra.job.dead`, `avenra.job.duration`, queue depth
  by status.

## Alternatives

- **db-scheduler / JobRunr** — rejected for the reasons above; revisit if the
  in-house engine grows beyond its scope.

## Consequences

- No new dependency; the engine is small and tested like business code.
- Throughput is bounded by PostgreSQL polling; queue depth and duration metrics
  tell when that becomes a problem (ADR-007).
