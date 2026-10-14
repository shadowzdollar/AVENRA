# Phase 5: Verification

**Status:** In progress
**Guidelines:** §21–§25, §50, §59, §101, §121 (Phase 5), §128, §136–§137
**Master Project:** §12 steps 7 and 10–11, §14.4, §16.4

## Goal

Avenra can say *why* a piece of information is trustworthy. Every answer is
checked by deterministic rules the team defines (format, range, allowed values,
dates, consistency between answers, file type and size); the result is a
structured verification with checks, confidence and evidence (§25). Clients see
exactly what is wrong straight away. People still decide what is accepted,
unless a team explicitly lets a low-risk item be accepted automatically. Work
completes only when its completion criteria are met, and completion produces
an immutable, hashed evidence manifest: verified completed work.

## Decisions (recorded in ADRs; product defaults marked)

- Module split: `information` (requirements, answers, request links, client
  requests) and `verification` (rules, verifications, evidence) next to `work`
  (ADR-026), closing the Phase 3 deferral (§128)
- Verification model: deterministic rules, structured results, confidence,
  automatic rejection of failed blocking checks, automatic acceptance only by
  opt-in and never for high-risk items (ADR-027)
- Evidence and completion: evidence records, completion criteria, immutable
  hashed completion manifest (ADR-028)
- Product defaults: human acceptance unless a requirement opts in; automatic
  acceptance needs every check passed and confidence at least 0.95

## Steps

1. ADRs 026–028
2. Module split as a pure refactor; the existing test suite proves behaviour unchanged
3. Contract: rules on requirements, verification results, overrides, completion
   criteria, evidence and manifest
4. Database: rules, verifications, evidence, completions with row-level security;
   immutable results
5. Rule engine and rule validation
6. Verification on every submission; automatic rejection and opt-in acceptance
7. Consistency checks re-run when related answers change
8. Human verification with override reasons
9. Completion criteria and the completion manifest
10. Web: rules, check results, client feedback, criteria checklist, evidence
11. Hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 5.1 | ADRs for module split, verification model, evidence and completion | ADR-026, ADR-027, ADR-028 | ☑ |
| 5.2 | `information` and `verification` modules own their data; no cycles; behaviour unchanged by the split | Modularity test, full suite | ☐ |
| 5.3 | Every rule type is validated when defined and evaluated deterministically | Unit + integration tests | ☐ |
| 5.4 | Every answer gets a structured, immutable verification (status, confidence, checks, evidence) | Integration tests | ☐ |
| 5.5 | Failed blocking checks reject the answer at once with specific reasons the client sees | Integration + end-to-end tests | ☐ |
| 5.6 | Automatic acceptance only when opted in, all checks passed, confidence ≥ threshold, and not high-risk; recorded as a system decision | Integration tests | ☐ |
| 5.7 | Consistency checks re-run when a related answer changes | Integration tests | ☐ |
| 5.8 | People can accept despite failed checks only with an override reason; overrides audited | Integration tests | ☐ |
| 5.9 | Evidence is first-class; completion produces an immutable, hashed manifest that can be checked | Integration tests | ☐ |
| 5.10 | Completion criteria are computed server-side, shown, and enforced | Integration tests | ☐ |
| 5.11 | New tables have row-level security and isolation tests | Integration tests | ☐ |
| 5.12 | Web: rules, check results, client feedback, criteria and evidence work end to end | End-to-end test | ☐ |
| 5.13 | Metrics, threat model, CI green, hardening pass recorded | `docs/security/`, CI, this file | ☐ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| Checks that read document contents (fields, dates in a PDF) | Need extraction | Phase 6 |
| AI-assisted verification and AI confidence | Need the AI foundation; AI output stays unverified until deterministic checks and people confirm it (§50) | Phases 6–7 |
| Verifying outcomes of actions in external systems (Phase 4 deferral) | The only external action is email; delivery confirmation needs a provider with delivery events | Phase 8 |
| Approvals before execution | Approval gates | Phase 7 |

## Hardening record

_To be completed at phase close._
