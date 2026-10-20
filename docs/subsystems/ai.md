# AI document reading

Reads what a client's document says, as advice for the people who decide
(ADR-029 to ADR-032). Code: `apps/ai` (the AI service), `apps/api/.../ai`
(setting, calls, records), `apps/api/.../document/DocumentReadings` and
`ReadingJob` (readings), the `DOCUMENT_KIND` and `DOCUMENT_FIELD` rules in
`verification`; schema `V7__ai_foundation.sql`.

## Purpose and responsibilities

- Tell the team what kind of document it is and the fields its rules ask for,
  each with the passage it came from.
- Never decide: AI checks flag answers for a person, never reject or accept.
- Only read documents of organizations whose owner switched reading on.
- Record every model call: model, prompt version, tokens, latency, cost.

## Inputs and outputs

- **In:** a clean document version (PDF, PNG, JPEG, text, CSV) and a reading
  spec from the requirement's rules (kind labels; fields with their kind).
- **Out:** a reading (kind, fields with value, quote, page and whether the
  quote was located, suspected instructions, proposals) stored once per version
  and spec; advisory check results; an invocation record per call.

## How it works

1. A document answer is verified. If its rules need a reading, the API looks for
   one; in the organization's scope it schedules a `document.read` job when
   there is none (and reading is on, the file is clean and of a readable type).
   Until it arrives, the AI checks are skipped with the reason.
2. The job sends the file to the AI service with the spec. The service extracts
   the text (PDFs with a text layer; long texts through lexical retrieval), or
   sends the file itself (images, scans), with the versioned prompt, to the
   provider (Claude Sonnet 5.5 by default) with a JSON-schema output format.
3. The service validates the answer strictly against the request, locates each
   quote in the text and returns the reading with its invocation (model, prompt
   hash, usage, cost). The API validates it again, records the invocation in a
   transaction of its own, and settles the reading once.
4. The settled reading re-verifies the answer. AI checks pass, fail (advisory)
   or stay skipped; they never count towards confidence.

## Dependencies

AI service → model provider (Anthropic API). API → AI service (HTTP, service
token). PostgreSQL (job engine, records). The fake provider removes the
provider dependency for tests, CI and local work without a key.

## Security

See `docs/security/threat-model-ai.md`. In short: opt-in per organization,
documents are data (delimited, no tools, closed output schema), double
validation, grounding, advisory only, service token, daily limit, insert-only
records.

## Failure modes

| Failure | Behaviour |
|---|---|
| Reading switched off | Checks skipped: "switched off"; nothing sent |
| Daily limit reached | Reading skipped with the reason; nothing sent until the next UTC day |
| Provider rate limited, unavailable, timed out | Job retried (4 attempts); each attempt recorded |
| Refusal, truncated or invalid answer | Reading failed with a reason; recorded; not retried |
| Unreadable or unsupported file | Reading failed or skipped with the reason |
| AI service down or token wrong | Retryable (down) or failed (token); visible in usage and logs |
| Job dead-lettered | Reading stays pending; `JOB_FAILED` exception raised on the work |

## Operations

- Metrics: `avenra.ai.invocations` (purpose, outcome), `avenra.ai.cost.micros`
  (model), `avenra.ai.limited`. Usage per organization: organization page.
- Configuration: API `AVENRA_AI_URL`, `AVENRA_AI_SERVICE_TOKEN`,
  `AVENRA_AI_DAILY_CALL_LIMIT`; AI service `AVENRA_AI_SERVICE_TOKEN`,
  `ANTHROPIC_API_KEY`, `AVENRA_AI_MODEL`, `AVENRA_AI_EFFORT`.
- Changing the prompt or default model: new prompt version, then
  `make ai-eval PROVIDER=claude` (costs money) and store the report (ADR-032).
