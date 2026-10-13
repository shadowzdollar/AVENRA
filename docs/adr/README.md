# Architecture Decision Records

Important architecture choices are recorded here (Building Guidelines §89).
An ADR is never edited to change its decision after it is accepted; a new ADR
supersedes it.

## Format

Each ADR contains: **Status**, **Context**, **Decision**, **Alternatives**,
**Consequences**.

Statuses: `Proposed` → `Accepted` → (`Superseded by ADR-NNN` | `Deprecated`).

## Index

| ADR | Title | Status |
|---|---|---|
| [001](ADR-001-modular-monolith.md) | Modular monolith with asynchronous workers | Accepted |
| [002](ADR-002-postgresql.md) | PostgreSQL as the system of record | Accepted |
| [003](ADR-003-ai-provider-abstraction.md) | AI provider abstraction | Accepted |
| [004](ADR-004-central-agent-orchestrator.md) | Central agent orchestrator with a tool gateway | Accepted |
| [005](ADR-005-multi-tenant-model.md) | Multi-tenant model | Accepted |
| [006](ADR-006-java-spring-boot-maven.md) | Java 25, Spring Boot 4.1, Maven | Accepted |
| [007](ADR-007-postgresql-durable-jobs.md) | PostgreSQL-backed durable jobs | Accepted |
| [008](ADR-008-contract-first-openapi.md) | Contract-first OpenAPI | Accepted |
| [009](ADR-009-monorepo-tooling.md) | Monorepo tooling | Accepted |
| [010](ADR-010-trunk-based-branching.md) | Trunk-based branching | Accepted |
| [011](ADR-011-web-security-baseline.md) | Web security baseline before authentication | Accepted |
| [012](ADR-012-typescript-5.md) | TypeScript 5.9 for the JavaScript workspace | Accepted |
