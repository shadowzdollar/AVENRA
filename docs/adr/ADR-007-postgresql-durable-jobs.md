# ADR-007: PostgreSQL-backed durable jobs

**Status:** Accepted (job engine implemented in Phase 4)

## Context

Avenra runs many asynchronous operations: reminders, follow-ups, retries,
document processing, AI extraction, integration sync, execution steps
(Guidelines §9). They must survive restarts, crashes and deployments
(§104) and schedules must be persisted (§105). The Guidelines also require
that Redis never be the source of truth (§8).

A Redis queue next to a PostgreSQL business database creates a dual-write
problem: a business change can commit while its job is lost, or a job can run
for a change that rolled back.

## Decision

- Durable jobs and schedules are stored **in PostgreSQL**.
- A job is enqueued **in the same transaction** as the business change that
  causes it, so they commit or roll back together.
- Workers claim jobs with `SELECT ... FOR UPDATE SKIP LOCKED`, with leases so
  jobs held by a crashed worker are reclaimed.
- Every job has: tenant (`organization_id`), type, payload reference, status,
  attempts, next-run time, last error, idempotency key, trace context.
- Retries follow the retryable / non-retryable / human-required classes
  (§103) with exponential backoff and a dead-letter state. Side effects use
  idempotency keys so retries cannot duplicate them (§30).
- Redis remains for caching, rate limiting, short-lived locks and idempotency
  hints only.
- The concrete engine (a maintained library such as db-scheduler or JobRunr,
  or a small in-house table plus worker) is chosen in a Phase 4 ADR after
  checking licence, Spring Boot 4 support and recovery behavior.

## Alternatives

- **Redis-backed queue** — rejected: durability depends on Redis persistence
  and needs an outbox to stay consistent with PostgreSQL.
- **Kafka or RabbitMQ** — rejected for now: no scale requirement justifies it
  (§9).

## Consequences

- One durable store, transactional consistency, simple local development.
- PostgreSQL carries the job load; throughput is monitored (queue depth, job
  duration) and a broker is reconsidered only when metrics justify it.
