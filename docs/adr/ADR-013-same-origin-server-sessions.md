# ADR-013: Same-origin access and server-side sessions

**Status:** Accepted (decided with the product owner, 2026-10-13)

## Context

ADR-011 left the session mechanism and CSRF strategy to Phase 2. Phase 1 let
the browser call the API directly across origins (CORS). Avenra handles
sensitive business data, so sessions must be revocable immediately and
credentials must not be readable by page scripts.

## Decision

- **Same origin.** The browser talks only to the web application's origin.
  The web server forwards `/api/*` to the API. Browsers never call the API's
  own origin, so CORS is not used for the product (it stays configurable but
  empty in shared environments).
- **Server-side sessions.** Signing in creates a session row in PostgreSQL.
  The browser receives an opaque, random 256-bit token in a cookie:
  `__Host-avenra_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`,
  no `Domain`. Only a SHA-256 hash of the token is stored, so a database
  leak does not yield usable sessions.
- **Lifetime.** Idle timeout and absolute lifetime are configurable (defaults:
  4 hours idle, 7 days absolute). Sign-in always creates a new session
  (no fixation). Sign-out, password change and "sign out everywhere" revoke
  sessions immediately.
- **CSRF.** State-changing requests require a CSRF token (Spring Security's
  double-submit cookie pattern: a readable `XSRF-TOKEN` cookie echoed in an
  `X-XSRF-TOKEN` header), on top of `SameSite=Lax` and an `Origin` check.
- **Sessions are business state** and live in PostgreSQL (Guidelines §8:
  Redis is never the source of truth).

## Alternatives

- **Browser → API directly with cookies** — rejected: needs CORS with
  credentials and cross-site cookies; weaker CSRF posture.
- **JWT access + refresh tokens** — rejected for the web app: revocation is
  hard and tokens are exposed to scripts. Token-based access for third-party
  API clients can be added later as a separate mechanism.

## Consequences

- One public origin per environment; the API can stay on a private network.
- The web server is in the request path for API calls and must forward
  headers (request id, trace context) and enforce body limits.
- Local development uses `http://localhost`, which browsers treat as a secure
  context, so `Secure` and `__Host-` cookies work locally.
