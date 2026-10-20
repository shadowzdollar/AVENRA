# Avenra AI service (`apps/ai`)

Python 3.14 and FastAPI. It receives controlled requests from the Avenra
backend and returns structured results. It **owns no business data**: the
Java backend is the system of record (Guidelines §6, ADR-003).

Phase 6 adds the first task, `document.read` (ADR-029 to ADR-032): what kind of
document it is and the fields the team's rules ask for, each with its source.
The model's answer is validated against a strict schema and the request,
quotes are located in the document's text, and only advisory checks use it.

Layout: `providers/` (the interface, the Claude adapter, the deterministic
fake), `prompts/` (versioned prompt files), `tasks/` (validation and
grounding per task), `documents.py`, `retrieval.py`, `grounding.py`,
`tools.py` (the closed catalogue of proposals), `evals/` (the runner; the
dataset is in `evals/document_read/`).

## Commands

From the repository root:

```bash
make ai-check    # ruff lint + format check, mypy --strict, pytest
make ai-format   # apply formatting and safe fixes
make ai-run      # run on 127.0.0.1:8090
make ai-eval     # evaluate document reading with the fake provider
make ai-eval PROVIDER=claude   # against the real model (costs money); stores a report
```

## Configuration

| Variable | Purpose |
|---|---|
| `AVENRA_AI_ENVIRONMENT` | `LOCAL`, `DEVELOPMENT`, `STAGING` or `PRODUCTION`. Required. |
| `AVENRA_AI_LOG_JSON` | `true` (default) for JSON logs; `false` for readable local logs. |
| `AVENRA_AI_SERVICE_TOKEN` | Shared secret the API presents (at least 32 characters). Required. |
| `ANTHROPIC_API_KEY` | Provider key. Without it the fake provider is used (never in production). |
| `AVENRA_AI_PROVIDER` | `claude` or `fake`; default: `claude` when a key is set. |
| `AVENRA_AI_MODEL` | Default `claude-sonnet-5-5`. |
| `AVENRA_AI_EFFORT` | `low`, `medium` (default) or `high`. |

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
- Every task needs `Authorization: Bearer <AVENRA_AI_SERVICE_TOKEN>`; the
  service still binds to loopback or the private network only.
- Documents are data, never instructions; no task gives the model tools.
