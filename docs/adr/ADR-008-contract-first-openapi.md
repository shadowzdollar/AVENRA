# ADR-008: Contract-first OpenAPI

**Status:** Accepted

## Context

The Guidelines require explicit API contracts, DTOs instead of entities,
structured errors, and contract tests to prevent frontend/backend drift
(§32, §76). The development sequence puts "Define API contract" before
"Implement backend" (§118).

## Decision

- The public API is described in **OpenAPI 3.1** files in
  `packages/contracts`, which are the source of truth.
- Java server interfaces and DTOs are **generated** from the contract during
  the backend build; controllers implement the generated interfaces, so code
  that does not match the contract does not compile.
- The TypeScript client types for `apps/web` are generated from the same
  contract.
- The contract is linted in CI. Breaking changes against the last released
  contract fail CI unless the change is a new API version (§33).
- Every operation documents authentication, required permission, error codes,
  idempotency and rate limiting (§32).

## Alternatives

- **Code-first (springdoc)** — rejected: the contract would follow the
  implementation instead of leading it, and drift is caught later.

## Consequences

- Slightly more upfront work per endpoint; in exchange the frontend and
  backend cannot silently disagree.
- Generator versions are pinned; generated code is not committed.

## Amendment (Phase 5, 2026-10-15)

The CI gate compares with `main`, which is stricter than "the last released
contract". Until the first release, an intentional breaking change may be
accepted by listing its oasdiff message in
`packages/contracts/accepted-breaking-changes.txt` with the reason in the
contracts README; the list is reviewed like code. Enums in responses that are
expected to grow (such as exception types) are documented as open: clients
must handle unknown values.

