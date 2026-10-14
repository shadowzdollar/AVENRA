# ADR-020: Client request links

**Status:** Accepted (decided with the product owner, 2026-10-13) — token storage amended by ADR-025 (encrypted copy for reminders)

## Context

The wedge is collecting information from clients (Master Project §11–§12).
Clients should not need an Avenra account to answer a request. This creates a
public entry point into tenant data, so its scope must be minimal.

## Decision

- A **request link** belongs to one work item and covers an explicit set of
  its requirements. It is created by a team member with
  `information.collect` and sent to a named recipient email.
- The link carries a **256-bit token**; only its SHA-256 hash is stored
  (as for sessions, ADR-013). It **expires** (default 14 days, configurable
  per link up to 30 days) and can be **revoked** at any time.
- Holding the link grants exactly: reading the titles and instructions of its
  requirements and their current state, submitting values, and uploading
  files for those requirements. Nothing else: no other requirements, no
  other work, no names of other clients, no downloads of previously submitted
  files.
- Public operations are separate contract operations with
  `x-avenra-permission: public`, their own rate-limit policy, and the
  standard CSRF and Origin protections.
- Every open, submission and upload is **audited** with the link id; the work
  item shows submissions with their source (§136).
- The database access path uses a transaction-scoped
  `app.request_link_token_hash` setting, mirroring the invitation pattern
  (ADR-005): row-level security exposes only the link's own rows.
- Links are sent by email from the platform (ADR-015); the recipient address
  is shown masked on the public page.

## Alternatives

- **Client accounts** — rejected for now: friction for the client; can be
  added later for repeat clients.
- **Magic links without expiry** — rejected: a forwarded email would be a
  permanent key.

## Consequences

- Anyone holding a link can submit; review (ADR-018) remains the control that
  decides what is accepted. Submissions are attributed to the link, not to a
  person.
- A lost or forwarded link is mitigated by expiry, revocation and audit.
