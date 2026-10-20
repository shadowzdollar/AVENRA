# ADR-033: Agent runs, the tool gateway and approval gates

**Status:** Accepted (implements ADR-004; amends ADR-030)

## Context

ADR-004 chose one orchestrator with a tool gateway. Guidelines §129–§133 add
the runtime rules: model output is not authorization, every execution has an
explicit context and budget, the runtime can terminate it, approvals are
explicit workflow state, and results are verified after execution. Phase 7
applies them to the first agent capability: planning a work item.

## Decision

- **Capability.** `information.plan`: the AI service's `work.plan` task reads
  the work's title, description, type and the titles of its existing
  requirements, and proposes steps from the tool catalogue. One model call per
  run. The plan is data until a person approves it.
- **Tool catalogue** (closed; each tool declares name, description, input
  schema, permission, risk, audit action, timeout, retry policy, idempotency):

  | Tool | Effect | Permission | Risk |
  |---|---|---|---|
  | `create_requirement` | adds a requirement to this work | `work.update` | MEDIUM |
  | `create_task` | adds an internal task to this work | `work.update` | MEDIUM |
  | `send_information_request` | emails the work's client a request link for the open required items | `information.collect` | HIGH |

  The model never chooses resources: every tool acts on the run's own work, and
  the request goes to the client's recorded email address, never one from the
  model. CRITICAL tools are not available to agents.
- **Runtime context** of a run: organization, the person who started it, the
  work, the allowed tools (a snapshot of the catalogue), the budget, the
  deadline and the trace id (§130).
- **Run states:** `PLANNING → AWAITING_APPROVAL → RUNNING → COMPLETED`, with
  `REJECTED` (a person declined the plan), `STOPPED` (a person, the budget or
  the deadline stopped it) and `FAILED` (a step failed for good). A run that
  reaches an unapproved high-risk step goes back to `AWAITING_APPROVAL`.
- **Step states:** `PROPOSED → APPROVED → RUNNING → SUCCEEDED`, with
  `REJECTED`, `FAILED` and `SKIPPED` (the run ended first). Transitions are
  checked by state machines; nothing writes a status directly.
- **Approval gates (§132).** Approving the plan needs `work.approve` and
  approves every step up to MEDIUM risk. Each HIGH step needs its own explicit
  approval by someone with `work.approve` (it can be given together with the
  plan). Approvals record who and when, and are audited.
- **Gateway.** Before each step: the run is `RUNNING`, inside its deadline and
  budget; the tool is in the run's allowed tools; the input validates; the
  starting person still holds the tool's permission (checked through the same
  organization access path as a request, so it can never exceed theirs). The
  step then runs as that person, in a transaction of its own, with the
  idempotency key `agent:<run>:<step>`, so a retry returns the first result
  instead of acting twice.
- **Verification after execution (§133).** Each tool reads the resulting state
  and compares it with what the step meant to do (the requirement exists on
  the work; the task exists; an active request link to the client exists).
  A step succeeds only when verified.
- **Budgets (§131), product defaults:** 1 plan (one model call that produced
  an answer; a transient provider failure is retried up to 3 times and each
  attempt is recorded as an invocation), 20 tool calls,
  1 external side effect, 200,000 micro-dollars (0.20 USD), 1 hour; 3 attempts
  per step. Exceeding any of them stops the run (`STOPPED`, reason recorded),
  raises a `HUMAN_REQUIRED` exception on the work and so a review task. A
  minute-by-minute sweep stops runs past their deadline, so a stuck run does
  not depend on itself to end.
- **Failures** are classified (§103): a tool's validation or permission error
  fails the step at once; transient errors are retried by the job engine; a
  step that keeps failing fails the run and raises an exception.
- **Planning opt-in (amends ADR-030).** Planning sends work details to the
  model provider, so `ai_settings` gains `work_planning`, off by default,
  owner-only, audited, and counted against the same daily call limit.
- **Records.** Runs and steps are tenant-owned with row-level security and are
  the execution record of the agent (§29): who started and approved each step,
  each attempt, its result or error and its verification. The planning call is
  an AI invocation (purpose `work.plan`); starts, approvals, every executed step
  and every end are audit events (`agent.*`). The tool and input of a step
  cannot change after planning, and the database refuses a step that runs
  without a recorded approval.

## Alternatives

- **Let the model call tools directly in a loop** — rejected for now: one plan
  approved by a person is easier to permission, trace and stop than an open
  loop; the gateway is ready for a loop later.
- **Approve every step one by one** — rejected as the default: reversible
  internal steps are approved with the plan; only external effects need their
  own approval.

## Consequences

- New capabilities add tools to the catalogue, each with its declaration and
  verification, instead of giving the model wider access.
- The planner can propose only what the gateway allows, and the gateway checks
  again when it runs.
