# ADR-003: AI provider abstraction

**Status:** Accepted (implemented in Phase 6)

## Context

AI models and providers change quickly. Avenra's moat must not depend on any
single model (Master Project §41). Provider-specific assumptions spread through
business code would make changing providers a rewrite (Guidelines §42).

## Decision

- Business code depends only on an internal provider interface with
  capabilities such as `generate`, `structuredOutput`, `embed`, `classify`.
- Provider adapters live in infrastructure code behind that interface.
- Every AI call is recorded as an `AIInvocation` (model, tokens, latency,
  estimated cost, outcome, organization, workflow) for cost control and
  evaluation (§53).
- AI output is always validated against a schema before use and is never
  treated as verified truth or as authorization (§43, §129).

## Alternatives

- **Call one provider's SDK directly from business code** — rejected: lock-in
  and provider assumptions everywhere.
- **Adopt a third-party LLM framework as the abstraction** — deferred: may be
  used inside an adapter, but the business-facing interface stays ours.

## Consequences

- Swapping or adding a provider touches only an adapter.
- The abstraction must stay small; capabilities are added when a real workflow
  needs them, not speculatively.
