# ADR-002: PostgreSQL as the system of record

**Status:** Accepted

## Context

Avenra's business state — work, requirements, evidence, verification,
approvals, executions, audit — must be durable, consistent and queryable.
Losing a cache or a queue must never lose business data (Guidelines §7, §8).

## Decision

- PostgreSQL (current major version, 18 at the time of writing) is the single
  system of record.
- Schema changes are made only through Flyway migrations. Released migrations
  are immutable; destructive migrations require explicit review (§38).
- Conventions: `snake_case` names, UUID primary keys, `timestamptz` stored in
  UTC, foreign keys where ownership exists, intentional indexes (§38, §39).
- Large binaries live in S3-compatible object storage; the database stores
  metadata and references (§10).
- PostgreSQL Row-Level Security is used as a **second** tenant-isolation layer
  (see ADR-005). Application authorization remains mandatory.

## Alternatives

- **Document database** — rejected: weak relational integrity for a domain
  that is heavily relational and audit-sensitive.
- **Multiple databases per module now** — rejected: premature; modules own
  their tables, not separate servers.

## Consequences

- Strong consistency and transactions for business commands.
- Integration tests run against real PostgreSQL via Testcontainers, never an
  in-memory substitute, so SQL and RLS behavior are tested for real.
