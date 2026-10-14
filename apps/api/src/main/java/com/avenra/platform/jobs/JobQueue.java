package com.avenra.platform.jobs;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.json.JsonMapper;

/**
 * Enqueues durable jobs (ADR-022). A job is written in the caller's transaction, so it exists
 * exactly when the change that caused it committed. {@code jobs_enqueue} refuses any organization
 * other than the one the transaction acts in.
 */
@Component
public class JobQueue {

    /** What to run. {@code idempotencyKey} makes a second enqueue of the same job a no-op. */
    public record Request(
            String type,
            @Nullable UUID organizationId,
            Object payload,
            @Nullable String idempotencyKey,
            Duration delay,
            int maxAttempts) {

        public static Request of(String type, @Nullable UUID organizationId, Object payload) {
            return new Request(type, organizationId, payload, null, Duration.ZERO, 5);
        }

        public Request idempotencyKey(String key) {
            return new Request(type, organizationId, payload, key, delay, maxAttempts);
        }

        public Request delay(Duration value) {
            return new Request(type, organizationId, payload, idempotencyKey, value, maxAttempts);
        }

        public Request maxAttempts(int value) {
            return new Request(type, organizationId, payload, idempotencyKey, delay, value);
        }
    }

    private final JdbcClient jdbc;
    private final JsonMapper json;
    private final JobMetrics metrics;
    private final JobWorker.Wakeup wakeup;
    private final Clock clock;

    JobQueue(JdbcClient jdbc, JsonMapper json, JobMetrics metrics, JobWorker.Wakeup wakeup, Clock clock) {
        this.jdbc = jdbc;
        this.json = json;
        this.metrics = metrics;
        this.wakeup = wakeup;
        this.clock = clock;
    }

    /** @return whether a new job was created (false when the idempotency key was already used) */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean enqueue(Request request) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        boolean created = Boolean.TRUE.equals(
                jdbc.sql("select jobs_enqueue(:id, :org, :type, cast(:payload as jsonb), :max, :runAt, :key)")
                        .param("id", UUID.randomUUID())
                        .param("org", request.organizationId())
                        .param("type", request.type())
                        .param("payload", json.writeValueAsString(request.payload()))
                        .param("max", request.maxAttempts())
                        .param("runAt", now.plus(request.delay()))
                        .param("key", request.idempotencyKey())
                        .query(Boolean.class)
                        .single());
        if (created) {
            metrics.enqueued(request.type());
            if (request.delay().isZero() && TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        wakeup.now();
                    }
                });
            }
        }
        return created;
    }
}
