# Avenra AI service (`apps/ai`)

Python 3.14 and FastAPI. It receives controlled requests from the Avenra
backend and returns structured results. It **owns no business data**: the
Java backend is the system of record (Guidelines §6, ADR-003).

Phase 1 delivers the shell only: configuration, logging, request ids, the
error format and health endpoints. AI capabilities arrive in Phase 6.

## Commands

From the repository root:

```bash
make ai-check    # ruff lint + format check, mypy --strict, pytest
make ai-format   # apply formatting and safe fixes
make ai-run      # run on 127.0.0.1:8090
```

## Configuration

| Variable | Purpose |
|---|---|
| `AVENRA_AI_ENVIRONMENT` | `LOCAL`, `DEVELOPMENT`, `STAGING` or `PRODUCTION`. Required. |
| `AVENRA_AI_LOG_JSON` | `true` (default) for JSON logs; `false` for readable local logs. |

Unknown `AVENRA_AI_*` variables are rejected, so a typo fails at startup.

## Behaviour shared with the API

- `X-Request-Id` on every response. Inbound ids are kept if well formed, so
  one request can be followed from the API into this service.
- Errors are always `{"code", "message", "requestId"}` and never contain
  exception details. Unexpected errors are logged with a stack trace on the
  server only.
- JSON logs use the same field names as the API's ECS logs. Query strings
  are never logged.
- `GET /health/liveness` and `GET /health/readiness`. No interactive docs or
  schema endpoint: this is an internal service.

## Rules

- Type hints everywhere (`mypy --strict`, ruff `ANN`); no `print` (ruff `T20`);
  security lint (ruff `S`).
- Dependencies are locked in `uv.lock`; only versions published at least
  7 days ago are eligible (`exclude-newer`).
- Service-to-service authentication between the API and this service is
  added in Phase 6 together with the first AI capability. Until then the
  service binds to `127.0.0.1` only.
