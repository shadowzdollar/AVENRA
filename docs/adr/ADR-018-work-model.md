# ADR-018: Work model and lifecycle

**Status:** Accepted

## Context

Guidelines §15 and §19–§24 define the core objects; Master Project §11–§12
defines the first workflow (collect and verify everything required from a
client before a milestone). The model must support completeness reasoning
("what is missing?") rather than task counting (§21), and state must only
change through controlled transitions (§19).

## Decision

- **Hierarchy:** Organization → Client → Project → Work. A work item may also
  exist without a client or project (internal work).
- **Work** carries the §19 fields. Its `status` changes only through
  explicit transitions on a state machine in the domain layer:

  | From | To |
  |---|---|
  | DRAFT | READY, CANCELLED |
  | READY | DRAFT, RUNNING, CANCELLED |
  | RUNNING | WAITING_FOR_INFORMATION, WAITING_FOR_APPROVAL, BLOCKED, COMPLETED, FAILED, CANCELLED |
  | WAITING_FOR_INFORMATION | RUNNING, WAITING_FOR_APPROVAL, BLOCKED, CANCELLED |
  | WAITING_FOR_APPROVAL | RUNNING, WAITING_FOR_INFORMATION, BLOCKED, CANCELLED |
  | BLOCKED | RUNNING, WAITING_FOR_INFORMATION, WAITING_FOR_APPROVAL, CANCELLED |
  | FAILED, COMPLETED, CANCELLED | — (final) |

  Moving to BLOCKED, FAILED or CANCELLED needs a reason. COMPLETED needs every
  required requirement accepted and no open task. Every transition is
  recorded (from, to, actor, reason, time) and audited.
  Terminal states (COMPLETED, FAILED, CANCELLED) cannot be left; reopening
  creates new work. Phase 3 transitions are made by people with
  `work.update`; Phase 4 adds transitions made by execution.
- **Task:** a unit inside work with a kind (HUMAN now; AUTOMATED, AI_ASSISTED,
  INTEGRATION, APPROVAL later), an assignee, and a written completion
  condition. Status: OPEN → DONE | CANCELLED.
- **Requirement:** something the work needs: a document (with accepted
  types) or a value (text, number, date, yes/no), required or optional. Its
  state is derived from what was submitted and reviewed: MISSING → SUBMITTED →
  ACCEPTED | REJECTED (rejected returns to the client for correction).
  **Completeness** of a work item = required requirements ACCEPTED / required
  requirements, computed by the server.
- **Information item:** a value or a document version submitted against a
  requirement, with provenance (§136): source type (CLIENT_LINK, TEAM_MEMBER,
  later INTEGRATION, AI), source id, received time, and verification state.
  Items are immutable: a correction is a new item; the requirement points to
  its current item. Nothing is silently overwritten (§23).
- **Evidence:** in Phase 3, the reviewed information item and the review
  decision are the evidence for a requirement; the general Evidence entity
  (§24) arrives with verification in Phase 5.
- Every table carries `organization_id` with row-level security (ADR-005).

## Alternatives

- **Free-form status field edited by the UI** — rejected (§19).
- **Requirements as tasks** — rejected: completeness is about information,
  not activity (§21).

## Consequences

- Clear answers to "what is missing, what is under review, what is done" from
  the data model itself.
- Phase 4 attaches execution to the same state machine; Phase 5 attaches
  verification to the same requirement and information items.
