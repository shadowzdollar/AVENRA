#!/usr/bin/env bash
# Starts the whole local stack: infrastructure, API, web and AI service.
# Output is prefixed per service; Ctrl-C stops all three applications
# (infrastructure keeps running; `make infra-down` stops it).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

make --no-print-directory infra-up

PIDS=()
stop() {
  trap - INT TERM EXIT
  echo
  echo "Stopping applications..."
  for pid in "${PIDS[@]}"; do
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap stop INT TERM EXIT

# Runs a make target in its own process group with prefixed output.
start() {
  local name=$1 target=$2 colour=$3
  setsid bash -c "make --no-print-directory $target 2>&1 | sed -u 's/^/\x1b[${colour}m[$name]\x1b[0m /'" &
  PIDS+=("$!")
}

start api api-run 34
start web web-dev 35
start ai ai-run 36

echo "API http://localhost:8080 · Web http://localhost:3000 · AI http://127.0.0.1:8090 · Traces http://127.0.0.1:16686"
wait
