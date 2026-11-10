# Avenra

**From Intent to Completed Work.**

Avenra is a business work execution platform. It turns fragmented business
information, requests and processes into verified completed work.

- Product definition: [`AVENRA_MASTER_PROJECT.md`](AVENRA_MASTER_PROJECT.md)
- Engineering authority: [`AVENRA_BUILDING_GUIDELINES.md`](AVENRA_BUILDING_GUIDELINES.md)
- Architecture overview: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Decisions: [`docs/adr/`](docs/adr/)
- Build phases and their status: [`docs/phases/`](docs/phases/)

## Repository layout

```text
apps/
  api/            Java 25 + Spring Boot backend (system of record)
  web/            Next.js web client
  ai/             Python AI service (no business data ownership)
packages/
  contracts/      OpenAPI contracts (source of truth for the API)
infrastructure/
  docker/         Local development infrastructure
docs/             Architecture, ADRs, phases, security, API guidelines
```

Applications are added during Phase 1; see the
[Phase 1 checklist](docs/phases/phase-01-foundation.md) for what exists today.

## Prerequisites

| Tool | Version |
|---|---|
| JDK | 25 |
| Node.js | 24 |
| pnpm | 12.4 |
| Python / uv | 3.14 / uv 0.12 |
| Docker | with Compose v2 |
| GNU Make | any recent |

## Getting started

```bash
make setup      # creates .env from .env.example and installs JS dependencies
make dev        # infrastructure + API (:8080) + web (:3000) + AI service (:8090); Ctrl-C stops the apps
make check      # every code check CI runs: contract, API, web, AI service
make help       # lists every command
```

Locally, no email leaves your machine: sign-up confirmations, invitations and
client requests all land in the local mail catcher at http://127.0.0.1:18025.
With the apps running, `make demo-data` creates a demo account (its email and
password are printed) with clients and work in several states.

Individual pieces: `make infra-up`, `make api-run`, `make web-dev`,
`make ai-run`. Container images: `make images-build` then `make images-test`
(needs Docker buildx).

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on `main`:
contract lint and breaking-change check, API (unit + integration tests on
real PostgreSQL), web (lint, type check, tests, build), AI service, secret
scanning over the full history, dependency vulnerabilities, static analysis
(Semgrep), shell scripts, and container images (build, smoke tests,
vulnerability scan). Actions are pinned to commit SHAs; Dependabot keeps
every pinned version current with a 7-day cooldown.

```bash
```

Local services bind to `127.0.0.1` only, on non-default ports (PostgreSQL
15432, Redis 16379, S3 18333) to avoid clashing with locally installed
services. Traces from the local API appear in Jaeger at http://127.0.0.1:16686.
