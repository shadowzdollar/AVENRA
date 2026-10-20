# Phase 6: AI Foundation

**Status:** Complete (2026-10-20), with one written deferral (the real-model evaluation run)
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
| 6.1 | ADRs for the AI service, opt-in and invocation records, document reading and advisory checks, evaluation | ADR-029, ADR-030, ADR-031, ADR-032 | ☑ |
| 6.2 | Business code depends only on the provider interface; the Claude adapter and the fake are interchangeable | Tasks use only `providers.base.Provider`; `ClaudeProvider` and `FakeProvider` both pass `test_document_read.py` paths; the API sees one wire format (`AiReadingIT` against the stub, `e2e/ai-reading.spec.ts` against the real service) | ☑ |
| 6.3 | Model output is validated against a strict schema; invalid output is rejected, never used | Strict Pydantic output model plus request checks (`test_invalid_answers_are_rejected_whole`, 12 cases); API re-validation (`AiServiceClientTest`); invalid output recorded and discarded (`AiReadingIT.invalidAnswersFromTheAiServiceAreDiscardedAndRecorded`) | ☑ |
| 6.4 | Prompts are versioned; every invocation records the prompt name, version and hash | `prompts/document_read/v1.md`, SHA-256 returned and stored (`test_every_reading_names_its_prompt_model_and_cost`, `AiReadingIT.aReadingIsRecorded…`); prompt ships in the wheel | ☑ |
| 6.5 | Every AI call is recorded (organization, purpose, model, tokens, latency, estimated cost, outcome); usage is visible to the organization | `ai_invocations` per call incl. failed attempts (`AiReadingIT.aReadingIsRecorded…`, `…retryableFailuresAreRetried…`); usage endpoint and organization page (`e2e/ai-reading.spec.ts`); metrics `avenra.ai.*` | ☑ |
| 6.6 | AI reading is off by default; only an owner can switch it on; the change and every use are audited; no document is sent while it is off | `AiReadingIT.readingIsOffUntilAnOwnerSwitchesItOn…` (admin 403, audited), `…nothingIsSentWhileReadingIsOff…` (no request, no reading row), `…aClientIsTold…`; checked again before sending (`Ai.readDocument`) | ☑ |
| 6.7 | AI checks are advisory: they can flag an answer for review but never reject or accept it | `VerifierTest.documentChecksAreAdvisoryAndNeverCountTowardsConfidence`, `RuleValidationTest.documentRulesAreAdvisoryAndWellFormed` (both mutation-checked), V7 `verification_rules_ai_advisory`, `AiReadingIT.aiChecksNeverRejectAndNeverAcceptOnTheirOwn` | ☑ |
| 6.8 | Extracted values carry their source (quote, page) and are located in the document text where it has one | `test_reads_kind_and_fields_with_their_source`, `test_a_quote_that_is_not_in_the_document_is_not_located`, `test_a_text_value_must_be_part_of_its_quote`, `VerifierTest.aQuoteThatIsNotInTheDocumentFailsItsCheck`; retrieval keeps pages (`test_long_documents_go_through_retrieval_with_page_sources`) | ☑ |
| 6.9 | Documents are data: injection attempts in documents do not change the output's shape or the system's behaviour | Delimited untrusted content (`test_the_document_is_passed_as_delimited_untrusted_data…`), no tools (`test_sends_a_schema_constrained_request_without_tools`), closed enums; injection reported (`AiReadingIT.injectedInstructionsAreReported…`); eval gate `injectionsFollowed = 0` on four injection cases | ☑ |
| 6.10 | Tool proposals are validated against declared schemas and never executed by the AI service | `tools.py` catalogue; unknown tools and extra input rejected (`test_invalid_answers…`, `AiServiceClientTest`); proposals only shown as suggestions (`reading-view.tsx`, `ReadingView` test) | ☑ |
| 6.11 | The API authenticates to the AI service; failures are classified as retryable or not | `test_tasks_need_the_service_token` (constant-time, before the body), smoke test 401; classification `test_failures_are_classified`, `test_retryable_failures_are_the_transient_ones`, `AiReadingIT.retryableFailuresAreRetried…` (rate limit retried, refusal not); trace id logged (`test_the_callers_trace_id_is_logged`) | ☑ |
| 6.12 | Evaluation dataset and runner; CI runs it on the fake provider; a run against the real model is recorded | 16-case dataset, runner, CI gate on the fake provider (`test_evals.py`). Dataset, runner and CI gate done. The run against the real model is **deferred** (below): no provider key is available yet | ☑ (run deferred) |
| 6.13 | Threat model for AI document reading | `docs/security/threat-model-ai.md` | ☑ |

## Hardening record

- CI note (2026-10-20): GitHub Actions stopped starting jobs (account billing
  or spending limit). PR #42 itself merged with every CI check green; later
  evidence is from local runs of the same checks (`make check`, browser tests
  against a production build).

- Every check CI runs passed locally (`make check`): AI service 69 tests (ruff,
  mypy strict), API 78 unit and 145 integration tests, web 44 unit tests;
  browser journeys 4/4 against a production web build and the real AI service.
- Mutation checks: allowing a blocking AI rule, and counting AI checks in the
  confidence, are each caught by a failing test.
- Found and fixed while hardening: a reading spec serialized a computed
  property and failed to read back (renamed); a stored reading that cannot be
  parsed broke every view of its work (now shown as a failed reading); the
  image smoke test lacked the service token (added, plus a 401 check).
- Phase 1 deferrals closed: service-to-service authentication (ADR-029) and
  the API → AI trace (trace id propagated and logged; full OpenTelemetry SDK in
  the AI service is deferred below).

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| Vector database, embeddings | No retrieval use case beyond one document at a time (§51) | When one exists |
| Executing tool proposals through a tool gateway | Tool gateway, permissions and approval gates | Phase 7 |
| OpenTelemetry SDK in the AI service | One hop only; the trace id is propagated and logged on both sides | When the AI service makes more than one traced call |
| Reading office files (Word, Excel, PowerPoint) | Needs a converter dependency; PDF, images, text and CSV cover Phase 6 | When a team needs it |
| Re-reading already uploaded documents when reading is switched on | Readings start with the next verification of an answer | When asked for |
| **Evaluation run against the real model (6.12)** | No `ANTHROPIC_API_KEY` yet. The product owner asked to continue to later phases (2026-10-20). Production must not enable document reading for real clients until this run meets the ADR-032 thresholds | As soon as the key is in `.env`: `make ai-eval PROVIDER=claude`, store the report in `apps/ai/evals/reports/` and reference it here |
