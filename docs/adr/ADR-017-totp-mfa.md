# ADR-017: Optional TOTP multi-factor authentication

**Status:** Accepted (decided with the product owner, 2026-10-13)

## Context

Guidelines §35 lists optional MFA. Enterprise customers expect it early.

## Decision

- **TOTP (RFC 6238)**: 6 digits, 30-second steps, SHA-1 (the algorithm every
  authenticator app supports), accepting one step of clock drift. A code can
  be used only once.
- Enrolment shows a QR code (`otpauth://` URI) and requires a valid code
  before MFA is switched on.
- **Ten recovery codes** at enrolment, shown once, stored hashed, single-use.
- When MFA is on, sign-in is two-step: password, then code. The session is
  created only after the second step.
- The TOTP secret is stored **encrypted at the application level**
  (AES-256-GCM, Guidelines §69) with a key from configuration that is not
  stored next to the data.
- TOTP is implemented in-house (a small HMAC computation) and verified
  against the RFC 6238 test vectors, rather than adding a dependency for it
  (Guidelines §99).
- Organization-level "MFA required" policies come later; the data model
  allows them.

## Alternatives

- **SMS codes** — rejected: weak (SIM swapping) and costly.
- **WebAuthn/passkeys** — stronger, planned later; more work in the web app.

## Consequences

- A new secret (the MFA encryption key) per environment; losing it disables
  everyone's MFA. Key rotation must be supported (key id stored with each
  ciphertext).
