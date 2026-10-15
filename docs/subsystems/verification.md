# Verification

Deterministic checks on answers, structured results, evidence and completion
manifests (ADR-026 to ADR-028). Code: `apps/api/.../verification`
(engine, records) and `apps/api/.../information/application/AnswerChecks`
(when answers are checked and decided); schema: `V6__verification.sql`.

## Purpose and responsibilities

- Check every answer against the rules its requirement defines, and say
  exactly why it passed or failed (Guidelines §25).
- Decide only where deterministic checks justify it: reject on failed blocking
  checks; accept automatically only where a team opted in for a normal-risk
  requirement, every check passed and confidence is at least 0.95.
- Keep the evidence: answers and documents with fingerprints, every
  verification, every decision (§24).
- Seal what was accepted when work completes, so completion can be proven.

## Inputs and outputs

- **In:** a rule set per requirement (versioned); an answer (canonical value,
  or a document's detected type, size and SHA-256); the current answers of
  related requirements the caller can see.
- **Out:** a result (`PASSED`, `FAILED`, `NEEDS_REVIEW`) with per-check
  outcomes (`PASSED`, `FAILED`, `SKIPPED`) and confidence; evidence records;
  a decision on the answer where the rules allow one; on completion, a
  canonical JSON manifest and its SHA-256.

## How it works

1. Rules are validated when defined (kind, parameters, references to the same
   work) and stored as a new version; earlier versions remain for history.
2. When an answer is recorded, it is verified in the same transaction. A
   failed blocking check rejects it, with the rule messages as the reason the
   client sees. In a request link's scope, other requirements are invisible, so
   consistency checks are skipped there.
3. A job in the organization's scope then finishes skipped checks and
   re-verifies answers whose consistency rules refer to the changed one. A
   pending answer may then be decided; an accepted answer that now fails raises
   an `INCONSISTENT_INFORMATION` exception and can be replaced or reconfirmed
   with an override reason.
4. People decide what the rules leave open; accepting failed checks needs an
   override reason, recorded and audited.
5. Completion requires the criteria (all required accepted, no failed check
   without override, no open high exception, no open task) and seals the
   manifest in the completing transaction.

## Dependencies

None at runtime besides PostgreSQL; the module never reads other modules'
tables. Callers supply answers and related answers.

## Security

- Rules, results, evidence and manifests are insert-only for the runtime
  role; row-level security isolates tenants (mutation-checked).
- In a request link's scope, only rules decisions on the link's own answers
  can be recorded; a person's decision cannot (mutation-checked).
- Regular expressions run under a 50 ms budget per value; a pattern that takes
  35 seconds on Java 25 fails its check instead of hanging a request.
- Rule messages are written by the team and shown to clients; they are plain
  text, never markup.

## Failure modes

| Failure | Behaviour |
|---|---|
| Related answer missing or not visible | Check is `SKIPPED`; result `NEEDS_REVIEW`; completed later by the job |
| Pattern too slow | Check fails with "the pattern took too long to evaluate" |
| Answer of the wrong shape for a rule | Check fails ("cannot be checked by this rule") |
| Re-verification job fails | Retried by the job engine; dead-lettered jobs raise `JOB_FAILED` |
| Manifest changed outside the application | `intact: false` on the completion |

## Operations

- Metric `avenra.verification.completed` by status. A rising share of
  `FAILED` for client answers usually means unclear instructions or rules.
- The automatic-acceptance threshold (0.95) and the 50 ms pattern budget are
  constants in code (`AnswerChecks`, `Verifier`); changing them is an ADR.
