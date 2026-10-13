# Threat model: identity and tenancy (Phase 2)

**Scope:** accounts, passwords, sessions, MFA, organizations, memberships,
invitations, and the same-origin path from browser to API.
**Method:** STRIDE per component; each threat names its control and the test
that proves the control. Reviewed 2026-10-13.

## Assets

- Account credentials (passwords, TOTP secrets, recovery codes)
- Session tokens
- Organization data and membership (the tenant boundary)
- Email links (verification, reset, invitation tokens)
- The audit trail

## Trust boundaries

1. Browser → web server (public internet, TLS)
2. Web server → API (`/api/*` forwarding, private network, ADR-013)
3. API → PostgreSQL (runtime role without schema rights or RLS bypass)
4. API → Redis (rate-limit counters only)
5. API → SMTP provider (outbound email)

## Threats and controls

| # | Threat (STRIDE) | Control | Evidence |
|---|---|---|---|
| T1 | **Spoofing:** credential stuffing / password guessing | Argon2id; per-caller and per-account rate limits; credential policies fail closed when Redis is down | `RateLimitIT`, `RateLimiterFailureModeTest` |
| T2 | **Spoofing:** account enumeration via responses or timing | Identical responses for registered/unknown emails; dummy hash on unknown accounts; `EMAIL_NOT_VERIFIED` only after a correct password | `IdentityFlowIT.EnumerationResistance` |
| T3 | **Spoofing:** session theft by script (XSS) | Session cookie `HttpOnly`; nonce CSP without `unsafe-inline`/`unsafe-eval`; no `dangerouslySetInnerHTML` (lint) | `IdentityFlowIT.Sessions`, CSP unit tests, e2e zero CSP violations |
| T4 | **Spoofing:** session fixation / subdomain cookie injection | New session per sign-in; `__Host-` prefix (Secure, Path=/, no Domain) | `IdentityFlowIT.theSessionCookieIs…` |
| T5 | **Tampering:** cross-site request forgery | Double-submit CSRF token + Origin check + SameSite=Lax; login CSRF covered (sign-in requires the token) | `ContractConformanceIT` (CSRF, foreign origin) |
| T6 | **Spoofing:** stolen session used for long | Idle (4 h) and absolute (7 d) expiry; revoke one / everywhere else; password change and reset revoke sessions | `IdentityFlowIT.Sessions` |
| T7 | **Spoofing:** MFA bypass or code replay | Session created only after the second step; codes single-use (last step stored); limited attempts per challenge; recovery codes hashed and single-use | `IdentityFlowIT.MultiFactor`, `TotpTest` |
| T8 | **Information disclosure:** database leak exposes secrets | Only hashes of tokens and recovery codes; Argon2id passwords; TOTP secrets AES-256-GCM encrypted with keys outside the database, bound to the user id | `IdentityFlowIT.passwordsAreStored…`, `SecretBox` design |
| T9 | **Elevation of privilege:** cross-tenant access through the API | One access path (membership → permission → tenant scope); non-members get 404 | `OrganizationAccessIT.tenantACannotSeeOrTouchTenantB` |
| T10 | **Elevation of privilege:** cross-tenant access through an application bug | Row-level security as the runtime role; tenant settings are transaction-scoped | `RowLevelSecurityIT` (with mutation check) |
| T11 | **Elevation of privilege:** role escalation | Explicit permissions; only owners manage owners; roles assignable only at or below one's own; last-owner rule | `OrganizationAccessIT` |
| T12 | **Spoofing:** invitation token forwarded or leaked | Acceptance requires a signed-in user whose verified email matches; tokens single-use and expiring | `OrganizationAccessIT.anInvitation…` |
| T13 | **Tampering:** open redirect after sign-in (phishing) | Only same-origin paths accepted as `next` | `session.test.ts` |
| T14 | **Repudiation:** denying an action | Append-only audit events (database role cannot update or delete) with request and trace ids | `RowLevelSecurityIT.auditEvents…`, `IdentityFlowIT.Auditing` |
| T15 | **Information disclosure:** secrets in logs | No query strings or bodies logged; passwords never in audit details; generated-password fallback disabled | `StructuredLoggingIT`, `IdentityFlowIT.Auditing` |
| T16 | **Denial of service:** Argon2 cost as an amplifier | Rate limits before hashing; request size limits | `RateLimitIT` |
| T17 | **Tampering:** duplicate side effects on retry | Idempotency keys for organization creation and invitations | `OrganizationAccessIT.creatingWithTheSame…` |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| Email lost if the process crashes between commit and send | Accepted until Phase 4 (durable jobs); users can re-request | Phase 4 (ADR-015) |
| No breached-password check against external corpora (only a bundled common list) | Accepted for now; an online k-anonymity check sends data to a third party and needs a product decision | Before first customer pilot |
| Per-IP limits rely on correct `X-Forwarded-For` from the web server | Tomcat trusts forwarding headers only from internal proxy addresses; must be verified behind the production load balancer | Phase 13 |
| `Secure`/HSTS behaviour only provable over real TLS | Configured; verified in deployment | Phase 13 |
| No WebAuthn/passkeys; no organization-enforced MFA | Planned (ADR-017) | After customer evidence |
| Organization deletion and account deletion not implemented | Data-retention design needed (Guidelines §113) | Phase 10 |
