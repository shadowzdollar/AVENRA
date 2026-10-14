# ADR-023: Execution records and automatic work transitions

**Status:** Accepted

## Context

Guidelines §28 requires a record of every attempt to perform an action, and
§29 a controlled execution state machine. Phase 3 left work transitions to
people; Phase 4 lets the platform move work on its own (§104).

## Decision

- **Execution** (per tenant): work, optional step (task or requirement),
  actor (`USER` with id, or `SYSTEM`), action (e.g. `request_link.remind`,
  `work.advance`), target, input reference, status, result (JSON), error,
  retry count, job id, times.
- **States** (§29) and the only allowed moves:

  | From | To |
  |---|---|
  | PLANNED | AUTHORIZED, CANCELLED |
  | AUTHORIZED | READY, CANCELLED |
  | READY | RUNNING, CANCELLED |
  | RUNNING | WAITING, REQUIRES_APPROVAL, FAILED, SUCCEEDED |
  | WAITING | RUNNING, FAILED, CANCELLED |
  | REQUIRES_APPROVAL | RUNNING, CANCELLED |
  | SUCCEEDED | VERIFIED, FAILED |
  | VERIFIED | COMPLETED |
  | FAILED, COMPLETED, CANCELLED | — (final) |

  Platform actions in Phase 4 are authorized by the rule that triggers them
  (recorded as `AUTHORIZED` with the rule name); approval gates arrive in
  Phase 7. An action is `VERIFIED` only when the platform has checked its
  resulting state (for an email: the provider accepted it; for a transition:
  the work is in the target status) — never merely because a call returned.
- **Automatic work transitions**, made by the `SYSTEM` actor through the same
  lifecycle as people (ADR-018) and recorded in the history with the rule:
  - a request link is sent while the work is `RUNNING` →
    `WAITING_FOR_INFORMATION` (rule `information.requested`);
  - every required requirement has an answer (none missing or rejected) while
    `WAITING_FOR_INFORMATION` → `RUNNING` (rule `information.received`);
  - a review rejects an answer that was asked for through an active link while
    `RUNNING` → `WAITING_FOR_INFORMATION` (rule `information.rejected`).
  The platform never completes, fails or cancels work on its own.
- Transitions run as jobs after the triggering change commits, so a failure to
  advance never undoes the client's submission.

## Consequences

- The history shows who moved the work: a person or a named rule.
- Phase 5 adds verification results as evidence for `VERIFIED`.
