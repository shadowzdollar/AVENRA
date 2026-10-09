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
make infra-up   # starts PostgreSQL, Redis and S3-compatible storage
make api-run    # backend on :8080
make web-dev    # web app on :3000
make help       # lists every command
```

Local services bind to `127.0.0.1` only, on non-default ports (PostgreSQL
15432, Redis 16379, S3 18333) to avoid clashing with locally installed
services.
