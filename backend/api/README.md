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

## Configuration

All environment-specific values come from environment variables (see the
root `.env.example`). Exactly one profile must be active through
`SPRING_PROFILES_ACTIVE`: `local`, `development`, `staging` or `production`.
The app refuses to start with missing or unsafe configuration.

| Setting | Purpose |
|---|---|
| `AVENRA_DB_URL`, `AVENRA_DB_APP_*`, `AVENRA_DB_OWNER_*` | Database URL; runtime role; migration role |
| `AVENRA_WEB_ALLOWED_ORIGINS` | Comma-separated CORS origins (no wildcards) |
| `AVENRA_WEB_MAX_REQUEST_BODY_SIZE` | Request body limit (default `1MB`) |

## HTTP baseline (ADR-011)

- Deny by default. Public endpoints: `GET /health/liveness`, `GET /health/readiness`.
- Every response has an `X-Request-Id` header. Errors are always
  `{"code","message","requestId"}`, plus `details` for validation errors.
- Logs are ECS JSON (plain text under the `local` profile) and include the request id.

## Observability (Guidelines §60–§62, §101)

- **Traces:** OpenTelemetry through Spring Boot's native starter. One request
  is one trace: HTTP server span → application → SQL spans
  (`datasource-micrometer`). Incoming W3C `traceparent` headers are continued.
  Every HTTP span carries `avenra.request_id`.
- **Export:** OTLP over HTTP, only when an endpoint is configured
  (`MANAGEMENT_OPENTELEMETRY_TRACING_EXPORT_OTLP_ENDPOINT`). The `local`
  profile sends to the Jaeger started by `make infra-up`:
  http://127.0.0.1:16686.
- **Sampling:** `AVENRA_TRACING_SAMPLING_PROBABILITY` (default `1.0`).
- **Logs:** stdout, with `traceId`, `spanId` and `requestId` on every line
  written during a request.
- **Metrics:** collected by Micrometer (HTTP, JVM, connection pool). OTLP
  export is off until a metrics backend exists
  (`AVENRA_OTLP_METRICS_ENABLED`, `AVENRA_OTLP_METRICS_URL`).
- **Naming:** standard OpenTelemetry semantic conventions for technical
  telemetry; Avenra's own attributes and events use the `avenra.` prefix
  (`avenra.request_id`, and later `avenra.work.completed` and so on).

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
