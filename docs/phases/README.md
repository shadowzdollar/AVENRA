# Implementation Phases and Phase Gates

Avenra is built in the 13 phases defined in Building Guidelines §121.

## The phase-gate rule

**A phase is not finished until every item in its exit checklist is met and
proven.** The next phase does not start until then. "Proven" means there is
evidence a reviewer can check, such as a passing automated test, a CI run, a
command output or a document, not "the code exists".

Every phase checklist includes the Definition of Done (§123) for each
capability in that phase:

- requirements are clear and written down
- the API is defined in the contract (ADR-008), where there is one
- authorization exists and is tested (allowed **and** denied cases)
- tenant isolation is tested for every tenant-owned resource (§137)
- validation exists at every trust boundary touched
- business rules and state transitions are implemented and unit-tested
- errors are structured and handled; failure modes are tested
- audit events are written for important actions
- observability exists (logs, metrics, traces with consistent names, §101)
- security implications are reviewed and recorded
- documentation is updated (`docs/`, ADRs, module READMEs)
- CI is green on `main` after the merge

A phase also has a **hardening pass** before it closes: re-read the phase's
Guidelines sections, check every rule against the code, fill the gaps, and
record the result in the phase file.

### Scope note

Some capabilities cannot be fully proven until later. For example, staging
and production environments need a cloud provider (not yet chosen), and load
and recovery drills belong in Phase 13. Where a phase depends on such a
capability, the phase file says so explicitly as a **declared deferral**,
naming the phase that will close it. A deferral is never silent.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | [Foundation](phase-01-foundation.md) | Complete (2026-10-13) |
| 2 | [Identity](phase-02-identity.md) | In progress |
| 3 | Core business objects | Not started |
| 4 | Work execution | Not started |
| 5 | Verification | Not started |
| 6 | AI foundation | Not started |
| 7 | Agent execution | Not started |
| 8 | Integrations | Not started |
| 9 | Notifications | Not started |
| 10 | Audit and administration | Not started |
| 11 | Billing | Not started |
| 12 | Analytics | Not started |
| 13 | Production hardening | Not started |
