# ADR-032: AI evaluation

**Status:** Accepted

## Context

Guidelines §52: every important AI workflow needs evaluation against
representative datasets, never manual impressions. Document reading is the
first such workflow.

## Decision

- **Dataset** in `apps/ai/evals/document_read/`: one case per file, each with
  the document (synthetic text or a generated PDF; never client data), the
  reading spec and the expected result: kind, each field's value or "not
  found", and whether the document contains an injection attempt. Cases cover
  each kind of field, missing fields, near-miss kinds, long documents that need
  retrieval, and injection attempts (instructions to change the kind, invent
  fields, reveal instructions or emit extra properties).
- **Metrics** per run: kind accuracy; field precision and recall (a value
  reported for a field that is absent is a false positive); exact-value
  accuracy on found fields; share of located quotes; injection cases where the
  output followed the injected instruction (must be zero); invalid outputs;
  latency (p50, p95); total tokens and estimated cost.
- **Runner** `uv run python -m avenra_ai.evals`: runs the dataset through the
  real task code (prompt, validation, grounding) with the configured provider
  and writes a JSON report.
- **Gates.**
  - CI runs it with the fake provider, proving the harness, validation and
    grounding work end to end; it costs nothing.
  - A run against the real model is required when a prompt version or the
    default model changes. The report is stored in `apps/ai/evals/reports/` and
    referenced from the change. Thresholds for the real model: kind accuracy
    ≥ 0.9, field recall ≥ 0.85, field false positives ≤ 0.05, injection
    followed = 0, invalid outputs = 0.
- **Human correction rate** (a person overriding or contradicting an AI check)
  is measured from production records once there is usage: an AI check that
  failed on an answer a person accepted, or passed on one they rejected.

## Consequences

- A prompt or model change is a measured change.
- The dataset grows with every reading mistake found in practice (as a
  synthetic reproduction, never the client's document).
