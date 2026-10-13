# ADR-016: Rate limiting

**Status:** Accepted

## Context

Guidelines §67 requires rate limits on authentication, password reset,
public endpoints, expensive operations and administrative operations,
tenant-aware where appropriate. Phase 1 declared limits in the contract
(`x-avenra-rate-limit`) without enforcing them.

## Decision

- **Token-bucket limits stored in Redis**, shared by all API instances
  (Guidelines §8 permits rate limiting in Redis; losing Redis loses only
  counters, never business data).
- Each contract operation names a policy in `x-avenra-rate-limit`; the API
  enforces the named policy. A contract test checks that every declared
  policy exists.
- Keys combine the policy with the client network address and, for
  credential endpoints, the normalized email address, so one attacker cannot
  lock out a user and one address cannot spray many accounts. Keys are
  tenant-prefixed where a tenant is known (ADR-005).
- Exceeded limits return `429 RATE_LIMITED` with `Retry-After`.
- **If Redis is unavailable**, credential endpoints fail closed (deny) and
  other endpoints fail open, with an error log and a metric.

## Alternatives

- **In-memory limits** — rejected: not shared between instances.
- **Limits only at a gateway** — not available yet; can be added in front later.

## Consequences

- The API depends on Redis for sign-in availability; Redis health becomes
  part of readiness.
