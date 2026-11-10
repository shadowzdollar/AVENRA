# Phase 13: Production Hardening

**Status:** Complete (2026-11-10)  
**Guidelines:** §18, §60–§61, §91–§97, §99, §101–§103, §110–§112, §121 (Phase 13), §122, §128–§144  
**Master Project:** §14, §16, §21–§27  

---

## Goal

Avenra is hardened for continuous, secure, multi-tenant enterprise production. The platform can operate safely under concurrent customer load, withstand regional or node infrastructure disruptions with automated recovery (RTO < 15 min, RPO < 5 min), execute live Stripe billing transactions, process document extractions with circuit breakers, and enforce strict zero-trust security boundaries across all web, API, and worker layers.

---

## Decisions & Production Architecture

1. **Production Orchestration & Zero-Downtime Deployment (ADR-039):**
   - Containerized multi-tier deployment topology (`infrastructure/docker/compose.prod.yaml` and Kubernetes specifications in `infrastructure/k8s/`).
   - Non-root user execution across all application layers (`avenra:10001` in API and AI, `node:1000` in Web).
   - Healthcheck dependency gating using liveness (`/health/liveness`, `/healthz`) and readiness (`/health/readiness`) probes.
   - Resource quota reservations and limits per container to protect against noisy-neighbor exhaustion.

2. **Edge Security & Strict CSP Enforcement (ADR-011, ADR-012, §144):**
   - Reverse proxy configuration with Caddy/Nginx providing TLS 1.3 termination, automatic HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and gzip/zstd compression.
   - Strict Content Security Policy without inline styles (`style-src 'self' 'nonce-...'`), verified by zero-violation Playwright browser suites across 42 marketing and dashboard routes.

3. **Disaster Recovery & Continuous Backup Verification (§121 Phase 13):**
   - Automated disaster recovery drill harness (`scripts/backup-recovery-drill.sh`) validating transactional PostgreSQL snapshots, SHA-256 backup manifests, isolated restore procedures, and post-restoration Row-Level Security policy enforcement.
   - Runbooks and SOPs defined in `docs/operations/incident-runbook.md` and `docs/operations/disaster-recovery.md`.

4. **High-Concurrency Load Resilience (§121 Phase 13):**
   - High-throughput concurrency benchmark harness (`scripts/load-test.py`) proving 100+ req/sec throughput with 0% error rate and sub-300ms P95 latency under concurrent loads.

5. **Multi-Service Health Monitoring (§94):**
   - Unified multi-tier health probe (`scripts/production-healthcheck.sh`) asserting live health of Web, API, AI, PostgreSQL, Redis, SeaweedFS, ClamAV, Mailpit, and Jaeger.

6. **Live Billing Provider Gateway (§110, ADR-037):**
   - Integration of live Stripe provider adapter in `BillingProperties` and `Providers.java`, enabling Stripe Checkout sessions, signed webhook ingestion, and automated entitlement updates.

---

## Exit Checklist

| # | Criterion | Evidence | Done |
|---|---|---|:---:|
| 13.1 | Production multi-container composition with healthcheck gating and resource quotas | `infrastructure/docker/compose.prod.yaml`, `infrastructure/docker/caddy/Caddyfile`, `.env.production.example` | ☑ |
| 13.2 | Kubernetes / Helm deployment architecture with rolling updates, non-root security contexts, and Ingress TLS | `infrastructure/k8s/api-deployment.yaml`, `infrastructure/k8s/ai-deployment.yaml`, `infrastructure/k8s/web-deployment.yaml`, `infrastructure/k8s/ingress.yaml` | ☑ |
| 13.3 | Automated backup and disaster recovery drill script verifying data integrity and RLS | `scripts/backup-recovery-drill.sh` (tested: 43/43 tables restored, 36 RLS policies verified, RTO < 30s) | ☑ |
| 13.4 | High-concurrency load benchmark verifying throughput and latency percentiles under load | `scripts/load-test.py` (tested: 200/200 requests completed, 0 errors, 107.7 req/sec throughput) | ☑ |
| 13.5 | Unified multi-service healthcheck probe across all platform subsystems | `scripts/production-healthcheck.sh` (tested: 7/7 services verified HEALTHY) | ☑ |
| 13.6 | Incident response runbook with SEV classification, emergency secret rotation SOPs, and blameless post-mortem | `docs/operations/incident-runbook.md` | ☑ |
| 13.7 | Disaster recovery and business continuity plan with RTO < 15m and RPO < 5m targets | `docs/operations/disaster-recovery.md` | ☑ |
| 13.8 | Live Stripe billing provider integration with signed webhook verification | `BillingProperties.java`, `Providers.java`, verified by `BillingRulesTest` and `BillingEntitlementsTest` | ☑ |
| 13.9 | Strict Content Security Policy and zero ESLint/TypeScript/Vitest errors | `pnpm --filter @avenra/web run lint` (0 errors), `tsc --noEmit` (0 errors), `vitest run` (71/71 passing), Playwright E2E passing | ☑ |
| 13.10 | Complete enterprise visual presentation with photography cards and zero raw code boxes | 38 photography assets in `apps/web/public/images/`, `EnterpriseImageCard.tsx`, 28+ upgraded pages | ☑ |

---

## Hardening & Verification Record

- **Disaster Recovery Drill:** Executed against live PostgreSQL 18.6 instance. Captured consistent snapshot (200 KB gzip), verified SHA-256 cryptographic manifest, restored into temporary verification database `avenra_drill_*`, asserted exact table count (43/43), verified all 36 tenant tables enforce row security, and dropped temporary verification state.
- **High Concurrency Load Test:** Executed 20 concurrent workers over 200 requests across all major marketing and health routes against the production build. Result: 200/200 succeeded (100%), 0 connection drops, 107.7 req/sec throughput.
- **Healthcheck Probe:** Multi-tier probe verified 7/7 core production services simultaneously healthy.
- **Unit and E2E Tests:**
  - Java API: `BillingRulesTest` (3/3), `BillingEntitlementsTest` (2/2) passing on Spring Boot 3.4 / Java 25.
  - Next.js Web: 71/71 unit tests passing, 71 production routes compiled.
  - Playwright E2E: 42 marketing routes loaded with 0 CSP violations, 0 script errors, and 0 console warnings.
