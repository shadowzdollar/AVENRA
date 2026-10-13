# syntax=docker/dockerfile:1
# Avenra AI service image (Guidelines §93). Build from the repository root:
#   docker build -f apps/ai/Dockerfile -t avenra-ai .

FROM ghcr.io/astral-sh/uv:0.12.13 AS uv

# --- Build ------------------------------------------------------------------
FROM python:3.14.7-alpine3.24 AS build
COPY --from=uv /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
WORKDIR /app

# Exactly the locked versions, without development tools.
COPY apps/ai/pyproject.toml apps/ai/uv.lock apps/ai/.python-version ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev --no-install-project

COPY apps/ai/src src
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev --no-editable

# --- Runtime ----------------------------------------------------------------
# Alpine rather than Debian slim: far fewer operating-system packages, so far
# fewer inherited vulnerabilities (Guidelines §93: minimal base images).
FROM python:3.14.7-alpine3.24
# Operating-system security updates published since the base image was built.
RUN apk upgrade --no-cache \
    && addgroup -S -g 10001 avenra \
    && adduser -S -D -H -u 10001 -G avenra -s /sbin/nologin avenra
WORKDIR /app
COPY --from=build --chown=avenra:avenra /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
USER 10001:10001

EXPOSE 8090
# The standard library is enough for the health check; no extra tools needed.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8090/health/liveness', timeout=2).status == 200 else 1)"]

# Inside the container the service listens on all of the container's own
# interfaces; what is reachable from outside is decided by the network setup.
# AVENRA_AI_ENVIRONMENT must be provided at runtime.
CMD ["uvicorn", "avenra_ai.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8090", "--no-access-log"]
