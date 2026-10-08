# ADR-005: Multi-tenant model

**Status:** Accepted (implemented in Phase 2)

## Context

Every customer organization is a tenant. Cross-tenant data leakage is a
critical security failure (Master Project §29). Isolation must exist at
several layers (Guidelines §37).

## Decision

- **Shared database, shared schema.** Tenant-owned tables carry
  `organization_id` (unless ownership is inherited from a parent row that does).
- **Users belong to organizations through memberships** with roles; there is no
  `user.organization_id` (§17). One user may belong to several organizations.
- **Tenant context is established server-side** from the authenticated
  identity and the requested organization, checked against membership. A
  tenant id supplied by the client is never trusted on its own (§16).
- **Defense in depth:**
  1. Application authorization on every protected operation:
     identity → membership → permission → resource access → action policy (§36).
  2. PostgreSQL Row-Level Security on tenant-owned tables, driven by a
     transaction-scoped setting for the current organization. The application
     connects with a role that cannot bypass RLS; migrations run with a
     separate owner role.
  3. Tenant-prefixed cache keys (`tenant:{organizationId}:...`), tenant-scoped
     storage paths, tenant-scoped integration credentials, and
     `organizationId` in structured logs.
- **Mandatory automated isolation tests** for every tenant-owned resource
  (§137).

## Alternatives

- **Schema per tenant** — rejected for now: migration and connection overhead
  for many small tenants; may be offered later for Enterprise isolation.
- **Database per tenant** — rejected for now; a possible Enterprise
  "dedicated deployment" option later.
- **Application checks only, no RLS** — rejected: one missed check would leak
  data.

## Consequences

- RLS must be set per transaction, which works correctly with connection
  pooling; this is verified by integration tests.
- Every new tenant-owned table needs `organization_id`, an RLS policy and
  isolation tests; this is part of the Definition of Done.
