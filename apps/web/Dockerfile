# syntax=docker/dockerfile:1
# Avenra web image (Guidelines §93). Build from the repository root:
#   docker build -f apps/web/Dockerfile -t avenra-web .
# One image for every environment: AVENRA_API_INTERNAL_URL (where /api/* is
# forwarded, ADR-013) is read at runtime.

# --- Build ------------------------------------------------------------------
FROM node:24.22.0-alpine3.24 AS build
RUN npm install --global pnpm@12.4.1
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @avenra/contracts run generate \
    && pnpm --filter @avenra/web run build

# --- Runtime ----------------------------------------------------------------
FROM node:24.22.0-alpine3.24
# Operating-system security updates published since the base image was built.
# A new OS_PACKAGES_DATE (CI passes the day) re-runs this layer even when the
# build cache holds an older one, so cached images never keep stale packages.
ARG OS_PACKAGES_DATE=unset
RUN echo "OS packages as of ${OS_PACKAGES_DATE}" && apk upgrade --no-cache
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

# The standalone output contains only the files the server needs.
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /workspace/apps/web/public ./apps/web/public

USER node

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1

CMD ["node", "apps/web/server.js"]
