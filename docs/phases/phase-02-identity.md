# Phase 2: Identity

**Status:** Planned
**Guidelines:** §16–§18, §35–§37, §59, §63–§67, §71–§72, §137, §143

## Goal

People can sign up, verify their email, sign in safely, belong to one or more
organizations with a role, and invite others. Every request runs in a
server-established tenant context, every protected operation checks an
explicit permission, and tenant isolation is proven at the application,
database (row-level security), cache and log layers.

## Steps

1. Decisions as ADRs: session model and CSRF strategy (Phase 1 open question:
   browser → API directly or through the web server), password hashing,
   email delivery, rate limiting, MFA scope
2. Contract first: authentication, session, organization, membership and
   invitation operations in `packages/contracts`
3. Database: users, credentials, sessions, email verification and password
   reset tokens, organizations, memberships, invitations; row-level security
   on every tenant-owned table; `organization_id` everywhere it belongs
4. Identity module: sign-up, email verification, sign-in, sign-out, session
   listing and revocation, password reset, optional TOTP MFA
5. Organization module: create organization, membership, roles (Owner, Admin,
   Manager, Member, Viewer) mapped to explicit permissions (§18)
6. Tenant context: established server-side from the session and validated
   membership, set per transaction for row-level security, carried in cache
   keys and logs (ADR-005)
7. Authorization: one permission check path (identity → membership →
   permission → resource → policy, §36); no role checks in business code
8. Invitations: invite by email, accept, change role, remove member, with the
   last-owner rule
9. Rate limiting (deferred from Phase 1): sign-in, sign-up, password reset,
   invitations, and the `x-avenra-rate-limit` declarations in the contract
10. Audit events for every identity and membership change (§59; append-only)
11. Web: sign-up, sign-in, verification, reset, organization switcher,
    members and invitations
12. Hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 2.1 | ADRs for session model/CSRF, password hashing, email, rate limiting, MFA | `docs/adr/` | ☐ |
| 2.2 | All identity and organization operations defined in the contract first; lint and conformance pass | CI | ☐ |
| 2.3 | Passwords hashed with a modern adaptive algorithm; never logged or returned | Unit + log tests | ☐ |
| 2.4 | Email verification and password reset use single-use, expiring, hashed tokens | Integration tests | ☐ |
| 2.5 | Sessions: secure cookie flags, rotation on sign-in, revocation, idle and absolute expiry | Integration tests | ☐ |
| 2.6 | CSRF protection matches the session model | Integration tests | ☐ |
| 2.7 | Optional TOTP MFA: enrol, verify, recovery codes, required at sign-in when enabled | Integration tests | ☐ |
| 2.8 | Roles map to explicit permissions; every protected endpoint declares and checks one | Contract `x-avenra-permission` + conformance test + allowed/denied tests | ☐ |
| 2.9 | Tenant context set server-side only; client-supplied tenant ids are validated against membership | Integration tests | ☐ |
| 2.10 | Row-level security on every tenant-owned table, proven with the runtime role | Integration tests that bypass the application layer | ☐ |
| 2.11 | Tenant isolation tests (§137): A cannot read, modify or list B's data, through the API and directly in the database | Integration tests | ☐ |
| 2.12 | Rate limits on sign-in, sign-up, password reset and invitations; tenant-aware where relevant | Integration tests | ☐ |
| 2.13 | Account enumeration resistant: sign-in, sign-up and reset responses do not reveal whether an email exists | Integration tests | ☐ |
| 2.14 | Audit events for sign-in success/failure, password and MFA changes, membership and role changes | Integration tests | ☐ |
| 2.15 | Web flows work end to end in a browser | End-to-end test | ☐ |
| 2.16 | Security review of the phase recorded (threat model for identity) | `docs/security/` | ☐ |
| 2.17 | CI green; hardening pass recorded | CI, this file | ☐ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| OAuth/OIDC sign-in and enterprise SSO | Guidelines §35: "later" | After customer evidence (field phase) |

## Hardening record

_To be completed at phase close._
