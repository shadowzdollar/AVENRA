# ADR-004: Central agent orchestrator with a tool gateway

**Status:** Accepted (implemented in Phase 7, ADR-033)

## Context

Agentic systems introduce risks beyond normal web applications: goal
hijacking, tool misuse, privilege abuse, memory poisoning and cascading
failures (Guidelines §48, §63). Avenra must remain governed, traceable and
stoppable (§130).

## Decision

- A single **orchestrator** coordinates specialized capabilities
  (information, verification, planning) instead of free-running autonomous
  agents (§44).
- All external effects go through a **tool gateway**. Every tool declares:
  name, description, input and output schema, required permissions, risk level
  (LOW/MEDIUM/HIGH/CRITICAL), audit requirements, timeout, retry policy and
  idempotency behavior (§45, §46).
- Each agent execution runs with an explicit runtime context: organization,
  user context, work, allowed tools, allowed resources, policy, budget,
  timeout, trace id (§130). Exceeding the budget stops execution, records the
  reason, raises an exception and requests a human (§131).
- The authorization system decides independently whether any proposed action
  is allowed: **model output ≠ authorized action** (§129).
- External content (documents, emails, integration payloads) is untrusted data
  and never becomes an instruction source (§48).

## Alternatives

- **Multiple autonomous agents negotiating with each other** — rejected:
  hard to permission, trace and stop.
- **Let the model act with the user's full permissions** — rejected (§47).

## Consequences

- Permissions, tracing, policy and failure handling are enforced in one place.
- Adding a capability means adding a governed tool, never giving the model a
  raw URL or command.
