# ADR-026: Information and verification modules

**Status:** Accepted (closes the Phase 3 deferral on §128)

## Context

Guidelines §128 names module ownership: Work → work and tasks, Information →
information and requirements, Verification → verification and evidence. Phase 3
kept requirements, answers and request links inside the `work` module. Phase 5
adds verification, which would otherwise make that module own everything.

## Decision

- **`information`** owns requirements, information items, request links, the
  public client requests, submissions and human review, and their follow-ups
  (reminders, expiry).
- **`verification`** owns verification rules, verification results and
  evidence. It is an engine: it receives what it checks and never reads the
  other modules' tables.
- **`work`** keeps clients, projects, work and its lifecycle, tasks,
  executions, exceptions and automation.
- **Dependencies point one way:** `work → information → verification`
  (and `information → document`). The reverse directions use:
  - **events** published by `information` inside the transaction
    (`AnswerReceived`, `AnswerReviewed`, `InformationRequested`,
    `RequestExpired`, `ReminderSent`), handled by `work` (review tasks,
    automation, executions, exceptions);
  - **one port** defined by `information` and implemented by `work`
    (`WorkGate`: is the work open, its title and owner), so `information`
    never imports `work`.
- Tables keep their names; the split is in code ownership, not schema.
- The split lands first as a pure refactor; the unchanged test suite is the
  proof that behaviour did not change.

## Consequences

- Each module can be reasoned about and tested on its own; the modularity test
  rejects cycles.
- Work-level views (completeness, progress, completion) call the `information`
  facade instead of reading its tables.
