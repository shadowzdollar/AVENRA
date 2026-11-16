# Avenra architecture overview

The detailed specification is
[`AVENRA_BUILDING_GUIDELINES.md`](AVENRA_BUILDING_GUIDELINES.md). This page
is the short map; decisions are in [`docs/adr/`](docs/adr/).

```text
Browser ── Next.js web (apps/web)
              │  HTTPS, typed client generated from packages/contracts
              ▼
        Spring Boot API (apps/api) ── modular monolith (ADR-001)
              │        identity · organization · work · information ·
              │        verification · execution · approval · audit · ...
              │
              ├── PostgreSQL: system of record, Flyway, RLS (ADR-002, ADR-005)
              │      └── durable jobs and schedules (ADR-007)
              ├── Workers: same codebase, worker profile; claim jobs from PostgreSQL
              ├── Redis: cache, rate limits, short-lived locks only
              ├── S3-compatible storage: documents and evidence
              └── AI service (apps/ai, Python): structured results only,
                     behind the AI provider abstraction (ADR-003)
                     and the tool gateway (ADR-004)
```

## Principles that shape every module

- The backend is the source of truth; the frontend never provides security.
- Tenant boundaries are enforced server-side and again in the database.
- Business state lives in PostgreSQL and survives restarts.
- AI output is untrusted until validated, and it never authorizes an action.
- Every important side effect is idempotent and audited.

See Guidelines §143 for the full list of golden rules.
