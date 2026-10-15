# Avenra developer entry point (ADR-009).
# Thin wrapper: each target calls the ecosystem's own tools. CI uses the same
# targets so local and CI behavior match.

SHELL := /usr/bin/env bash
.SHELLFLAGS := -euo pipefail -c
.DEFAULT_GOAL := help

COMPOSE := docker compose --env-file .env -f infrastructure/docker/compose.yaml
# Loads .env into the environment for commands that run an application.
WITH_ENV := set -a && . ./.env && set +a &&

.PHONY: help
help: ## List available commands
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*## "}; {printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}'

.env:
	cp .env.example .env
	sed -i "s|^AVENRA_CRYPTO_KEYS_LOCAL1=.*|AVENRA_CRYPTO_KEYS_LOCAL1=$$(openssl rand -base64 32)|" .env
	@echo "Created .env from .env.example with a new local encryption key (local-only values)."

.PHONY: setup
setup: .env js-install ## Prepare a fresh clone for local development

.PHONY: dev
dev: .env ## Start infrastructure, API, web and AI service together (Ctrl-C stops the apps)
	scripts/dev.sh

.PHONY: check
check: contract-check api-verify web-check ai-check ## Run every check CI runs on the code (not images)

# --- Local infrastructure ---------------------------------------------------

.PHONY: infra-up
infra-up: .env ## Start PostgreSQL, Redis, S3 storage, ClamAV, Jaeger and Mailpit, wait until healthy
	$(COMPOSE) up -d --wait postgres redis seaweedfs clamav jaeger mailpit
	$(COMPOSE) run --rm seaweedfs-init

.PHONY: infra-down
infra-down: ## Stop local infrastructure (keeps data)
	$(COMPOSE) down

.PHONY: infra-reset
infra-reset: ## Stop local infrastructure and DELETE its data volumes
	@read -r -p "Delete all local Avenra database and storage data? [y/N] " ans; \
		[[ "$$ans" == "y" ]] || { echo "Aborted."; exit 1; }
	$(COMPOSE) down --volumes

.PHONY: infra-status
infra-status: ## Show local infrastructure status
	$(COMPOSE) ps

# --- API contract (packages/contracts) --------------------------------------

.PHONY: js-install
js-install: ## Install JavaScript workspace dependencies (lockfile is respected)
	pnpm install --frozen-lockfile

.PHONY: contract-check
contract-check: ## Contract: lint, prove lint rules, generate TS client, type-check
	pnpm --filter @avenra/contracts run check

# --- Web (apps/web) ---------------------------------------------------------

.PHONY: web-check
web-check: ## Web: lint (zero warnings), strict type check, unit tests
	pnpm --filter @avenra/contracts run generate
	pnpm --filter @avenra/web run check

.PHONY: web-build
web-build: .env ## Web: production build
	$(WITH_ENV) pnpm --filter @avenra/web run build

.PHONY: e2e
e2e: ## Browser end-to-end tests (needs the stack running: infra, API, web on :3000)
	pnpm --filter @avenra/web exec playwright test

.PHONY: web-dev
web-dev: .env ## Web: run the development server on :3000
	pnpm --filter @avenra/contracts run generate
	$(WITH_ENV) pnpm --filter @avenra/web run dev

# --- Backend (apps/api) -----------------------------------------------------

MVNW := cd apps/api && ./mvnw -B

.PHONY: api-verify
api-verify: ## Backend: format check, compile, unit + integration tests
	$(MVNW) verify

.PHONY: api-format
api-format: ## Backend: apply code formatting
	$(MVNW) spotless:apply

.PHONY: api-run
api-run: .env ## Backend: run the API locally against local infrastructure
	$(WITH_ENV) $(MVNW) spring-boot:run

# --- AI service (apps/ai) ---------------------------------------------------

UV := cd apps/ai && uv

.PHONY: ai-check
ai-check: ## AI service: lint, format check, strict types, tests
	$(UV) sync --locked
	$(UV) run ruff check .
	$(UV) run ruff format --check .
	$(UV) run mypy src tests
	$(UV) run pytest

.PHONY: ai-format
ai-format: ## AI service: apply formatting and safe lint fixes
	$(UV) run ruff format .
	$(UV) run ruff check --fix .

.PHONY: ai-eval
ai-eval: .env ## AI service: evaluate document reading (PROVIDER=claude for the real model; costs money)
	$(WITH_ENV) $(UV) run python -m avenra_ai.evals --provider $(or $(PROVIDER),fake) \
		$(if $(filter claude,$(PROVIDER)),--enforce --report evals/reports/document_read-$$(date -u +%Y%m%dT%H%M%SZ).json)

.PHONY: ai-run
ai-run: .env ## AI service: run locally on 127.0.0.1:8090
	$(WITH_ENV) $(UV) run uvicorn avenra_ai.main:create_app --factory --host 127.0.0.1 --port 8090 --no-access-log

# --- Container images ---------------------------------------------------------

TAG ?= local

.PHONY: images-build
images-build: .env ## Build the api, web and ai images (needs docker buildx)
	docker buildx build --load -f apps/api/Dockerfile -t avenra-api:$(TAG) .
	docker buildx build --load -f apps/ai/Dockerfile -t avenra-ai:$(TAG) .
	docker buildx build --load -f apps/web/Dockerfile -t avenra-web:$(TAG) .

.PHONY: images-test
images-test: .env ## Smoke-test the images (needs `make infra-up`)
	TAG=$(TAG) scripts/smoke-test-images.sh
