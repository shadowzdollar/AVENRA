# syntax=docker/dockerfile:1
# Avenra API image (Guidelines §93). Build from the repository root:
#   docker build -f apps/api/Dockerfile -t avenra-api .
# Tests are not run here; CI runs them before images are built.

# --- Build ------------------------------------------------------------------
FROM eclipse-temurin:27_35-jdk-alpine AS build
WORKDIR /workspace

# The contract is the source of the generated API interfaces (ADR-008).
COPY packages/contracts/openapi packages/contracts/openapi
COPY apps/api/mvnw apps/api/pom.xml apps/api/
COPY apps/api/.mvn apps/api/.mvn
COPY apps/api/src apps/api/src
WORKDIR /workspace/apps/api
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp package -DskipTests \
    && java -Djarmode=tools -jar target/avenra-api-*.jar extract --layers --launcher --destination /extracted

# --- Runtime ----------------------------------------------------------------
FROM eclipse-temurin:27_35-jre-alpine

# Operating-system security updates published since the base image was built.
RUN apk upgrade --no-cache \
    && addgroup -S -g 10001 avenra && adduser -S -D -H -u 10001 -G avenra avenra
WORKDIR /app

# Layers ordered from least to most frequently changing, for cache reuse.
COPY --from=build --chown=avenra:avenra /extracted/dependencies/ ./
COPY --from=build --chown=avenra:avenra /extracted/spring-boot-loader/ ./
COPY --from=build --chown=avenra:avenra /extracted/snapshot-dependencies/ ./
COPY --from=build --chown=avenra:avenra /extracted/application/ ./

USER 10001:10001

# Memory follows the container limit; an OutOfMemoryError restarts the
# container instead of leaving a broken JVM running.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Duser.timezone=UTC"

EXPOSE 8080
# Follows SERVER_PORT when the port is overridden at runtime.
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${SERVER_PORT:-8080}/health/liveness" || exit 1

# SPRING_PROFILES_ACTIVE and the AVENRA_* settings must be provided at runtime;
# the application refuses to start without them.
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
