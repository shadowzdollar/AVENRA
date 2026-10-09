# Avenra API (`apps/api`)

Java 25 and Spring Boot 4.1 modular monolith (ADR-001, ADR-006). It is the
authoritative business system.

## Commands

From the repository root:

```bash
make api-verify   # format check, compile (warnings are errors), unit + integration tests
make api-format   # apply formatting (palantir-java-format)
make api-run      # run locally on :8080
```

Or inside `apps/api`, run `./mvnw <goal>`. The build refuses to run unless
`JAVA_HOME` is JDK 25 and Maven comes from the wrapper.

## Module structure

Every direct sub-package of `com.avenra` is an **application module**:

```text
com.avenra.<module>              public API of the module (other modules may use it)
com.avenra.<module>.api          HTTP layer (controllers implementing generated contract interfaces)
com.avenra.<module>.application  use cases, transactions, permission checks
com.avenra.<module>.domain       entities, value objects, state machines, business rules
com.avenra.<module>.infrastructure  persistence, external adapters
```

Sub-packages are internal to their module. Business modules are added in the
phase that needs them (for example `identity` and `organization` in Phase 2),
not ahead of time.

## Enforced rules

These run in every build (`src/test/java/com/avenra/architecture`):

| Rule | Source |
|---|---|
| No module uses another module's internals; no cycles between modules | ADR-001, §14 |
| `domain` does not depend on `application`, `api` or `infrastructure` | §11 |
| `application` does not depend on `api` | §11 |
| `domain` does not depend on Spring Web or the Servlet API | §11 |
| No field injection (`@Autowired`/`@Inject` on fields) | §82 |
| No `System.out`/`System.err` or `java.util.logging` | §62 |

`ArchitectureRulesSelfTest` runs each rule against deliberately broken fixture
code (`src/test/java/fixtures/architecture`) and requires it to fail, which
proves the rules actually detect violations.

Module documentation (diagrams) is generated into
`target/spring-modulith-docs` by `ModularityTest`.
