# ADR-009: Monorepo tooling

**Status:** Accepted

## Context

The repository holds three applications in three ecosystems (Guidelines
§13): `apps/web` (TypeScript), `apps/api` (Java), `apps/ai` (Python), plus
shared packages. Every tool added must be justified (§99).

## Decision

- **JavaScript/TypeScript:** pnpm workspaces, with the pnpm version pinned in
  the root `package.json` (`packageManager` field) and a committed lockfile.
  No extra task runner (such as Turborepo) until build times justify one.
- **Java:** Maven Wrapper inside `apps/api` (ADR-006).
- **Python:** uv with a committed `uv.lock` and a pinned Python version.
- **Root task entry point:** a `Makefile` with a small set of commands
  (`make setup`, `make dev`, `make test`, `make lint`, `make check`) that call
  each ecosystem's own tools. CI calls the same commands, so local and CI
  behavior match.
- **Local infrastructure:** Docker Compose in `infrastructure/docker` for
  PostgreSQL, Redis and S3-compatible storage. Images are pinned to versions.

## Alternatives

- **Nx / Bazel / Turborepo** — rejected for now: too much build machinery for
  the current size.
- **Poetry / pip-tools** — uv is faster and covers environments, locking and
  Python version management in one tool.

## Consequences

- Each ecosystem uses its native, well-known tooling.
- The Makefile must stay thin: it calls the tools, it doesn't contain build
  logic.
