# Threat model: agent execution (Phase 7)

**Scope:** the assistant's planning task, agent runs and steps, the tool
gateway, approval gates, budgets and the deadline sweep (ADR-004, ADR-033).
Builds on the AI threat model (Phase 6) for the model call itself.
**Method:** STRIDE plus the OWASP agentic risks named in Guidelines §48 (goal
hijacking, tool misuse, privilege abuse, cascading failures). Reviewed
2026-10-20.

## Assets

- The work's data and the client's inbox (the one external effect)
- The integrity of who approved what
- The organization's choice to let work details reach the model provider
- AI and email spending

## Threats and controls

| # | Threat | Control | Evidence |
|---|---|---|---|
| G1 | **Goal hijacking:** a work description tells the planner to do something else | The work is passed as delimited data; the planner can only express the allowed tools (closed schema); the gateway re-validates every step and refuses the whole plan if any step is outside the catalogue | `test_the_work_is_passed_as_delimited_data`, `test_invalid_plans_are_rejected_whole`, `AgentRunIT.theGatewayRefusesPlansOutsideTheCatalogue` |
| G2 | **Tool misuse:** the model addresses the client email to someone else or smuggles a link | The request tool has no recipient input; it uses the client's recorded address; messages with addresses or links are refused | `ToolCatalogueTest.theModelCannotAddressTheRequest…`, `AgentRunIT.nothingRunsBeforeApproval…` (email to the client's address only), `e2e/agent.spec.ts` (no address, no email) |
| G3 | **Privilege abuse:** a step does more than its person could | Each step runs as the person who started the run, through the module's own permission check at execution time; losing the permission fails the step | `AgentRunIT.approvingNeedsWorkApproveAndStepsRun…` |
| G4 | **Elevation:** something runs without approval | Plans need `work.approve`; HIGH steps need their own approval; the state machines and a database constraint refuse a running step without a recorded approval | `AgentStatesTest`, `AgentRunIT.nothingRunsBeforeApproval…`, `…theDatabaseKeepsUnapprovedSteps…` |
| G5 | **Tampering:** a step's tool or input changed after approval | Only outcome columns of steps and runs are writable by the application role | `AgentRunIT.theDatabaseKeepsUnapprovedSteps…` |
| G6 | **Cascading failure / runaway cost:** a run keeps acting | Budgets for plans, tool calls, external effects, cost and time; checked before every model call and step; the deadline sweep stops runs that would not stop themselves; a person can stop any run | `AgentStatesTest.budgetsStop…`, `AgentRunIT.aRunPastItsDeadline…`, `…aPersonCanStopARun…` |
| G7 | **Repudiation:** nobody knows who approved an email | Approvals record person and time; starts, approvals, steps and ends are audited; the planning call is an invocation | `AgentRunIT.nothingRunsBeforeApproval…` (audit actions) |
| G8 | **Duplicate effects:** a retried or replayed step emails twice | Each step's effect is idempotent under `agent:<run>:<step>` and commits with its idempotency record | `AgentRunIT.aRepeatedStepHasNoSecondEffect` |
| G9 | **Information disclosure:** another tenant's runs | Row-level security on runs and steps; not found for non-members | `WorkRowLevelSecurityIT`, `AgentRunIT.anotherOrganizationSeesNoneOfIt` |
| G10 | **Information disclosure:** work details sent to a provider without consent | Planning is off by default and owner-only; checked when a run starts and again before the model call | `AgentRunIT.planningIsOffUntil…` |
| G11 | **Denial of service:** a failed step blocks the work silently | Failed and stopped runs raise a human-required exception on the work | `AgentRunIT.approvingNeeds…`, `…aRunPastItsDeadline…` |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| A plan may be unhelpful (wrong items to ask for) | Accepted: a person approves every plan; requirements are reversible | Evaluation of planning with the real model, with the Phase 6 run |
| Tool execution runs in a job transaction that holds a connection | Accepted at current scale (short steps, four job slots) | When agent volume grows |
