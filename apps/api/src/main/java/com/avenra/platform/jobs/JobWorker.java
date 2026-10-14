package com.avenra.platform.jobs;

import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.SmartLifecycle;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Claims and runs jobs (ADR-022). Claims go through {@code jobs_claim} with a lease; a job is
 * finished in the same transaction as its handler's database work. Failures are classified
 * (Guidelines §103): retryable ones back off exponentially until the attempts run out (dead
 * letter), non-retryable and human-required ones stop at once. Also fires persisted schedules.
 */
@Component
@EnableConfigurationProperties(JobProperties.class)
public class JobWorker implements SmartLifecycle {

    private static final Logger log = LoggerFactory.getLogger(JobWorker.class);

    /** Lets an enqueue wake the local worker right after commit instead of waiting for the next poll. */
    @Component
    public static class Wakeup {

        private final Semaphore signal = new Semaphore(0);

        void now() {
            signal.release();
        }

        void await(Duration timeout) throws InterruptedException {
            if (signal.tryAcquire(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
                signal.drainPermits();
            }
        }
    }

    private final JobProperties properties;
    private final Map<String, JobHandler> handlers;
    private final List<JobSchedule> schedules;
    private final TenantTransactions tenantTransactions;
    private final TransactionTemplate transactions;
    private final JdbcClient jdbc;
    private final JsonMapper json;
    private final JobMetrics metrics;
    private final Wakeup wakeup;
    private final ApplicationEventPublisher events;
    private final String workerId = "worker-" + UUID.randomUUID();
    private final Semaphore slots;

    private volatile boolean running;
    private ExecutorService jobThreads;
    private Thread poller;
    private Thread scheduler;

    JobWorker(
            JobProperties properties,
            List<JobHandler> handlers,
            List<JobSchedule> schedules,
            TenantTransactions tenantTransactions,
            TransactionTemplate transactions,
            JdbcClient jdbc,
            JsonMapper json,
            JobMetrics metrics,
            Wakeup wakeup,
            ApplicationEventPublisher events) {
        this.properties = properties;
        this.handlers = handlers.stream().collect(Collectors.toMap(JobHandler::type, Function.identity()));
        this.schedules = List.copyOf(schedules);
        this.tenantTransactions = tenantTransactions;
        this.transactions = transactions;
        this.jdbc = jdbc;
        this.json = json;
        this.metrics = metrics;
        this.wakeup = wakeup;
        this.events = events;
        this.slots = new Semaphore(properties.concurrency());
    }

    @Override
    public void start() {
        if (!properties.workerEnabled()) {
            log.info("Job worker disabled on this instance");
            return;
        }
        running = true;
        jobThreads = Executors.newVirtualThreadPerTaskExecutor();
        poller = Thread.ofPlatform().name("avenra-job-poller").daemon().start(this::pollLoop);
        scheduler = Thread.ofPlatform().name("avenra-job-scheduler").daemon().start(this::scheduleLoop);
    }

    @Override
    public void stop() {
        running = false;
        if (poller == null) {
            return;
        }
        wakeup.now();
        scheduler.interrupt();
        try {
            // Let running jobs finish; anything still running is reclaimed after its lease.
            if (slots.tryAcquire(properties.concurrency(), 30, TimeUnit.SECONDS)) {
                slots.release(properties.concurrency());
            }
            poller.join(5_000);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
        jobThreads.shutdown();
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    /** Claims and runs whatever is due now; returns the number of jobs started. For tests and the loop. */
    public int runDueJobs() {
        int free = slots.availablePermits();
        if (free == 0) {
            return 0;
        }
        List<ClaimedJob> claimed = claim(free);
        for (ClaimedJob job : claimed) {
            slots.acquireUninterruptibly();
            Runnable task = () -> {
                try {
                    run(job);
                } finally {
                    slots.release();
                }
            };
            if (jobThreads == null) {
                task.run();
            } else {
                jobThreads.submit(task);
            }
        }
        return claimed.size();
    }

    /** Fires due schedules now. For tests and the loop. */
    public int fireSchedules() {
        Integer fired = transactions.execute(status ->
                jdbc.sql("select schedules_fire()").query(Integer.class).single());
        if (fired != null && fired > 0) {
            wakeup.now();
        }
        return fired == null ? 0 : fired;
    }

    private void pollLoop() {
        int idleRounds = 0;
        while (running) {
            try {
                int started = runDueJobs();
                if (idleRounds++ % 10 == 0) {
                    metrics.refreshDepth(jdbc);
                }
                if (started == 0) {
                    wakeup.await(properties.pollInterval());
                }
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            } catch (RuntimeException failure) {
                log.atWarn().setCause(failure).log("Job polling failed; retrying");
                sleep(properties.pollInterval());
            }
        }
    }

    /**
     * Registers the declared schedules. Runs in the scheduler loop, not at startup, so the
     * application starts (alive, not ready) while the database is unreachable and registers once
     * it is back.
     */
    public void registerSchedules() {
        transactions.executeWithoutResult(status ->
                schedules.forEach(schedule -> jdbc.sql("select schedules_register(:name, :type, :seconds)")
                        .param("name", schedule.name())
                        .param("type", schedule.jobType())
                        .param("seconds", (int) schedule.interval().toSeconds())
                        .query(Object.class)
                        .optional()));
    }

    private void scheduleLoop() {
        boolean registered = false;
        while (running) {
            if (!registered) {
                try {
                    registerSchedules();
                    registered = true;
                } catch (RuntimeException failure) {
                    log.atWarn().setCause(failure).log("Registering schedules failed; retrying");
                    sleep(properties.pollInterval());
                    continue;
                }
            }
            try {
                fireSchedules();
            } catch (RuntimeException failure) {
                log.atWarn().setCause(failure).log("Firing schedules failed; retrying");
            }
            sleep(properties.scheduleInterval());
        }
    }

    private record ClaimedJob(Job job, int maxAttempts) {}

    private List<ClaimedJob> claim(int limit) {
        List<ClaimedJob> claimed = transactions.execute(status -> jdbc.sql("""
                        select id, organization_id, type, payload::text, attempts, max_attempts, idempotency_key
                        from jobs_claim(:worker, :limit, :lease)
                        """)
                .param("worker", workerId)
                .param("limit", limit)
                .param("lease", (int) properties.lease().toSeconds())
                .query((rs, row) -> {
                    var job = new Job(
                            rs.getObject(1, UUID.class),
                            rs.getObject(2, UUID.class),
                            rs.getString(3),
                            json.readTree(rs.getString(4)),
                            rs.getInt(5),
                            rs.getInt(6),
                            rs.getString(7));
                    return new ClaimedJob(job, job.maxAttempts());
                })
                .list());
        return claimed == null ? List.of() : claimed;
    }

    private void run(ClaimedJob claimed) {
        Job job = claimed.job();
        long started = System.nanoTime();
        Optional<JobHandler> handler = Optional.ofNullable(handlers.get(job.type()));
        if (handler.isEmpty()) {
            stop(job, "FAILED", "NON_RETRYABLE", "No handler for job type", false, JobEvents.Reason.NON_RETRYABLE);
            metrics.finished(job.type(), "failed", elapsed(started));
            return;
        }
        boolean erase = handler.get().erasePayloadWhenFinished();
        if (job.attempt() > job.maxAttempts()) {
            // Reclaimed after its lease expired on the last attempt: the worker running it crashed.
            stop(job, "DEAD", "LEASE_EXPIRED", "Lease expired on the last attempt", erase, JobEvents.Reason.DEAD);
            metrics.finished(job.type(), "dead", elapsed(started));
            return;
        }
        try {
            tenantTransactions.runWithoutResult(TenantScope.system(job.organizationId()), () -> {
                handler.get().handle(job);
                Boolean held = jdbc.sql("select jobs_succeed(:id, :worker, :erase)")
                        .param("id", job.id())
                        .param("worker", workerId)
                        .param("erase", erase)
                        .query(Boolean.class)
                        .single();
                if (!Boolean.TRUE.equals(held)) {
                    throw new LeaseLost();
                }
            });
            metrics.finished(job.type(), "succeeded", elapsed(started));
        } catch (LeaseLost lost) {
            log.atWarn()
                    .addKeyValue("job.type", job.type())
                    .addKeyValue("job.id", job.id())
                    .log("Job lease lost; another worker owns it now");
        } catch (JobFailure.NonRetryable failure) {
            stop(job, "FAILED", "NON_RETRYABLE", failure.getMessage(), erase, JobEvents.Reason.NON_RETRYABLE);
            metrics.finished(job.type(), "failed", elapsed(started));
        } catch (JobFailure.HumanRequired failure) {
            stop(job, "FAILED", "HUMAN_REQUIRED", failure.getMessage(), erase, JobEvents.Reason.HUMAN_REQUIRED);
            metrics.finished(job.type(), "failed", elapsed(started));
        } catch (RuntimeException failure) {
            String message = failure instanceof JobFailure.Retryable
                    ? failure.getMessage()
                    // Unexpected errors may carry anything in their message; record only their type.
                    : "Unexpected " + failure.getClass().getSimpleName();
            if (!(failure instanceof JobFailure.Retryable)) {
                log.atWarn()
                        .addKeyValue("job.type", job.type())
                        .setCause(failure)
                        .log("Job failed unexpectedly");
            }
            if (job.lastAttempt()) {
                stop(job, "DEAD", "RETRYABLE", message, erase, JobEvents.Reason.DEAD);
                metrics.finished(job.type(), "dead", elapsed(started));
            } else {
                retry(job, message);
                metrics.finished(job.type(), "retried", elapsed(started));
            }
        }
    }

    private void retry(Job job, String message) {
        transactions.executeWithoutResult(status -> jdbc.sql("select jobs_retry(:id, :worker, :delay, :error)")
                .param("id", job.id())
                .param("worker", workerId)
                .param("delay", (int) backoff(job.attempt()).toSeconds())
                .param("error", message)
                .query(Boolean.class)
                .single());
    }

    /** {@code base × 2^(attempt-1)}, capped, with up to 20% jitter so retries do not arrive in step. */
    Duration backoff(int attempt) {
        long base = properties.retryBase().toMillis();
        long exponential = base << Math.min(Math.max(attempt - 1, 0), 20);
        long capped = Math.min(exponential, properties.retryCap().toMillis());
        long jitter = (long) (capped * 0.2 * ThreadLocalRandom.current().nextDouble());
        return Duration.ofMillis(capped + jitter);
    }

    private void stop(
            Job job, String status, String errorClass, String message, boolean erase, JobEvents.Reason reason) {
        Boolean held = transactions.execute(
                tx -> jdbc.sql("select jobs_fail(:id, :worker, :status, :errorClass, :error, :erase)")
                        .param("id", job.id())
                        .param("worker", workerId)
                        .param("status", status)
                        .param("errorClass", errorClass)
                        .param("error", message)
                        .param("erase", erase)
                        .query(Boolean.class)
                        .single());
        if (!Boolean.TRUE.equals(held)) {
            return;
        }
        log.atWarn()
                .addKeyValue("job.type", job.type())
                .addKeyValue("job.id", job.id())
                .addKeyValue("job.status", status)
                .log("Job stopped");
        try {
            events.publishEvent(new JobEvents.JobStopped(
                    job.id(), job.organizationId(), job.type(), job.payload(), reason, message));
        } catch (RuntimeException failure) {
            log.atError().addKeyValue("job.id", job.id()).setCause(failure).log("Could not report a stopped job");
        }
    }

    private static Duration elapsed(long started) {
        return Duration.ofNanos(System.nanoTime() - started);
    }

    private static void sleep(Duration duration) {
        try {
            Thread.sleep(duration);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private static final class LeaseLost extends RuntimeException {
        private static final long serialVersionUID = 1L;

        LeaseLost() {
            super("lease lost", null, false, false);
        }
    }

    /** Payload helper for handlers. */
    public static String text(JsonNode payload, String field) {
        JsonNode value = payload.get(field);
        if (value == null || value.isNull()) {
            throw new JobFailure.NonRetryable("Payload has no " + field, null);
        }
        return value.asString();
    }
}
