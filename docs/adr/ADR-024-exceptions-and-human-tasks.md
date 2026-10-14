# ADR-024: Exceptions and human tasks

**Status:** Accepted

## Context

Guidelines §26 treats exceptions as normal business states with their own
lifecycle; §106 requires an explicit human task, saying exactly what is needed,
whenever a person must act.

## Decision

- **Exception** (per tenant, optionally on a work item): type, severity
  (`LOW`, `MEDIUM`, `HIGH`), description, source (what raised it, with a
  reference), status, assignee (membership), resolution, times. Lifecycle:

  | From | To |
  |---|---|
  | OPEN | IN_PROGRESS, WAITING, RESOLVED, DISMISSED |
  | IN_PROGRESS | WAITING, RESOLVED, DISMISSED |
  | WAITING | IN_PROGRESS, RESOLVED, DISMISSED |
  | RESOLVED, DISMISSED | — (final) |

  Resolving or dismissing needs a resolution text. People change exceptions
  with `work.update`; the platform raises them.
- **Raised by:** a dead job (`JOB_FAILED`), an undeliverable email
  (`DELIVERY_FAILED`), a request link that expired with required items missing
  (`REQUEST_EXPIRED_INCOMPLETE`), work past its due date (`WORK_OVERDUE`),
  malware found when rescanning a stored file (`MALWARE_FOUND`), and handlers
  that need a person (`HUMAN_REQUIRED`). Raising is idempotent per source
  (one open exception per source).
- **Human tasks** extend Phase 3 tasks: origin (`MANUAL` or `SYSTEM`), the
  required action, the reason, a deadline, the available choices, and a
  reference to what they are about (a requirement or an exception). The
  platform creates a review task when an answer arrives for a requirement
  (choices: accept, reject) and closes it when the answer is reviewed. A
  system task can be closed only by the action it asks for or by cancelling
  the work.

## Consequences

- The work page can show the blocked reason and the next action from data, not
  from logs (§107).
