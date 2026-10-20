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
| [013](ADR-013-same-origin-server-sessions.md) | Same-origin access and server-side sessions | Accepted |
| [014](ADR-014-password-storage.md) | Password storage and password rules | Accepted |
| [015](ADR-015-transactional-email.md) | Transactional email in Phase 2 | Accepted |
| [016](ADR-016-rate-limiting.md) | Rate limiting | Accepted |
| [017](ADR-017-totp-mfa.md) | Optional TOTP multi-factor authentication | Accepted |
| [018](ADR-018-work-model.md) | Work model and lifecycle | Accepted |
| [019](ADR-019-document-storage.md) | Document storage and access | Accepted |
| [020](ADR-020-client-request-links.md) | Client request links | Accepted |
| [021](ADR-021-malware-scanning.md) | Malware scanning of uploads | Accepted |
| [022](ADR-022-job-engine.md) | In-house job engine on PostgreSQL | Accepted |
| [023](ADR-023-executions-and-automation.md) | Execution records and automatic work transitions | Accepted |
| [024](ADR-024-exceptions-and-human-tasks.md) | Exceptions and human tasks | Accepted |
| [025](ADR-025-durable-email-and-reminders.md) | Durable email and client reminders | Accepted |
| [026](ADR-026-information-and-verification-modules.md) | Information and verification modules | Accepted |
| [027](ADR-027-verification-model.md) | Verification model | Accepted |
| [028](ADR-028-evidence-and-completion.md) | Evidence and completion | Accepted |
| [029](ADR-029-ai-service-and-providers.md) | AI service and model providers | Accepted |
| [030](ADR-030-ai-opt-in-and-invocation-records.md) | AI processing opt-in and invocation records | Accepted |
| [031](ADR-031-document-reading-and-advisory-checks.md) | Document reading and advisory AI checks | Accepted |
| [032](ADR-032-ai-evaluation.md) | AI evaluation | Accepted |
| [033](ADR-033-agent-runs-and-tool-gateway.md) | Agent runs, the tool gateway and approval gates | Accepted |
| [034](ADR-034-integrations.md) | Integration model, webhooks and storage export | Accepted |
| [035](ADR-035-notifications.md) | Notifications | Accepted |
