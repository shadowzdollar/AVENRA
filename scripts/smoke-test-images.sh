#!/usr/bin/env bash
# Smoke-tests the three Avenra images (Guidelines §93). Used locally
# (`make images-test`) and in CI, so both check the same things:
#   - the image runs as a non-root user
#   - the container refuses to start without its required configuration
#   - with valid configuration it becomes healthy and serves requests
#
# Requires: images built with tag $TAG, local infrastructure running
# (`make infra-up`), and the values from .env.
set -euo pipefail

TAG="${TAG:-local}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck source=/dev/null
. "$ROOT/.env"
set +a

CONTAINERS=()
cleanup() {
  for c in "${CONTAINERS[@]}"; do docker rm -f "$c" >/dev/null 2>&1 || true; done
}
trap cleanup EXIT

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

expect_non_root_image() {
  local image=$1 user
  user=$(docker image inspect --format '{{.Config.User}}' "$image")
  if [[ -n "$user" && "$user" != "root" && "$user" != "0" && "$user" != 0:* ]]; then
    pass "$image runs as non-root user '$user'"
  else
    fail "$image runs as root (User='$user')"
  fi
}

# Starts a container that must exit with a non-zero code within 90 seconds.
expect_refuses_to_start() {
  local name=$1; shift
  CONTAINERS+=("$name")
  docker run -d --name "$name" --network host "$@" >/dev/null
  local code
  code=$(timeout 90 docker wait "$name") || fail "$name kept running without required configuration"
  if [[ "$code" != "0" ]]; then
    pass "$name refuses to start without required configuration (exit $code)"
  else
    fail "$name exited 0 without required configuration"
  fi
}

wait_healthy() {
  local name=$1 status
  for _ in $(seq 1 120); do
    status=$(docker inspect --format '{{.State.Health.Status}}' "$name" 2>/dev/null || echo missing)
    case "$status" in
      healthy) pass "$name is healthy"; return 0 ;;
      unhealthy|missing) break ;;
    esac
    if [[ "$(docker inspect --format '{{.State.Running}}' "$name")" != "true" ]]; then break; fi
    sleep 1
  done
  docker logs --tail 40 "$name" >&2 || true
  fail "$name did not become healthy (status: ${status:-unknown})"
}

expect_uid() {
  local name=$1 expected=$2 uid
  uid=$(docker exec "$name" id -u)
  if [[ "$uid" == "$expected" ]]; then pass "$name process runs as uid $uid"; else fail "$name runs as uid $uid, expected $expected"; fi
}

expect_http() {
  local url=$1 expected=$2 status
  status=$(curl -s -o /dev/null -w '%{http_code}' "$url")
  if [[ "$status" == "$expected" ]]; then pass "GET $url -> $status"; else fail "GET $url -> $status, expected $expected"; fi
}

echo "API (avenra-api:$TAG)"
expect_non_root_image "avenra-api:$TAG"
expect_refuses_to_start avenra-api-smoke-noconfig "avenra-api:$TAG"
CONTAINERS+=(avenra-api-smoke)
docker run -d --name avenra-api-smoke --network host \
  -e SPRING_PROFILES_ACTIVE=development \
  -e SERVER_PORT=18080 \
  -e AVENRA_DB_URL -e AVENRA_DB_APP_USER -e AVENRA_DB_APP_PASSWORD \
  -e AVENRA_DB_OWNER_USER -e AVENRA_DB_OWNER_PASSWORD \
  -e AVENRA_WEB_ALLOWED_ORIGINS=http://localhost:13000 \
  "avenra-api:$TAG" >/dev/null
wait_healthy avenra-api-smoke
expect_uid avenra-api-smoke 10001
expect_http http://127.0.0.1:18080/health/readiness 200
expect_http http://127.0.0.1:18080/api/v1/meta 200
expect_http http://127.0.0.1:18080/not-public 401

echo "AI service (avenra-ai:$TAG)"
expect_non_root_image "avenra-ai:$TAG"
expect_refuses_to_start avenra-ai-smoke-noconfig "avenra-ai:$TAG"
CONTAINERS+=(avenra-ai-smoke)
docker run -d --name avenra-ai-smoke -p 127.0.0.1:18090:8090 \
  -e AVENRA_AI_ENVIRONMENT=DEVELOPMENT "avenra-ai:$TAG" >/dev/null
wait_healthy avenra-ai-smoke
expect_uid avenra-ai-smoke 10001
expect_http http://127.0.0.1:18090/health/readiness 200
expect_http http://127.0.0.1:18090/docs 404

echo "Web (avenra-web:$TAG)"
expect_non_root_image "avenra-web:$TAG"
CONTAINERS+=(avenra-web-smoke)
docker run -d --name avenra-web-smoke -p 127.0.0.1:13000:3000 "avenra-web:$TAG" >/dev/null
wait_healthy avenra-web-smoke
expect_uid avenra-web-smoke 1000
expect_http http://127.0.0.1:13000/healthz 200
expect_http http://127.0.0.1:13000/ 200
csp=$(curl -s -D - -o /dev/null http://127.0.0.1:13000/ | grep -i '^content-security-policy:' || true)
if [[ "$csp" == *"nonce-"* ]]; then pass "web sends a nonce-based Content-Security-Policy"; else fail "web CSP missing or without nonce"; fi
powered=$(curl -s -D - -o /dev/null http://127.0.0.1:13000/ | grep -ic '^x-powered-by:' || true)
if [[ "$powered" == "0" ]]; then pass "web does not send X-Powered-By"; else fail "web sends X-Powered-By"; fi

echo "All image smoke tests passed."
