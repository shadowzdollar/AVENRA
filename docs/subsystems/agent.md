# Agent execution

The assistant prepares work for people (ADR-004, ADR-033). Code:
`apps/ai/.../tasks/work_plan.py` (planning), `apps/api/.../agent` (runs, gateway,
tools, runtime), `AgentWorkTools` and `AgentInformationTools` (the tool ports'
implementations); schema `V8__agent_execution.sql`.

## Purpose and responsibilities

- Propose a plan for a work item: requirements to ask for, internal tasks, and
  whether to send the client a request.
- Run only what people approved, as the person who started the run, within a
  budget and a deadline; verify each result; stop and ask for a person when
  anything goes wrong.

## Inputs and outputs

- **In:** a work item (title, description, type, existing requirement titles);
  approvals and stops from people.
- **Out:** requirements, tasks and at most one request link created through the
  normal services; a run record with every step, approval, attempt, result and
  error; audit events; a human-required exception when a run stops or fails.

## How it works

1. A person with `work.update` starts a run (planning must be on). A job asks
   the AI service for a plan; every step is validated by its tool, or the whole
   plan is refused. The run waits for approval.
2. A person with `work.approve` approves the plan (all steps up to MEDIUM risk)
   or rejects it. HIGH steps (emailing the client) need their own approval.
3. A job runs the next approved step: checks the run, budget, deadline and the
   tool, runs the tool as the starting person in its own transaction with the
   key `agent:<run>:<step>`, reads the result back, and schedules the next step.
   At an unapproved HIGH step the run waits for approval again.
4. The run completes when every step succeeded; it fails or stops otherwise.

## Dependencies

AI service (`work.plan`), job engine, the work and information modules through
the tool ports, organization access for permissions.

## Security

See `docs/security/threat-model-agent.md`.

## Failure modes

| Failure | Behaviour |
|---|---|
| Planning off | Start refused (`AI_PLANNING_OFF`) |
| Planner unavailable | Retried up to 3 attempts; then the run fails and asks for a person |
| Plan outside the catalogue | Whole plan refused; run fails; exception raised |
| Step refused (validation, permission) | Step fails; run fails; exception raised |
| Step hits a transient error | Retried with backoff up to the tool's attempts |
| Result not verified | Step fails; run fails; exception raised |
| Budget or deadline exceeded | Run stops; exception raised |
| Worker crash mid-step | The job runs again; the idempotency key returns the first result |

## Operations

- Metrics: `avenra.agent.steps` (tool, outcome), `avenra.agent.runs.ended`
  (status), plus the AI invocation metrics for planning.
- Budgets are product defaults in `agent/domain/Budget.java`; changing them is
  an ADR.
