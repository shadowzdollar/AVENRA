# Phase 1: Foundation

**Status:** Complete (2026-10-13)
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
| 1.2 | `make setup` from a clean clone installs everything; `make dev` starts all apps and infrastructure | Copy of exactly the 148 committed files (no `.env`, no `node_modules`): `make setup && make check` exit 0 (contract, API 11 unit + 37 IT, web, AI). `make dev`: API, web and AI all answering after 23 s; one SIGINT stopped all three and freed every port | ☑ |
| 1.3 | No secrets in the repo; `.env.example` with placeholders only; secret scanning in CI | gitleaks 8.30.1 over all commits: no leaks after two reviewed test values were suppressed by exact fingerprint (`.gitleaksignore`); `.env` ignored, `.env.example` placeholders only; `.dockerignore` keeps `.env` out of images; CI `secrets` job scans full history. CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green (secret scanning job) | ☑ |
| 1.4 | Backend builds on Java 25; Maven Enforcer pins Java and Maven versions | Local: JDK 21 and system Maven 3.9.12 both rejected by Enforcer. CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green (API job on JDK 25 with the enforcer) | ☑ |
| 1.5 | Module boundary rules enforced by tests that fail the build on violation | `ModularityTest`, `ArchitectureTest`; `ArchitectureRulesSelfTest` proves each rule fails on broken fixtures | ☑ |
| 1.6 | Flyway migrations run on startup in local and in tests; app connects with a non-owner role | `DatabaseRolesIT` (7 tests: non-privileged role, schema changes denied with SQLSTATE 42501, history table hidden, UTC); `make api-run` applied V1 to local DB | ☑ |
| 1.7 | Integration tests run against real PostgreSQL via Testcontainers | Local: 8 ITs pass on postgres:18.6 with the real role script. CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green (API job) | ☑ |
| 1.8 | Typed, environment-specific configuration (local/development/staging/production profiles); app fails fast on missing required config | `AvenraProperties` (validated); `StartupFailFastIT`: no profile, missing DB URL and wildcard CORS each stop startup | ☑ |
| 1.9 | Structured JSON logs with request id, trace id; sensitive fields never logged | `StructuredLoggingIT`: every line is ECS JSON in UTC with service name/version, request line carries the request id, DB passwords absent; `TracingIT`: the request log line carries the trace id and span id of the request's trace | ☑ |
| 1.10 | Every response carries a request id; errors use the structured format; no stack traces leak | `PlatformWebIT` (RequestIds, ErrorFormat): 400/401/404/405/413/415/500 all return `{code,message,requestId}`; the 500 body omits the exception message | ☑ |
| 1.11 | Liveness and readiness are separate; readiness reflects the database | `PlatformWebIT` (Health); `ReadinessWithoutDatabaseIT`: DB unreachable → liveness 200, readiness 503 | ☑ |
| 1.12 | Secure headers, CORS policy, request size limits configured | `PlatformWebIT` (Security, RequestSizeLimits): headers asserted; CORS allowed vs denied origin; 413 for declared and streamed oversize bodies; unknown paths 401 (ADR-011) | ☑ |
| 1.13 | OpenAPI contract linted; Java interfaces and TS client generated; drift fails the build | `make contract-check`; lint-rule self-test; renaming the operation in the contract broke both the Java compile and the TS type check, restoring fixed both; `ContractConformanceIT` (5 tests). CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green (contract job; oasdiff breaking-change job) | ☑ |
| 1.14 | Web: strict TS, no `any`, lint clean, design tokens from §144, unit tests, builds | `make web-check`: ESLint 0 warnings, strict tsc, 16 tests (token values checked against §144); build fails without API URL; production build in headless Chrome shows a live API connection with 0 CSP violations and nonce on every script. CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green (web job incl. production build) | ☑ |
| 1.15 | AI service: typed, linted, tested, health endpoint | `make ai-check`: ruff (incl. security rules), mypy --strict, 16 tests (request ids, error format without internals, JSON logs, no query strings or client-library URLs in logs, config fail-fast); `make ai-run` serves on 127.0.0.1 only. CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green (AI service job) | ☑ |
| 1.16 | Traces visible end to end (HTTP → app → DB) locally; telemetry names follow §101 | `TracingIT`: one trace from HTTP span to SQL span, `avenra.request_id` on the span, inbound `traceparent` continued; real requests to the local API appear in Jaeger (`make infra-up`, http://127.0.0.1:16686) with request ids, DB connection spans and service/version/environment attributes; naming documented in `apps/api/README.md` | ☑ |
| 1.17 | Dockerfiles: non-root, minimal base, pinned, health checks; images build in CI | All three images build in CI and pass `scripts/smoke-test-images.sh` (non-root uid, refuse to start without config, healthy, serve requests, CSP nonce) and an OSV image scan with no known vulnerabilities after OS updates and the AI image's move to Alpine. CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green | ☑ |
| 1.18 | CI runs on every PR: lint, type checks, unit, integration, dependency scan, secret scan, static analysis, build | `.github/workflows/ci.yml`, 10 jobs, actions pinned by SHA; CI run [38388682269](https://github.com/shadowzdollar/AVENRA/actions/runs/38388682269) green. First runs found and fixed 10 real library vulnerabilities, OS package vulnerabilities, a health-check port bug and three CI tool misconfigurations | ☑ |
| 1.19 | Docs: README, CONTRIBUTING, SECURITY, ARCHITECTURE overview, CLAUDE.md | All five present and current (`make dev`/`make check`, CI, supply-chain rules); per-app READMEs for api, web, ai and contracts | ☑ |
| 1.20 | Hardening pass done against all Phase 1 Guidelines sections; result recorded below | Hardening record below | ☑ |

Legend: ☑ proven · ◐ proven locally, CI evidence pending · ☐ not started

## Declared deferrals

| Item | Why it can't close in Phase 1 | Closes in |
|---|---|---|
| Shared development, staging, production environments | Needs a cloud provider and accounts (not yet chosen). Phase 1 delivers the configuration profiles and container images they will use. | Decision before Phase 13; provisioning in Phase 13 |
| Terraform infrastructure | Depends on the cloud provider decision | Phase 13 |
| Production secret manager | Depends on the cloud provider decision | Phase 13 |
| HSTS and forwarded-header handling behind a TLS-terminating proxy | HSTS is only sent over HTTPS; there is no TLS locally. Configured now, verified against the real proxy | Phase 13 |
| Service-to-service authentication between API and AI service | No AI endpoints exist yet; the service binds to 127.0.0.1 only | Phase 6 (with the first AI capability) |
| Metrics backend and dashboards; OTLP log export | Metrics are collected but need a backend to be useful; logs go to stdout for the platform's log collector | Phase 13 (monitoring and alerting) |
| Tracing in the AI service | No AI calls exist yet; the API → AI hop is traced when the first call is added | Phase 6 |
| Rate limiting (§67, §71) | The contract declares `x-avenra-rate-limit` per operation, but nothing enforces it yet. The first endpoints that need limits (sign-in, password reset, invitations) arrive with authentication | Phase 2 |
| GitHub branch protection on `main` | Must be enabled by the repository owner in GitHub settings | Owner action during Phase 1 |

## Hardening record

Each Phase 1 section of the Guidelines was re-read and checked against the
code on 2026-10-13. Findings and their resolution:

| Section | Rule | Result |
|---|---|---|
| §3, §12, §14 | Modular monolith, explicit module boundaries | Met. Enforced by `ModularityTest` and ArchUnit rules; self-tests prove the rules fail on violations. Worker processes (ADR-001) arrive with the job engine in Phase 4 |
| §4–§6 | Stack: Next.js/TS, Spring Boot, Python AI service owning no data | Met (ADR-006, ADR-012) |
| §7, §38–§40 | PostgreSQL, Flyway only, immutable migrations, UTC | Met. Owner/runtime role split proven by `DatabaseRolesIT`; sessions pinned to UTC |
| §8–§10 | Redis not a source of truth; S3-compatible storage | Met for Phase 1 (infrastructure running; first use in later phases) |
| §11 | Layered modules, domain independent | Met (ArchUnit layering rules) |
| §13 | Repository structure | Partly, by intent: `packages/ui`, `packages/config`, `packages/shared-types`, `tests/*` and `infrastructure/terraform` are created when their first real content exists (§99: nothing speculative). `packages/contracts` provides the shared API types |
| §31–§34 | REST under `/api/v1`, DTOs, structured errors with request id | Met. Contract-first (ADR-008); conformance tested |
| §60–§62, §101 | OpenTelemetry, structured logs, no secrets, naming | Met. `TracingIT`, `StructuredLoggingIT`; client-library URL logging suppressed in the AI service |
| §64 | Validation at every trust boundary | Met for existing boundaries (config, HTTP bodies, inbound request ids) |
| §67, §71 | Rate limiting | **Gap.** Declared in the contract, not enforced. Deferred to Phase 2 (see deferrals) |
| §68, §91 | Secrets and configuration | Met. `.env` ignored and excluded from images; validated config fails fast; production secret manager deferred to Phase 13 |
| §71–§72 | API and frontend security | Met: deny by default, headers, CORS, CSRF stance recorded (ADR-011), size limits, nonce CSP |
| §81–§84 | Coding standards | Met and enforced: javac warnings as errors, palantir format, ESLint zero warnings, no `any`, ruff + mypy --strict |
| §86–§88 | Git and PR rules | Met after one correction: an automatic commit with a non-conforming message (`Update: apps,...`) was rewritten as a Conventional Commit before the first push (tree verified identical) |
| §89 | ADRs | Met (ADR-001 to ADR-012) |
| §90 | Environments | Profiles for all four; shared environments deferred to Phase 13 |
| §92 | CI | Pipeline written, actionlint clean; evidence = first green run (1.18) |
| §93–§94 | Containers, health checks | AI image built and smoke-tested; API and web images verified in CI (1.17) |
| §99 | Justified dependencies | Met. Every non-Boot dependency has a stated reason; 7-day release age enforced in pnpm, uv, Docker tags, actions and Dependabot |
| §100 | Documentation | Met: root docs, per-app READMEs, ADRs, this file |

Process findings:

- The network on the development machine was often slow (down to 1 KB/s)
  and IPv6 is broken. Maven timeouts and retries are configured in
  `apps/api/.mvn/maven.config`, which also protects CI.
- Several defects were caught by the checks before commit rather than after:
  an empty OTLP endpoint crashing startup, a statically rendered page that
  could not carry the CSP nonce, a request log written outside the trace,
  HTTP client libraries logging full URLs, and a self-test that passed
  vacuously.
