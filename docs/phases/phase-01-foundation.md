# Phase 1: Foundation

**Status:** In progress
**Guidelines:** §3–§14, §38–§39, §60–§62, §68, §81–§94, §99–§101, §121

## Goal

A repository where all three applications build, run locally against real
infrastructure, pass lint, type checks and tests, and are checked by CI on
every pull request. There is no business functionality yet, but every
cross-cutting rule (configuration, logging, errors, request ids, health,
telemetry, module boundaries, migrations) is in place and tested, so every
later phase builds on it rather than retrofitting it.

## Steps

1. Decisions recorded as ADRs (ADR-001 to ADR-010)
2. Repository skeleton, root tooling (`Makefile`, pnpm workspace, `.editorconfig`), repo docs
3. Local infrastructure: Docker Compose with PostgreSQL, Redis and S3-compatible storage
4. Backend shell (`apps/api`): Spring Boot 4.1, Java 25, module structure, boundary tests
5. Database: Flyway, separate migration/application roles, baseline migration, Testcontainers
6. Cross-cutting backend: typed configuration, structured JSON logging, request/correlation id, structured error format, secure headers, liveness/readiness health
7. API contract package (`packages/contracts`): OpenAPI 3.1, linting, Java and TypeScript generation, first contract (health/meta)
8. Frontend shell (`apps/web`): Next.js, strict TypeScript, Tailwind with the Avenra design tokens (§144), Inter, TanStack Query, generated client
9. AI service shell (`apps/ai`): Python, uv, typed, linted, tested, health endpoint
10. Observability: OpenTelemetry traces/metrics/logs across api → db, with local collector and viewer
11. Containers: non-root, minimal, pinned, health-checked Dockerfiles for api, web, ai
12. CI (GitHub Actions): lint → type checks → unit → integration → security scans (dependencies, secrets, static analysis) → build
13. Hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 1.1 | ADR-001…010 accepted | `docs/adr/` | ☑ |
| 1.2 | `make setup` from a clean clone installs everything; `make dev` starts all apps and infrastructure | Clean-clone run log | ☐ |
| 1.3 | No secrets in the repo; `.env.example` with placeholders only; secret scanning in CI | CI job, `.gitignore` | ☐ |
| 1.4 | Backend builds on Java 25; Maven Enforcer pins Java and Maven versions | CI log | ☐ |
| 1.5 | Module boundary rules enforced by tests that fail the build on violation | Failing-then-passing test | ☐ |
| 1.6 | Flyway migrations run on startup in local and in tests; app connects with a non-owner role | Integration test | ☐ |
| 1.7 | Integration tests run against real PostgreSQL via Testcontainers | CI log | ☐ |
| 1.8 | Typed, environment-specific configuration (local/development/staging/production profiles); app fails fast on missing required config | Unit + startup test | ☐ |
| 1.9 | Structured JSON logs with request id, trace id; sensitive fields never logged | Test asserting log output and redaction | ☐ |
| 1.10 | Every response carries a request id; errors use the structured format; no stack traces leak | API tests | ☐ |
| 1.11 | Liveness and readiness are separate; readiness reflects the database | API tests | ☐ |
| 1.12 | Secure headers, CORS policy, request size limits configured | API tests | ☐ |
| 1.13 | OpenAPI contract linted; Java interfaces and TS client generated; drift fails the build | CI log | ☐ |
| 1.14 | Web: strict TS, no `any`, lint clean, design tokens from §144, unit tests, builds | CI log | ☐ |
| 1.15 | AI service: typed, linted, tested, health endpoint | CI log | ☐ |
| 1.16 | Traces visible end to end (HTTP → app → DB) locally; telemetry names follow §101 | Screenshot/trace export | ☐ |
| 1.17 | Dockerfiles: non-root, minimal base, pinned, health checks; images build in CI | CI log | ☐ |
| 1.18 | CI runs on every PR: lint, type checks, unit, integration, dependency scan, secret scan, static analysis, build | Green CI run | ☐ |
| 1.19 | Docs: README, CONTRIBUTING, SECURITY, ARCHITECTURE overview, CLAUDE.md | Files | ☐ |
| 1.20 | Hardening pass done against all Phase 1 Guidelines sections; result recorded below | This file | ☐ |

## Declared deferrals

| Item | Why it can't close in Phase 1 | Closes in |
|---|---|---|
| Shared development, staging, production environments | Needs a cloud provider and accounts (not yet chosen). Phase 1 delivers the configuration profiles and container images they will use. | Decision before Phase 13; provisioning in Phase 13 |
| Terraform infrastructure | Depends on the cloud provider decision | Phase 13 |
| Production secret manager | Depends on the cloud provider decision | Phase 13 |
| GitHub branch protection on `main` | Must be enabled by the repository owner in GitHub settings | Owner action during Phase 1 |

## Hardening record

_To be completed at phase close._
