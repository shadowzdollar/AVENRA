# ADR-014: Password storage and password rules

**Status:** Accepted

## Context

Guidelines §35 requires secure password hashing using established libraries,
never custom cryptography.

## Decision

- **Argon2id** through Spring Security's `Argon2PasswordEncoder`, with
  parameters at or above the OWASP recommendation (memory 19 MiB,
  iterations 2, parallelism 1), wrapped in a `DelegatingPasswordEncoder` so
  stored hashes carry their algorithm id and can be upgraded on sign-in.
- **Rules (NIST SP 800-63B):** 12 to 128 characters, any characters, no
  composition rules, no forced rotation. Reject passwords found in a bundled
  list of commonly used passwords and passwords equal to the email address.
- Passwords are never logged, returned, or stored in any form but the hash.
- Failed sign-ins take comparable time whether or not the account exists
  (a dummy hash is checked), so timing does not reveal accounts.

## Alternatives

- **bcrypt** — acceptable but limited to 72 bytes and not memory-hard.
- **PBKDF2** — not memory-hard; weaker against GPU attacks.

## Consequences

- Adds BouncyCastle (required by Spring's Argon2 encoder).
- Hashing costs real CPU and memory per sign-in; rate limiting (ADR-016)
  keeps that from becoming a denial-of-service lever.
