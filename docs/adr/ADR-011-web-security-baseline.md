# ADR-011: Web security baseline before authentication

**Status:** Accepted

## Context

Phase 1 requires secure headers, a CORS policy, request size limits and a
structured error format (Guidelines §34, §71). Authentication and
authorization arrive in Phase 2. If the HTTP security layer were improvised
now (custom header filters) and replaced by Spring Security in Phase 2, the
behavior would change twice and the Phase 1 tests would have to be rewritten.

## Decision

- **Spring Security is introduced in Phase 1** to own headers, CORS and the
  default access policy. Phase 2 adds authentication to the same filter chain.
- **Deny by default.** Every request is denied unless explicitly permitted.
  In Phase 1 only the health endpoints and the error dispatch are permitted.
  Unauthenticated requests get `401 AUTHENTICATION_REQUIRED`, including for
  paths that do not exist, so endpoints cannot be enumerated.
- **No generated default user.** Spring Boot's fallback user (whose password
  is printed to the log) is disabled.
- **Stateless:** no HTTP session and no saved-request cache.
- **CSRF protection stays enabled** until Phase 2 decides the session
  mechanism (cookie or token) and with it the CSRF strategy.
- **Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`,
  `Referrer-Policy: no-referrer`, a restrictive `Permissions-Policy`,
  `Cache-Control: no-store`, and HSTS (sent on HTTPS only, one year, including
  subdomains).
- **CORS:** only origins listed explicitly in configuration
  (`avenra.web.allowed-origins`). Wildcards are rejected at startup.
- **Request bodies** are limited (`avenra.web.max-request-body-size`, default
  1 MB), both by declared `Content-Length` and by counting streamed bytes.
  Upload endpoints will get their own limits when they are added.
- **Health:** `/health/liveness` (process alive) and `/health/readiness`
  (ready for traffic, includes the database) are public and expose no details.

## Alternatives

- **Custom header and CORS filters now, Spring Security in Phase 2** —
  rejected: double work and a behavior change between phases.
- **Allow by default until Phase 2** — rejected: a forgotten endpoint would be
  public.

## Consequences

- Every new endpoint must be explicitly permitted, which happens with its
  authorization rule in Phase 2 and later.
- Security headers and CORS are tested from Phase 1 onwards.
