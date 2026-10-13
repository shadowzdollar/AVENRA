# Phase 2: Identity

**Status:** Complete (2026-10-13)
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
| 2.1 | ADRs for session model/CSRF, password hashing, email, rate limiting, MFA | ADR-013 (with product owner), ADR-014, ADR-015, ADR-016, ADR-017 (with product owner) | ☑ |
| 2.2 | All identity and organization operations defined in the contract first; lint and conformance pass | Contract defines 29 operations first (ADR-008); lint, alias guard and rule self-test pass; `ContractConformanceIT` checks implementation, public endpoints in both directions, CSRF and Origin rejection, response schemas and rate-limit policies | ☑ |
| 2.3 | Passwords hashed with a modern adaptive algorithm; never logged or returned | Argon2id (`{argon2id}` prefix asserted in the database, plaintext absent); NIST policy incl. common-word-plus-digits; passwords absent from responses and audit details (`IdentityFlowIT`, `PasswordPolicyTest`) | ☑ |
| 2.4 | Email verification and password reset use single-use, expiring, hashed tokens | 256-bit tokens stored as SHA-256; atomic single use; latest-only; expiry (`IdentityFlowIT`: verification and reset tokens) | ☑ |
| 2.5 | Sessions: secure cookie flags, rotation on sign-in, revocation, idle and absolute expiry | `__Host-` HttpOnly Secure SameSite=Lax cookie asserted; new session per sign-in; sign-out, revoke one, sign out everywhere else, revoke on password change/reset; idle expiry (`IdentityFlowIT.Sessions`) | ☑ |
| 2.6 | CSRF protection matches the session model | Double-submit CSRF token plus Origin check; requests without token answer `CSRF_TOKEN_INVALID`, foreign origins `ORIGIN_NOT_ALLOWED` (`ContractConformanceIT`) | ☑ |
| 2.7 | Optional TOTP MFA: enrol, verify, recovery codes, required at sign-in when enabled | RFC 6238 vectors (`TotpTest`); enrol, activate, two-step sign-in, no code replay, single-use recovery codes, secret AES-GCM encrypted and bound to the user (`IdentityFlowIT.MultiFactor`) | ☑ |
| 2.8 | Roles map to explicit permissions; every protected endpoint declares and checks one | Roles map to permissions (`Role`, §18); every contract operation declares `x-avenra-permission`; allowed and denied cases per role (`OrganizationAccessIT`) | ☑ |
| 2.9 | Tenant context set server-side only; client-supplied tenant ids are validated against membership | Tenant scope set only after the membership check (`OrganizationAccess`); organization ids in paths grant nothing (`OrganizationAccessIT`: 404 for non-members) | ☑ |
| 2.10 | Row-level security on every tenant-owned table, proven with the runtime role | `RowLevelSecurityIT` as the runtime role without the application; mutation check (weakened policies) failed 4 of 7 tests | ☑ |
| 2.11 | Tenant isolation tests (§137): A cannot read, modify or list B's data, through the API and directly in the database | API level (`OrganizationAccessIT.tenantACannotSeeOrTouchTenantB`) and database level (`RowLevelSecurityIT`) | ☑ |
| 2.12 | Rate limits on sign-in, sign-up, password reset and invitations; tenant-aware where relevant | Contract policies enforced per caller; per-account sign-in limit (`RateLimitIT`: 429 + Retry-After, other accounts unaffected); credential policies fail closed (`RateLimiterFailureModeTest`) | ☑ |
| 2.13 | Account enumeration resistant: sign-in, sign-up and reset responses do not reveal whether an email exists | Identical status and body for registered vs unknown emails in sign-up, reset, resend; identical sign-in failures with equal hashing effort (`IdentityFlowIT.EnumerationResistance`) | ☑ |
| 2.14 | Audit events for sign-in success/failure, password and MFA changes, membership and role changes | Append-only `audit_events` (update/delete denied, `RowLevelSecurityIT`); sign-in success/failure, sign-up, verification, password, MFA, session, membership, invitation events (`IdentityFlowIT.Auditing`) | ☑ |
| 2.15 | Web flows work end to end in a browser | Playwright in Chrome (`apps/web/e2e/identity.spec.ts`): sign-up, confirmation from the real email in Mailpit, sign-in, organization, invitation accepted by a colleague with member permissions, sign-out; zero CSP violations or script errors; run against the API with no CORS origins (production-like). Also runs in CI against the production images | ☑ |
| 2.16 | Security review of the phase recorded (threat model for identity) | `docs/security/threat-model-identity.md`: 17 STRIDE threats, each with its control and proving test; accepted and open risks with revisit points | ☑ |
| 2.17 | CI green; hardening pass recorded | CI run [38404751925](https://github.com/shadowzdollar/AVENRA/actions/runs/38404751925): all 10 jobs green on the first run, including the browser e2e against the production images; hardening record below | ☑ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| OAuth/OIDC sign-in and enterprise SSO | Guidelines §35: "later" | After customer evidence (field phase) |

## Hardening record

Phase 2 Guidelines sections re-read and checked against the code on
2026-10-13.

| Section | Rule | Result |
|---|---|---|
| §16 | Tenant id never trusted from the client; context set server-side | Met. Organization ids in paths only select; membership is checked first (`OrganizationAccess`) |
| §17 | Users belong to organizations through memberships | Met. Users are global; a user can hold several memberships |
| §18 | Five roles, capability-based permissions, no role checks in business code | Met. `Role` → `Permission`; services ask for permissions only |
| §35 | Email/password, hashing, verification, reset, sessions, optional MFA | Met (ADR-013/014/017). OAuth/OIDC and SSO deferred as the Guidelines allow |
| §36 | identity → membership → permission → resource → policy | Met. Resource checks inside services (e.g. target membership in the same organization); policies (role assignment, last owner) |
| §37 | Isolation at application, database, cache, logging layers | Met for existing layers: API, RLS, rate-limit keys hashed and namespaced, `userId` in logs. Storage and integration isolation arrive with those features |
| §59 | Audit for important actions, append-only | Met. Database role cannot update or delete audit rows |
| §64–§67 | Validation at boundaries; rate limiting | Met. Contract validation, password policy, invitation email binding; rate limits per contract operation plus per account |
| §71–§72 | API and frontend security | Met. CSRF, Origin check, error-format CORS rejection, nonce CSP, open-redirect guard |
| §137 | Mandatory tenant isolation tests | Met at API and database level (mutation-checked) |

Findings fixed during the phase, before merge:

- RLS read policies initially applied to all commands, so a user could have
  modified their own membership row in another organization at database level;
  restricted to `SELECT` with separate write policies (self-review, then proven
  by `RowLevelSecurityIT` and a mutation check).
- The generated contract contained YAML aliases that the Java generator's
  parser rejects; contract rewritten and an alias guard added.
- `password1234` passed the password policy (exact-match common list only);
  common words with digits/symbols appended and repeated characters are now
  rejected.
- CORS rejections answered in plain text; now the platform error format.
- A configuration edit had nested the health groups under the mail setting;
  caught by reading the parsed YAML.
- The contract's sign-in description contradicted the agreed behaviour; fixed.
- Dependabot proposed updates that conflict with ADRs (TypeScript 7, ESLint 10,
  Java 27, Node 26, a Python release candidate); ignore rules follow in a
  separate change.
