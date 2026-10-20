# Threat model: AI document reading (Phase 6)

**Scope:** the AI service (`apps/ai`), the API's `ai` module, document readings
and the advisory rules that use them (ADR-029 to ADR-032). Builds on the
threat models for documents and requests, execution and verification.
**Method:** STRIDE per component, plus the OWASP agentic risks Guidelines §48
names (goal hijacking, tool misuse, privilege abuse). Each threat names its
control and evidence. Reviewed 2026-10-20.

## Assets

- Clients' documents (personal and financial data)
- The integrity of decisions on answers
- The organization's choice about whether its documents go to a model provider
- AI spending
- The service token and the model provider key

## Data flow

Browser → API (session, permissions) → job in the organization's scope →
AI service (service token, private network) → model provider (provider key).
Only the API calls the AI service; only the AI service calls the provider. The
reading comes back through the same path and is validated twice.

## Threats and controls

| # | Threat (STRIDE / agentic) | Control | Evidence |
|---|---|---|---|
| A1 | **Information disclosure:** documents sent to a provider without the organization's consent | Off by default; only `ai.manage` (owners) switches it on; checked when a reading is scheduled and again before sending; the client is told on the request page | `AiReadingIT.nothingIsSentWhileReadingIsOff…`, `…readingIsOffUntilAnOwner…` (admin refused), `…aClientIsTold…` |
| A2 | **Goal hijacking:** a document instructs the model to report another kind, invent values or act | Document passed only as delimited untrusted data after trusted instructions; delimiter cannot be closed by the document; no tools in the request; output constrained to a schema of closed enums built from the team's rules; suspected instructions reported to the person | `test_document_read.py` (delimiter, enums, injection reported), `test_claude_provider.py` (no tools), eval injection cases (`injectionsFollowed` = 0 gate) |
| A3 | **Tampering:** model output treated as truth or as authority | Output validated strictly by the AI service and again by the API; AI rules are advisory only (application and database constraint); excluded from confidence; never reject or accept | `test_invalid_answers_are_rejected_whole`, `AiServiceClientTest`, `VerifierTest.documentChecksAreAdvisory…`, `RuleValidationTest.documentRulesAreAdvisory…` (both mutation-checked), `AiReadingIT.aiChecksNeverReject…`, V7 `verification_rules_ai_advisory` |
| A4 | **Tampering:** a fabricated value with a plausible quote | Quotes are located in the document's own text and text values in their quote; a check whose passage is not found fails (advisory) with that reason; images are marked as not locatable | `test_a_quote_that_is_not_in_the_document…`, `VerifierTest.aQuoteThatIsNotInTheDocument…` |
| A5 | **Tool misuse / privilege abuse:** the model triggers an action | Proposals only from a closed catalogue, validated against each tool's schema, returned as data; neither service can execute them; a person acts through the application | `tools.py`, `test_invalid_answers…` (unknown tool, extra input), `AiServiceClientTest` |
| A6 | **Spoofing:** someone other than the API calls the AI service | Bearer service token (≥ 32 bytes) compared in constant time; refused before the body is read; the service listens on loopback or the private network only | `test_tasks_need_the_service_token`, smoke test (401 without token) |
| A7 | **Information disclosure:** secrets or documents in logs | The service token and provider key are secrets, excluded from settings' string forms; provider error messages are not kept (class and status only); document content and model output are never logged | `test_error_details_never_quote…`, `test_the_callers_trace_id_is_logged` (no content in logs), `AiServiceClientTest.theServiceToken…`, `test_claude_is_chosen…` (key not in repr) |
| A8 | **Denial of service / cost:** a runaway loop or abusive client drives up spending | Daily call limit per organization, checked before sending; one reading per document version and spec; retries only for transient failures, bounded attempts; every call recorded with cost | `AiLimitIT`, `AiReadingIT.retryableFailuresAreRetried…` |
| A9 | **Denial of service:** a crafted PDF hangs the AI service | Only clean (scanned) files are sent; size limit; page limit 200; 20-second text-extraction limit | `documents.py`, `test_a_broken_pdf_is_unreadable…` |
| A10 | **Repudiation:** nobody knows what the model was asked or answered | Insert-only invocation record per call (model requested and used, prompt name, version and hash, tokens, cost, outcome, attempt, trace id); readings settle once and are kept; audit `ai.document_read`, `ai.settings_changed` | `AiReadingIT.aReadingIsRecorded…`, `…readingsAndInvocationsCannotBeRewritten` |
| A11 | **Information disclosure:** readings or usage of another tenant, or seen by the client | Row-level security on all three tables; a request link may read only whether reading is on; readings never appear in the client's view | `WorkRowLevelSecurityIT` (all three tables), `AiReadingIT.aClientIsTold…` |
| A12 | **Tampering:** a refused or failed reading silently becomes a pass | Refusals, truncation and invalid output are errors, never results; the check stays skipped with the reason | `test_failures_are_classified`, `AiReadingIT.invalidAnswers…` |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| A clever injection could still bias a value within the schema (e.g. a wrong but well-formed date with a real-looking quote) | Accepted: grounding catches invented passages, and every AI check is advisory, so the worst case is a misleading hint to a person | Ongoing; new eval cases for every miss |
| The model provider processes document content | Organization opt-in and client notice; provider data handling follows the provider's terms | Phase 12 (compliance: data processing agreements, regions) |
| The reading job holds a database transaction during the AI call (up to the call timeout) | Accepted at current scale: four job slots, a 5-minute lease | When reading volume grows |
| The self-reported kind confidence is shown but not verified | Shown only as the model's own estimate; it decides nothing | — |
