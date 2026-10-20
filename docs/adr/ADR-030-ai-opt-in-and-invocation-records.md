# ADR-030: AI processing opt-in and invocation records

**Status:** Accepted

## Context

Reading a client's document with a model sends that document to a model
provider. Organizations decide what happens to their clients' data, so this
cannot be on by default. Guidelines §53 requires AI usage to be tracked per
organization, workflow, user, model and operation, with tokens, latency,
estimated cost, success and retries, before the product reaches scale.

## Decision

- **Opt-in per organization (product decision).** An `ai_settings` row per
  organization holds `document_reading` (off by default), who changed it and
  when. Changing it needs the permission `ai.manage`, which only the owner role
  has. Every change is audited (`ai.settings_changed`). While it is off, no
  document of that organization is sent to the AI service; the check is made in
  the job that sends it, not only when the job is created.
- **Client notice.** While it is on, the client's request page says that
  documents may be read automatically to check them, and that people at the
  organization make the decisions.
- **Invocation records.** Every call to the AI service, successful or not,
  writes one insert-only `ai_invocations` row: organization, purpose
  (`document.read`), subject (the document version), the user who caused it if
  any, provider, the model requested and the model that answered, prompt name,
  version and hash, input, output and cache-read tokens, latency, estimated
  cost in micro-US-dollars, outcome (`SUCCEEDED`, `REFUSED`, `INVALID_OUTPUT`,
  `TRUNCATED`, `FAILED`), error code, attempt number and trace id. The audit log
  records that a document was read (`ai.document_read`), pointing to the
  invocation.
- **Cost estimate.** The AI service knows provider prices (a table per model)
  and returns the estimate; unknown models report no estimate rather than a
  guess. The estimate is for observation, not billing.
- **Limits.** Each organization may make at most `avenra.ai.daily-call-limit`
  calls (default 500) per UTC day. Over the limit, reading is skipped and the
  check says so; nothing is retried until the next day. This bounds the cost of
  a runaway loop or an abusive client.
- **Visibility.** `ai.read` (owners and admins) lists the organization's
  invocations and today's totals.
- **Retention.** Invocation records keep no document content, prompt text or
  model output beyond what the reading stores; they are kept with the
  organization's other operational records.

## Consequences

- Turning reading off stops it immediately; readings already made remain as
  evidence of what was shown to people.
- Cost per organization, task and model can be answered from one table.
