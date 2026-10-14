# Threat model: work execution (Phase 4)

**Scope:** the job engine, durable email, executions, automatic work
transitions, reminders, exceptions, system human tasks and document rescans
(ADR-022 to ADR-025, ADR-021 amendment). Builds on
[threat-model-identity.md](threat-model-identity.md) and
[threat-model-documents-requests.md](threat-model-documents-requests.md).
**Method:** STRIDE per component; each threat names its control and evidence.
Reviewed 2026-10-14.

## Assets

- Queued work and its payloads (email bodies with single-use links)
- Encrypted copies of request-link tokens
- The integrity of automated decisions (who moved the work, and why)
- Availability of background processing

## Trust boundaries

1. Request transactions → `jobs` (enqueue only, for their own organization)
2. Worker → all tenants' jobs (through narrow definer functions only)
3. Job handler → one tenant (transaction scoped to the job's organization)

## Threats and controls

| # | Threat (STRIDE) | Control | Evidence |
|---|---|---|---|
| E1 | **Elevation:** a request enqueues work for another tenant | `jobs_enqueue` refuses any organization but the transaction's (NULL-safe check, mutation-checked); direct inserts revoked | `JobEngineIT.jobsCanOnlyBeCreated…` |
| E2 | **Information disclosure:** one tenant reads another's jobs | Read policy limited to the current organization; no update or delete for the runtime role | `JobEngineIT.jobsCanOnlyBeCreated…` |
| E3 | **Tampering:** a stale worker finishes or rewrites a job it lost | Finishing requires the current lease; mutation-checked | `JobEngineIT.aWorkerCannotFinish…`, `…aCrashedWorkersJob…` |
| E4 | **Denial of service:** a crash loses work | Durable jobs, leases, reclaim; enqueue in the business transaction | `JobEngineIT` (rollback, reclaim) |
| E5 | **Tampering:** retries duplicate side effects | Idempotency keys on jobs, executions, reminders (per reminder number) and exceptions (one open per source); database effects commit with completion | `JobEngineIT`, `AutomationIT.reminders…` |
| E6 | **Information disclosure:** email payloads or link tokens leak from the database | AES-GCM with keys outside the database, bound to message or link id; email payload erased after the job; token copy erased on revoke and expiry | `JobEngineIT.emailIsEncrypted…`, `AutomationIT.remindersStop…`, `…anExpiredIncomplete…` |
| E7 | **Information disclosure:** secrets in job errors or logs | Unexpected errors store only their type; error text length-limited; email failures record the category only | `JobEngineIT.unexpectedErrors…` |
| E8 | **Tampering:** automation moves work arbitrarily | Rules use the same lifecycle and guards as people; never complete, fail or cancel; each move recorded with the rule and as an execution through the §29 state machine | `AutomationIT.workWaits…`, `ExecutionStatusTest` |
| E9 | **Repudiation:** nobody knows why work moved | Transitions record a person or a rule; executions record actor, input, result and error; audit events for automated actions | `AutomationIT` |
| E10 | **Tampering:** a rescan bug reroutes or releases a stored file | Trigger allows only the move to the version's own quarantine key, never back to clean; mutation-checked | `WorkRowLevelSecurityIT.historyCannotBeRewritten` |
| E11 | **Denial of service:** reminders spam a client | At most 3, spaced by 3 days, none near expiry, stop when answered or revoked; once per slot | `AutomationIT.reminders…` |
| E12 | **Denial of service:** the API cannot start without the database because of the worker | Schedules register in the scheduler loop with retries | `ReadinessWithoutDatabaseIT` |
| E13 | **Elevation:** a person closes a system task to skip a review | System tasks close only through their action (`TASK_SYSTEM_MANAGED`) | `AutomationIT.answersCreateReviewTasks…` |
| E14 | **Information disclosure:** exceptions of another tenant | Row-level security and the access check; not found for non-members | `AutomationIT.anExpiredIncomplete…`, `WorkRowLevelSecurityIT` |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| Email may be sent twice if a worker crashes between delivery and completion | Accepted: at-least-once rather than lost (ADR-025) | When a provider with idempotent send is chosen (Phase 8/13) |
| The runtime role can call the worker functions (claim, sweeps) from request code | Accepted: they only enqueue or claim, and claims are leased; a dedicated worker role is a deployment option | Phase 13 |
| Polling PostgreSQL limits throughput | Monitored through queue depth and duration (ADR-007) | When metrics justify a broker |
| A reminder is verified when queued, not when delivered; delivery failures surface as `DELIVERY_FAILED` exceptions | Accepted | Phase 5 (verification) |
