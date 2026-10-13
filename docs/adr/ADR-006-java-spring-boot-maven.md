# ADR-006: Java 25, Spring Boot 4.1, Maven

**Status:** Accepted

## Context

The Guidelines (§5) fix Java + Spring Boot but no versions or build tool.
The platform will be in development and early production for years, so
long support windows matter.

## Decision

- **Java 25 (LTS).** Longest support window available; virtual threads no
  longer pin carrier threads on `synchronized` (JEP 491), which matters for
  I/O-heavy workers and integration calls.
- **Spring Boot 4.1.x** (latest GA line at the time of writing: 4.1.1). Exact
  versions are pinned in the build and upgraded deliberately.
- **Maven**, via the committed Maven Wrapper, so every developer and CI run
  uses the same Maven version. Maven Enforcer requires Java 25 and the pinned
  Maven version.

## Alternatives

- **Java 21 LTS** — viable, but would likely force an upgrade around launch.
- **Gradle (Kotlin DSL)** — faster incremental builds but more build-logic
  complexity; Maven's declarative model is easier to keep boring (§81).

## Consequences

- Developers need JDK 25 installed locally; CI uses JDK 25.
- Libraries must support Spring Boot 4 / Spring Framework 7 and Java 25;
  this is checked before any dependency is added (§99).
