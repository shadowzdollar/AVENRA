# Avenra developer entry point (ADR-009).
# Thin wrapper: each target calls the ecosystem's own tools. CI uses the same
# targets so local and CI behavior match.

SHELL := /usr/bin/env bash
.SHELLFLAGS := -euo pipefail -c
.DEFAULT_GOAL := help

COMPOSE := docker compose --env-file .env -f infrastructure/docker/compose.yaml

.PHONY: help
help: ## List available commands
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*## "}; {printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}'

.env:
	cp .env.example .env
	@echo "Created .env from .env.example (local-only values)."

.PHONY: setup
setup: .env ## Prepare a fresh clone for local development

# --- Local infrastructure ---------------------------------------------------

.PHONY: infra-up
infra-up: .env ## Start PostgreSQL, Redis and S3 storage, wait until healthy
	$(COMPOSE) up -d --wait postgres redis seaweedfs
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

# --- Backend (apps/api) -----------------------------------------------------

MVNW := cd apps/api && ./mvnw -B
# Loads .env into the environment for commands that run the application.
WITH_ENV := set -a && . ./.env && set +a &&

.PHONY: api-verify
api-verify: ## Backend: format check, compile, unit + integration tests
	$(MVNW) verify

.PHONY: api-format
api-format: ## Backend: apply code formatting
	$(MVNW) spotless:apply

.PHONY: api-run
api-run: .env ## Backend: run the API locally against local infrastructure
	$(WITH_ENV) $(MVNW) spring-boot:run
