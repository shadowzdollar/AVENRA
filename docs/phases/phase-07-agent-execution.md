# Phase 7: Agent Execution

**Status:** Complete (2026-10-20)
**Guidelines:** §41, §44–§47, §50, §103, §121 (Phase 7), §129–§133
**Master Project:** §12 steps 2–6, §14.2, §43

## Goal

Avenra can prepare the work for a person. Asked to plan a work item, an
assistant proposes concrete steps: the information to ask the client for, the
internal tasks, and sending the request. Nothing happens until a person
approves the plan; sending anything to the client needs its own approval.
Approved steps run through a tool gateway that checks every step against the
tool's schema, the person's permissions, the run's budget and its deadline,
then verifies the result by reading the state back. A run can be stopped at
any time, and one that exceeds its budget stops itself and asks for a person.

## Decisions (recorded in ADRs; product defaults marked)

- Orchestrator, tool gateway, agent runs, budgets and approval gates
  (ADR-033, implements ADR-004)
- Planning sends the work's title, description and existing requirement titles
  to the model provider, so it has its own organization setting, off by
  default and owner-only like document reading (ADR-033 amends ADR-030;
  **product default**)
- Product defaults: one model call per run; at most 20 tool calls, 1 external
  side effect, 0.20 USD and 1 hour per run; at most 3 attempts per step

## Steps

1. ADR-033 and this phase file
2. AI service: `work.plan` task, prompt, validation, fake answers, evaluation cases
3. Contract: agent runs, steps, approval, stop; planning setting
4. Database: agent runs and steps with row-level security
5. API: `agent` module (registry, gateway, runs, jobs, approval, stop, budgets,
   deadline sweep, verification after execution, exceptions)
6. Web: plan, approve, follow and stop a run on the work page
7. Threat model, subsystem documentation, hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 7.1 | ADR for the orchestrator, gateway, runs, budgets and approval gates | ADR-033 (implements ADR-004, amends ADR-030) | ☑ |
| 7.2 | Every tool declares name, description, input schema, permission, risk, audit action, timeout, retry policy and idempotency; the catalogue is closed | `Tool` interface; `ToolCatalogueTest.everyToolDeclaresItsContract`; registry refuses CRITICAL and duplicate tools (`…theRegistryRefuses…`) | ☑ |
| 7.3 | Model output is validated before it becomes a step; unknown tools and invalid inputs are refused | AI service: strict per-tool output model (`test_invalid_plans_are_rejected_whole`, 8 cases); API: every step validated by its tool or the whole plan refused (`AgentRunIT.theGatewayRefusesPlansOutsideTheCatalogue`, `ToolCatalogueTest.inputOutsideTheSchemaIsRefused`) | ☑ |
| 7.4 | Each step runs with the starting person's permissions, checked when it runs, never more | `AgentRunIT.approvingNeedsWorkApproveAndStepsRunWithTheStartersPermissionsOnly` (starter demoted before execution: step refused, nothing created) | ☑ |
| 7.5 | Nothing runs before a person approves the plan; high-risk steps need their own approval; approval states are explicit | `AgentRunIT.nothingRunsBeforeApprovalAndTheHighRiskStepNeedsItsOwn`, `…aRejectedPlanDoesNothing`, `AgentStatesTest`, database constraint (`…theDatabaseKeepsUnapprovedSteps…`) | ☑ |
| 7.6 | Budgets (model calls, tool calls, side effects, cost, deadline) stop a run, record the reason, raise an exception and ask for a person | `AgentStatesTest.budgetsStopRunsThatOverspendOrOverrun`, `AgentRunIT.aRunPastItsDeadlineIsStoppedByTheSweepAndAsksForAPerson` (exception raised) | ☑ |
| 7.7 | A person can stop a run at any time; the runtime never depends on the agent stopping itself | `AgentRunIT.aPersonCanStopARunAtAnyTime`; deadline sweep (`sweep_agent_deadlines`) | ☑ |
| 7.8 | Steps are idempotent and retries classified; a retried step has no second effect | `AgentRunIT.aRepeatedStepHasNoSecondEffect` (replayed step: same link, one email); `…planningRetriesTransientFailures…` (attempts recorded) | ☑ |
| 7.9 | Each step's outcome is verified by reading the resulting state | Each tool's `verify` reads the state back; `AgentRunIT.nothingRunsBefore…` (results verified, request to the recorded address) | ☑ |
| 7.10 | Runs and steps are traced, audited and tenant-isolated | Trace id on every run; `avenra.agent.*` metrics; audit `agent.*` (`AgentRunIT.nothingRunsBefore…`); `WorkRowLevelSecurityIT` (both tables), `AgentRunIT.anotherOrganizationSeesNoneOfIt` | ☑ |
| 7.11 | Planning is off until an owner switches it on | `AgentRunIT.planningIsOffUntilAnOwnerSwitchesItOn`; owner-only switch (ADR-030 permission `ai.manage`) | ☑ |
| 7.12 | Web: plan, approve, follow and stop a run | `e2e/agent.spec.ts` (switch on, plan, approve, high-risk step approved and refused for lack of a client address); `rule-editor.test.tsx` agent helpers | ☑ |
| 7.13 | Threat model for agent execution | `docs/security/threat-model-agent.md` | ☑ |

## Hardening record

- Local runs of every CI check (`make check`): AI service 82 tests, API 86 unit
  and 156 integration tests, web 46 unit tests; browser journeys 5/5, twice in
  a row, against a production web build, the real AI service (fake provider)
  and the API. Jaeger and Mailpit could not be updated to the Dependabot
  versions locally (network); the run used Mailpit 1.31.4.
- Found and fixed while hardening: saving the budget moved a run from RUNNING
  to RUNNING (refused by the state machine); a resumed run reused an approval's
  job key and stalled; steps ran in a person-only scope where the work's
  requirements were invisible; follow-up jobs could deduplicate and stall a run;
  the browser suite outgrew the sign-up limit (raised for local development
  and the CI smoke containers only).
- Planning evaluation against the real model is part of the Phase 6 deferral.

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing); local runs of the same checks are the evidence | When billing is fixed |
| Tools for integrations (CRM, storage, calendar) | No integrations yet | Phase 8 |
| Evaluation dataset for planning | Plans are always approved by a person; quality is measured with the real-model run deferred in Phase 6 | With the Phase 6 deferral |
