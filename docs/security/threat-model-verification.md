# Threat model: verification (Phase 5)

**Scope:** verification rules, results, decisions, evidence, completion
criteria and manifests, and the module split (ADR-026 to ADR-028). Builds on
the earlier threat models for identity, documents and requests, and execution.
**Method:** STRIDE per component; each threat names its control and evidence.
Reviewed 2026-10-14.

## Assets

- The integrity of decisions: what was accepted, by whom or by which rule, why
- Evidence and completion manifests (proof of verified completion)
- Rule definitions (they decide what clients can submit)

## Threats and controls

| # | Threat (STRIDE) | Control | Evidence |
|---|---|---|---|
| V1 | **Elevation:** a client answer accepted without checks or a person | Acceptance by rules only when opted in, normal risk, all checks passed, confidence ≥ 0.95; high risk forced to people (application and database constraint); without rules confidence is unset, so never automatic | `VerificationIT.automaticAcceptance…`, `…rulesAreValidated…` (high risk refused), V6 `requirements_high_risk_manual` |
| V2 | **Elevation:** a request link records a person's decision | Link update policy allows only rules decisions on the link's own answers (mutation-checked) | `WorkRowLevelSecurityIT.aRequestLinkCanRecordOnlyRulesDecisions…` |
| V3 | **Tampering:** decisions or results rewritten afterwards | Results, evidence, rules and manifests insert-only; answers change only in decision columns (mutation-checked) | `WorkRowLevelSecurityIT.historyCannotBeRewritten` |
| V4 | **Repudiation:** nobody knows why an answer was accepted | Every decision is evidence (person or rule); overrides need a reason, are stored on the answer and audited | `VerificationIT.overrides…`, `…everyAnswerGets…` |
| V5 | **Tampering:** completion proof altered | Canonical JSON with SHA-256 stored at completion; `intact` re-checks; insert-only for the application | `VerificationIT.completionIsGuarded…` |
| V6 | **Denial of service:** a team member defines a catastrophic regular expression | Pattern length ≤ 200, compiled at definition, evaluated under a 50 ms budget per value | `VerifierTest.aCatastrophicPattern…` (a 35-second pattern stopped) |
| V7 | **Tampering:** inconsistent information accepted silently | Consistency rules re-run when related answers change; failing accepted answers raise a high exception that blocks completion until handled | `VerificationIT.anAcceptedAnswerThatStopsMatching…`, `…consistencyChecksRunAgain…` |
| V8 | **Spoofing/Elevation:** rules pointing at another work or tenant | References must be requirements of the same work and kind; row-level security isolates rules | `RuleValidationTest`, `VerificationIT.rulesAreValidated…` |
| V9 | **Information disclosure:** verification data of another tenant | Row-level security on every table; API returns not found for non-members | `VerificationIT.anotherTenantSeesNoneOfIt`, `WorkRowLevelSecurityIT` |
| V10 | **Information disclosure:** fingerprints reveal answers | Fingerprints are visible only to members who can read the answers themselves; low-entropy answers (yes/no, dates) are trivially guessable from their hash, so fingerprints are never shown outside the organization | Design |
| V11 | **Tampering:** a "verified" claim based only on confidence | Status is decided by blocking and advisory outcomes, not confidence; confidence is described as a property of the checks, not of truth (§25) | `VerifierTest` |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| The manifest is tamper-evident, not tamper-proof (an owner with database access could rewrite both manifest and hash) | Accepted; an external timestamp or signature is a compliance feature | Phase 12 |
| Checks cannot read document contents yet | Declared deferral | Phase 6 |
| Rule messages are team-written text shown to clients | Plain text only; no markup is rendered | Ongoing |
