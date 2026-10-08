# ADR-001: Modular monolith with asynchronous workers

**Status:** Accepted

## Context

Avenra has many domains (identity, work, information, verification,
execution, approvals, integrations, notifications, audit, billing, AI). The
team is small and the domain boundaries are still being learned.
Microservices would add distributed failure, deployment and observability
overhead, and cross-service consistency problems before there is any scaling
or ownership reason for them (Guidelines §3, §126).

## Decision

- One Spring Boot backend (`apps/api`) containing all business modules as
  internal domain boundaries (Guidelines §12).
- Background work runs in worker processes built from the **same codebase**,
  started with a different runtime profile, so API and workers can be scaled
  and deployed independently without a second codebase.
- The Python AI service (`apps/ai`) is a separate process because it has a
  different runtime (Guidelines §6, §126 "different runtime requirements"). It
  owns no business data.
- Module boundaries are enforced in code: each module exposes an explicit
  public API package; other modules may not use its internals (Guidelines §14).
  Boundaries are verified automatically by tests that fail the build on a
  violation.

## Alternatives

- **Microservices from day one** — rejected: no scaling or ownership reason
  yet ("microservice theater", §125).
- **Unstructured monolith** — rejected: makes future extraction a rewrite and
  lets modules couple freely.

## Consequences

- Simple local development, one database, ordinary transactions.
- Discipline is required to keep modules decoupled; the automated boundary
  tests are what make this real rather than aspirational.
- Extraction candidates (§127) can later be split out along existing module
  APIs.
