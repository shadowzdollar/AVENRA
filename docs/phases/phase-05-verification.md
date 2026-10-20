# Phase 5: Verification

**Status:** Complete (2026-10-15)
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
| 5.2 | `information` and `verification` modules own their data; no cycles; behaviour unchanged by the split | `ModularityTest` (no cycles); the split landed as a pure refactor with the unchanged suite green (56 unit, 125 integration); `information` never imports `work`, `work` uses only the `Information` facade | ☑ |
| 5.3 | Every rule type is validated when defined and evaluated deterministically | `RuleValidationTest`, `VerifierTest` (deterministic, every rule type), `VerificationIT.rulesAreValidatedWhenDefined` | ☑ |
| 5.4 | Every answer gets a structured, immutable verification (status, confidence, checks, evidence) | `VerificationIT.everyAnswerGetsAStructuredVerificationWithEvidence`; immutability in `WorkRowLevelSecurityIT.historyCannotBeRewritten` | ☑ |
| 5.5 | Failed blocking checks reject the answer at once with specific reasons the client sees | `VerificationIT.failedBlockingChecksRejectAClientsAnswerAtOnceWithReasons`, `e2e/verification.spec.ts` | ☑ |
| 5.6 | Automatic acceptance only when opted in, all checks passed, confidence ≥ threshold, and not high-risk; recorded as a system decision | `VerificationIT.automaticAcceptanceOnlyWhenOptedInAndEverythingPasses`, `…rulesAreValidated…` (high risk + automatic refused; database constraint) | ☑ |
| 5.7 | Consistency checks re-run when a related answer changes | `VerificationIT.consistencyChecksRunAgainWhenARelatedAnswerChanges`, `…anAcceptedAnswerThatStopsMatching…` | ☑ |
| 5.8 | People can accept despite failed checks only with an override reason; overrides audited | `VerificationIT.overridesAreRequiredToAcceptFailedChecksAndAreAudited` | ☑ |
| 5.9 | Evidence is first-class; completion produces an immutable, hashed manifest that can be checked | `VerificationIT.everyAnswerGets…` (evidence), `…completionIsGuardedByCriteriaAndSealsAVerifiableManifest` (hash recomputed, tampering detected) | ☑ |
| 5.10 | Completion criteria are computed server-side, shown, and enforced | `WorkFlowIT` (`COMPLETION_CRITERIA_UNMET` with the unmet criteria), `VerificationIT.completionIsGuarded…`, `…anAcceptedAnswerThatStopsMatching…` | ☑ |
| 5.11 | New tables have row-level security and isolation tests | `WorkRowLevelSecurityIT` (verification tables, link decision policy); mutation check: 3 of 3 broken guards caught; `VerificationIT.anotherTenantSeesNoneOfIt` | ☑ |
| 5.12 | Web: rules, check results, client feedback, criteria and evidence work end to end | `e2e/verification.spec.ts` (checks defined in the browser, immediate client feedback, automatic acceptance, proof intact), `rule-editor.test.tsx` | ☑ |
| 5.13 | Metrics, threat model, CI green, hardening pass recorded | `avenra.verification.completed` (`VerificationIT`); [threat-model-verification.md](../security/threat-model-verification.md) (11 threats); [verification.md](../subsystems/verification.md); CI run 38680343397 on PR #22: all 10 jobs green (69 unit + 135 integration tests, three browser journeys against the built images, clean image scans); hardening record below | ☑ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| Checks that read document contents (fields, dates in a PDF) | Need extraction | Phase 6 — closed by ADR-031 |
| AI-assisted verification and AI confidence | Need the AI foundation; AI output stays unverified until deterministic checks and people confirm it (§50) | Phases 6–7 |
| Verifying outcomes of actions in external systems (Phase 4 deferral) | The only external action is email; delivery confirmation needs a provider with delivery events | Phase 8 |
| Approvals before execution | Approval gates | Phase 7 |

## Hardening record

Phase 5 Guidelines sections re-read and checked against the code on
2026-10-14.

| Section | Rule | Result |
|---|---|---|
| §21 | Requirements drive completeness | Met. Completeness and completion criteria come from requirements and their decisions |
| §22, §136 | Information with confidence and verification state | Met. Confidence from checks, verification state, decision method, override, provenance |
| §23 | Documents verified and versioned | Met. File-type and size checks on the detected facts; checksums in evidence and manifest |
| §24 | Evidence first-class; results point to evidence | Met. Evidence table; every result lists its evidence references |
| §25 | Structured verification; confidence never sufficient alone | Met. Status from check outcomes, not confidence; high-risk always decided by people |
| §50 | Deterministic validation before anything is treated as true | Met. Only deterministic rules decide; AI checks are deferred and will feed the same model |
| §59 | Audit important actions | Met. Rule changes, decisions, overrides, reconfirmations, exceptions |
| §101 | Telemetry naming | Met. `avenra.verification.completed` by status |
| §128 | Modules own their data | Met. `information`, `verification` and `work` split with one-way dependencies (ADR-026), closing the Phase 3 deferral |
| §137 | Tenant isolation tests | Met at API and database level (mutation-checked) |

Findings fixed during the phase, before merge:

- The generated Java models start optional lists as empty lists, so `minItems: 1`
  rejected every rule; removed from the contract (rule validation checks them).
- Answers returned by submit, upload and list lacked their check results.
- The new exception type was missing from the contract; listing exceptions
  answered 500.
- A request link's scope had no update policy on answers, so a rules rejection
  of a client's answer silently changed nothing; a narrow policy now allows
  only rules decisions on the link's own answers.
- An accepted answer that stopped passing after a related answer changed could
  be neither replaced nor re-reviewed, blocking completion forever; it can now
  be replaced or reconfirmed with an override.
- The textbook catastrophic patterns finish instantly on Java 25, so the test
  did not prove the time budget; it now uses a measured 35-second pattern.
- The breaking-change gate flagged the new exception type. Rather than weaken
  the gate, intentional pre-release changes are listed with their full
  oasdiff message and a reason (ADR-008 amended); the exception type is
  documented as open-ended. Verified locally with the same oasdiff version
  before CI.
