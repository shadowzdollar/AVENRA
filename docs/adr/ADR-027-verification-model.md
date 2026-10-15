# ADR-027: Verification model

**Status:** Accepted

## Context

Guidelines §25 requires structured verification results with checks,
confidence and evidence, and warns that confidence alone never suffices for
high-risk decisions. §50 requires deterministic validation before anything is
treated as true. The Master Project's verification step (§12.7) checks
completeness, consistency, expected formats, relationships between records and
supporting evidence.

## Decision

- **Rules** are attached to a requirement and validated when defined:

  | Rule | Applies to | Checks |
  |---|---|---|
  | `PATTERN` | text | matches a regular expression (length-limited, compiled safely) |
  | `LENGTH` | text | minimum and/or maximum length |
  | `ONE_OF` | text, number | value is one of a list |
  | `RANGE` | number | minimum and/or maximum |
  | `DATE_RANGE` | date | not before / not after a date, or relative to today (e.g. not expired in 30 days) |
  | `EQUALS_REQUIREMENT` | text, number, date | equals the current answer of another requirement of the same work |
  | `DATE_ORDER` | date | before or after another requirement's date |
  | `FILE_TYPE` | document | detected type is one of a list |
  | `FILE_SIZE` | document | at most a size |

  Each rule has a message shown when it fails and a **severity**: `BLOCKING`
  (failure rejects the answer) or `ADVISORY` (failure is reported and needs a
  person's attention). Rules referring to other requirements must point to the
  same work.
- **Verification result** (immutable, one per answer and run): status
  `PASSED`, `FAILED` (a blocking check failed), `NEEDS_REVIEW` (an advisory
  check failed, or a related answer is missing), the checks (name, passed,
  detail, severity), the confidence, the evidence (the answer, the document
  version and its checksum, the rule set version), method `RULES`, time.
- **Confidence** is the share of passed check weight, where blocking checks
  weigh 2 and advisory checks 1; with no rules the confidence is unset, never
  1. It describes the checks, not the truth of the answer.
- **Decisions:**
  - a `FAILED` answer is rejected at once by the system, with the failed rule
    messages as the reason the client sees;
  - acceptance stays with people by default (**product default**). A
    requirement may opt in to automatic acceptance (`AUTOMATIC`) when it is
    **not high-risk**; an answer is then accepted by the system only if the
    result is `PASSED` and the confidence is at least the threshold (0.95,
    **product default**). High-risk requirements always need a person;
  - a person may accept an answer whose checks failed only with an override
    reason; the override is recorded with the person and audited.
- **Re-verification:** when an answer changes, answers of the same work whose
  consistency rules refer to it are verified again; a pending answer whose
  result changes to `FAILED` is rejected, an accepted answer that now fails
  raises an exception instead of being changed silently.
- Verification runs synchronously in the submission's transaction: rules are
  deterministic and cheap, and the client gets the result immediately.

## Alternatives

- **Scripted or expression-language rules** — rejected for now: harder to
  validate and to explain to clients.
- **Automatic acceptance by default** — rejected: people stay responsible for
  what is accepted until a team chooses otherwise.

## Consequences

- Phase 6 adds rules that read extracted document fields; their results feed
  the same model.
