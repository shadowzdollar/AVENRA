# Contributing to Avenra

## Workflow

1. Work only on the current phase (`docs/phases/`).
2. Branch from `main`: `feature/*`, `fix/*`, `chore/*`, `security/*`, `docs/*`
   (ADR-010).
3. Follow the development sequence (Guidelines §118): domain behavior →
   API contract → data changes → backend → tests → frontend → integrate →
   observe → review.
4. Run `make check` locally; it runs the same code checks as CI.
5. Open a pull request. It merges only when CI is green.

## Commits

Conventional Commits that describe intent (Guidelines §87):

```text
feat(work): add work state transitions
fix(auth): prevent cross-tenant access
test(execution): add retry idempotency coverage
```

## Pull requests

Every substantial PR explains: problem, solution, architectural impact,
security impact, tests, migration requirements, deployment requirements
(Guidelines §88).

## Definition of Done

A change is done when it meets Guidelines §123: clear requirements, defined
API, authorization, verified tenant isolation, validation, business rules,
tests, error handling, audit, observRead before working in this repository.
ability, reviewed security, updated docs,
and working deployment.

## Dependencies

Before adding one, answer the six questions in Guidelines §99 in the PR
description.

## AI coding assistants

Allowed and encouraged, under Guidelines §119–§120 and `CLAUDE.md`. The
engineer remains responsible for generated code.
