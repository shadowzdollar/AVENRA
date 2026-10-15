# Phase 6: AI Foundation

**Status:** In progress
**Guidelines:** §6, §41–§53, §99, §103, §121 (Phase 6), §129, §143
**Master Project:** §12 steps 6–7, §14.4, §41, §43

## Goal

Avenra can read a client's document and tell the team what it found: what
kind of document it is and the fields the team asked for (a name, an expiry
date), each with the passage it came from. What the model returns is untrusted:
it is validated against a strict schema, located in the document text where
possible, and only ever used as **advisory** checks that flag an answer for a
person. It never rejects or accepts an answer on its own. Every model call is
recorded with its model, prompt version, tokens, latency and estimated cost.
Reading is off until an owner of the organization switches it on.

## Decisions (recorded in ADRs; product defaults marked)

- AI service and provider abstraction: one internal interface, a Claude adapter
  and a deterministic fake; structured outputs validated by the service;
  versioned prompts; tool proposals validated and never executed; service
  authentication between API and AI service (ADR-029, implements ADR-003)
- AI data processing opt-in, invocation records and cost limits (ADR-030)
- Document reading and advisory AI checks; prompt-injection defences; retrieval
  foundation without a vector database (ADR-031)
- AI evaluation: dataset, metrics, runner, CI gate on the fake provider and
  recorded runs against the real model (ADR-032)
- Product decisions (2026-10-15, by the product owner):
  - AI document reading is **opt-in per organization**, off by default; only an
    owner switches it on; the setting and every use are audited; the client's
    request page says documents may be read automatically
  - default model **Claude Sonnet 5.5** (`claude-sonnet-5-5`), configurable
  - AI-derived checks are **advisory only**

## Steps

1. ADRs 029–032 and this phase file
2. AI service: provider interface, Claude adapter, fake provider, prompt
   registry, document reading task with output validation and grounding,
   retrieval, tool proposals, service authentication, error classification
3. Evaluation dataset and runner
4. Contract: AI settings, invocations, document readings, AI rule types,
   checks marked as AI-derived, client notice
5. Database: AI settings, invocation records, document readings, with
   row-level security
6. API: `ai` module (settings, client, invocation records, limits), reading job,
   advisory rules in verification, re-check when a reading arrives
7. Web: owner setting, usage view, AI rules in the rule editor, readings and
   advisory checks on the work, notice on the request page
8. Threat model, subsystem documentation, hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 6.1 | ADRs for the AI service, opt-in and invocation records, document reading and advisory checks, evaluation | | ☐ |
| 6.2 | Business code depends only on the provider interface; the Claude adapter and the fake are interchangeable | | ☐ |
| 6.3 | Model output is validated against a strict schema; invalid output is rejected, never used | | ☐ |
| 6.4 | Prompts are versioned; every invocation records the prompt name, version and hash | | ☐ |
| 6.5 | Every AI call is recorded (organization, purpose, model, tokens, latency, estimated cost, outcome); usage is visible to the organization | | ☐ |
| 6.6 | AI reading is off by default; only an owner can switch it on; the change and every use are audited; no document is sent while it is off | | ☐ |
| 6.7 | AI checks are advisory: they can flag an answer for review but never reject or accept it | | ☐ |
| 6.8 | Extracted values carry their source (quote, page) and are located in the document text where it has one | | ☐ |
| 6.9 | Documents are data: injection attempts in documents do not change the output's shape or the system's behaviour | | ☐ |
| 6.10 | Tool proposals are validated against declared schemas and never executed by the AI service | | ☐ |
| 6.11 | The API authenticates to the AI service; failures are classified as retryable or not | | ☐ |
| 6.12 | Evaluation dataset and runner; CI runs it on the fake provider; a run against the real model is recorded | | ☐ |
| 6.13 | Threat model for AI document reading | | ☐ |

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| Vector database, embeddings | No retrieval use case beyond one document at a time (§51) | When one exists |
| Executing tool proposals through a tool gateway | Tool gateway, permissions and approval gates | Phase 7 |
