# ADR-028: Evidence and completion

**Status:** Accepted (completes the evidence model deferred in ADR-018)

## Context

Guidelines §24 makes evidence a first-class concept that verification results
point back to. The Master Project ends the workflow with "a clear completion
state and supporting evidence" (§12.11) and positions Avenra around verified
completed work.

## Decision

- **Evidence** (per tenant and work, immutable): kind (`ANSWER`,
  `DOCUMENT_VERSION`, `VERIFICATION`, `HUMAN_DECISION`, `SYSTEM_DECISION`),
  the referenced record, a description, a content fingerprint where one exists
  (document SHA-256, answer value hash), and time. Every verification and every
  decision on an answer creates evidence.
- **Completion criteria**, computed by the server and shown on the work:
  1. every required requirement is accepted;
  2. no accepted answer has a failed blocking check without an override;
  3. no open high-severity exception on the work;
  4. no open task.
  Completing the work requires all of them (`COMPLETION_CRITERIA_UNMET`, with
  the unmet criteria).
- **Completion manifest**: when work completes, an immutable record is written
  in the same transaction: the work, the criteria, and per requirement the
  accepted answer, its verification, the decision (who or which rule, when,
  any override) and document fingerprints. It is stored as canonical JSON with
  its SHA-256; the API returns both, and can re-check that the stored manifest
  still matches its hash.

## Consequences

- A completed work item carries its own proof, independent of later changes.
- The manifest is tamper-evident, not tamper-proof: an external timestamp or
  signature can be added later (Phase 12, compliance).
