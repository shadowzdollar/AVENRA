#!/usr/bin/env bash
# =============================================================================
# AVENRA Production Multi-Service Liveness & Readiness Probe (Phase 13)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${ROOT_DIR}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "${ROOT_DIR}/.env"
    set +a
fi

FAILED=0

echo "================================================================="
echo " AVENRA Production Multi-Service Health Probe"
echo " Time: $(date -u)"
echo "================================================================="

check_service() {
    local name="$1"
    local command="$2"
    printf " %-25s ... " "${name}"
    if eval "${command}" > /dev/null 2>&1; then
        echo -e "\033[32m[HEALTHY]\033[0m"
    else
        echo -e "\033[31m[UNHEALTHY / DOWN]\033[0m"
        FAILED=$((FAILED + 1))
    fi
}

# 1. Web Application
check_service "Web Gateway (Next.js)" "curl -fsS http://127.0.0.1:${PORT:-3000}/healthz"

# 2. PostgreSQL RLS Database
check_service "PostgreSQL Database" "pg_isready -h ${POSTGRES_HOST:-127.0.0.1} -p ${POSTGRES_PORT:-15432} -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-avenra}"

# 3. Redis In-Memory Broker
check_service "Redis State Broker" "python3 -c \"import socket; s = socket.create_connection(('127.0.0.1', ${REDIS_PORT:-16379}), timeout=2); s.close()\""

# 4. SeaweedFS S3 Storage
check_service "SeaweedFS S3 Vault" "curl -s -I http://127.0.0.1:${S3_PORT:-18333}/ | grep -q 'HTTP/'"

# 5. ClamAV Malware Scanner
check_service "ClamAV Stream Scanner" "python3 -c \"import socket; s = socket.create_connection(('127.0.0.1', ${CLAMD_PORT:-13310}), timeout=2); s.sendall(b'PING\\n'); res = s.recv(1024); assert b'PONG' in res; s.close()\""

# 6. Mailpit / SMTP Dispatcher
check_service "Mailpit SMTP Engine" "curl -fsS http://127.0.0.1:18025/api/v1/info"

# 7. Jaeger Distributed Tracing
check_service "Jaeger Telemetry UI" "curl -fsS http://127.0.0.1:16686/"

echo "================================================================="
if [ "${FAILED}" -eq 0 ]; then
    echo -e "\033[32m ALL PRODUCTION SUBSYSTEMS HEALTHY AND OPERATIONAL\033[0m"
    exit 0
else
    echo -e "\033[31m WARNING: ${FAILED} service(s) reported unhealthy.\033[0m"
    exit 1
fi
