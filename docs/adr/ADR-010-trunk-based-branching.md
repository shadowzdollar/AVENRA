# ADR-010: Trunk-based branching

**Status:** Accepted (amends Guidelines §86)

## Context

The Guidelines (§86) describe `main` + `develop` + topic branches and allow a
simplified trunk-based model for a small team.

## Decision

- `main` is the only long-lived branch and must always be releasable.
- Work happens on short-lived branches: `feature/*`, `fix/*`, `chore/*`,
  `security/*`, `docs/*`.
- Changes reach `main` only through pull requests that pass CI (build, tests,
  lint, type checks, security scans).
- Commits use the Conventional Commits style from §87
  (`feat(work): ...`, `fix(auth): ...`).
- Releases are tagged on `main`.

## Alternatives

- **`main` + `develop`** — rejected: an extra integration branch adds
  ceremony without benefit at the current team size.

## Consequences

- Branch protection on `main` (require PR + passing checks) must be enabled
  on GitHub.
- Unfinished features that must merge early hide behind feature flags (§98).
