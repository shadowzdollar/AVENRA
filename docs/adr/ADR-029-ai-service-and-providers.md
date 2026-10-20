# ADR-029: AI service and model providers

**Status:** Accepted (implements ADR-003)

## Context

ADR-003 requires business code to depend on an internal provider interface,
with adapters behind it, validated structured output and a record of every
call. Phase 1 left two items for the first AI capability: authentication
between the API and the AI service, and tracing across that hop. The AI service
owns no business data (Guidelines §6).

## Decision

- **Where the model is called.** Only `apps/ai` calls a model. The API calls the
  AI service for a named *task* (Phase 6: `document.read`); it never builds
  prompts or talks to a provider.
- **Provider interface** (`avenra_ai.providers.Provider`): one capability,
  `structured(request) -> result`. The request carries the system
  instructions, the content (text, a PDF or an image), a JSON schema and limits;
  the result carries the JSON, the model that answered, token usage, latency
  and the stop reason. `generate`, `embed` and `classify` are added when a task
  needs them (ADR-003 consequence: no speculative capabilities). Classification
  is a structured output.
- **Adapters:**
  - `claude`: the official `anthropic` SDK; default model `claude-sonnet-5-5`
    (**product decision**), configurable with `AI_MODEL`. Structured output
    through `output_config.format` (JSON schema). Server-side refusal fallback
    (`fallbacks: "default"`) is on; the model that actually answered is
    recorded. A refusal, a truncated answer or invalid JSON is an error, never
    a result.
  - `fake`: deterministic answers computed from the request, used by tests,
    CI and local work without a key. Selected with `AI_PROVIDER=fake`, the
    default when no key is configured. The API cannot tell the two apart.
- **Validation is the service's job.** The model's JSON is parsed into strict
  Pydantic models (`extra="forbid"`, bounded lengths, closed enums) and checked
  against the request (only fields that were asked for, only allowed labels).
  Output that fails is rejected with `INVALID_OUTPUT`; nothing partial is
  returned.
- **Prompts** are files in the service, one per task and version
  (`prompts/document_read/v1.md`). A task names its prompt and version; the
  service returns the name, version and SHA-256 of the exact text used, and the
  API records them. Changing a prompt means a new version and an evaluation run
  (ADR-032).
- **Tool proposals.** A task may let the model *propose* actions from a closed
  catalogue (Phase 6: `request_clearer_copy`, `flag_for_review`). Each tool
  declares its name, description, input schema and risk level (§45, §46). A
  proposal is validated against its tool's schema and returned as data; the AI
  service has no means to execute anything, and the API shows proposals to a
  person who acts through the normal application (§50). The tool gateway that
  can execute tools is Phase 7.
- **No model tools during reading.** The reading request declares no tools, so
  document text cannot cause a tool call (§48).
- **Service authentication.** The API sends `Authorization: Bearer
  <AI_SERVICE_TOKEN>`; the service compares it in constant time and refuses
  every task without it. The token is a secret in both services' environment,
  at least 32 bytes, never logged. The service still binds to loopback or the
  private network only.
- **Errors** are classified for the caller (§103): `RATE_LIMITED`,
  `PROVIDER_UNAVAILABLE` and `TIMEOUT` are retryable; `INVALID_OUTPUT`,
  `REFUSED`, `TRUNCATED`, `UNREADABLE_DOCUMENT` and `BAD_REQUEST` are not. The
  API's job retries only retryable ones.
- **Tracing.** The API propagates W3C `traceparent`; the AI service logs the
  trace id with every line and returns it, so a call is found from either side.
  The API records the call's span. A full OpenTelemetry SDK in the AI service is
  added when it has more than one hop to trace.

## Dependencies (Guidelines §99)

**`anthropic` (Python SDK).**
1. Needed: it is the supported client for the Claude API.
2. The existing stack could make raw HTTP calls, but the project rule is to use
   the official SDK where one exists; it handles retries, types and errors.
3. Maintained by Anthropic, frequent releases.
4. No known security advisories; it only makes outbound HTTPS calls.
5. Lock-in is contained: only the `claude` adapter imports it.
6. Pure Python on `httpx2` (already a dev dependency); no native code.

**`pypdf`.**
1. Needed: grounding checks need the text of a PDF to locate quotes (ADR-031).
2. The standard library cannot read PDFs.
3. Actively maintained, widely used.
4. Past advisories are denial-of-service on crafted files; mitigated by the
   upload size limit, a page limit, a time limit on extraction and the fact that
   only clean (scanned) files reach it.
5. No lock-in: it is used behind one function.
6. Pure Python, no native code.

## Alternatives

- **Call Claude from the Java API** — rejected: ADR-004 keeps AI work in the AI
  service; one place holds prompts, validation and evaluation.
- **An LLM framework as the abstraction** — rejected again (ADR-003): the
  interface is one method.
- **Tool use for structured output** — rejected for reading: it would give
  document text a tool to call; `output_config.format` constrains the answer
  without one.

## Consequences

- Swapping the model is configuration; swapping the provider is one adapter.
- Every capability added later goes through the same validation and records.
