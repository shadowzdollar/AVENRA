package com.avenra.platform.jobs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.PostgresTestDatabase;
import com.avenra.TestOutbox;
import com.avenra.platform.email.EmailMessage;
import com.avenra.platform.email.OutgoingEmail;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import io.micrometer.core.instrument.MeterRegistry;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.test.context.TestPropertySource;

/**
 * The job engine (ADR-022, Phase 4 criteria 4.2–4.7 and 4.14) with the background worker off, so
 * each test drives claiming and running itself.
 */
@IntegrationTest
@TestPropertySource(
        properties = {"avenra.jobs.worker-enabled=false", "avenra.jobs.retry-base=1s", "avenra.jobs.retry-cap=1h"})
@Import(JobEngineIT.TestHandlers.class)
class JobEngineIT extends IntegrationTestBase {

    private static final String INSUFFICIENT_PRIVILEGE = "42501";

    /** Handlers whose behaviour each test sets through {@link #outcomes}. */
    @TestConfiguration
    static class TestHandlers {

        static final Map<String, Runnable> outcomes = new ConcurrentHashMap<>();
        static final List<Job> handled = new CopyOnWriteArrayList<>();
        static final List<JobEvents.JobStopped> stopped = new CopyOnWriteArrayList<>();

        @Bean
        JobHandler testHandler(JdbcClient jdbc) {
            return new JobHandler() {
                @Override
                public String type() {
                    return "test.job";
                }

                @Override
                public void handle(Job job) {
                    handled.add(job);
                    // A database effect that must commit together with the job's completion.
                    jdbc.sql("insert into audit_events (id, occurred_at, organization_id, action) values"
                                    + " (:id, now(), :org, 'test.job.ran')")
                            .param("id", UUID.randomUUID())
                            .param("org", job.organizationId())
                            .update();
                    outcomes.getOrDefault(job.payload().get("name").asString(), () -> {})
                            .run();
                }
            };
        }

        @Bean
        Object stoppedListener() {
            return new Object() {
                @EventListener
                void on(JobEvents.JobStopped event) {
                    stopped.add(event);
                }
            };
        }
    }

    @Autowired
    private JobQueue queue;

    @Autowired
    private JobWorker worker;

    @Autowired
    private TenantTransactions transactions;

    @Autowired
    private JdbcClient jdbc;

    @Autowired
    private OutgoingEmail email;

    @Autowired
    private TestOutbox outbox;

    @Autowired
    private MeterRegistry registry;

    private UUID organization;

    @BeforeEach
    void setUp() throws SQLException {
        organization = UUID.randomUUID();
        owner("insert into organizations values ('" + organization + "', 'Jobs', now(), now())");
        TestHandlers.outcomes.clear();
        TestHandlers.handled.clear();
        TestHandlers.stopped.clear();
        outbox.clearFailures();
        drain();
    }

    private String enqueue(String name) {
        return enqueue(name, JobQueue.Request.of("test.job", organization, Map.of("name", name)));
    }

    private String enqueue(String name, JobQueue.Request request) {
        transactions.runWithoutResult(TenantScope.system(organization), () -> queue.enqueue(request));
        return name;
    }

    private Map<String, Object> job(String name) {
        return jdbcOwner("select status, attempts, last_error_class, last_error, run_at > now() as later,"
                + " payload::text as payload from jobs where payload->>'name' = '" + name + "'");
    }

    @Test
    void aJobExistsOnlyIfItsTransactionCommits() {
        try {
            transactions.runWithoutResult(TenantScope.system(organization), () -> {
                queue.enqueue(JobQueue.Request.of("test.job", organization, Map.of("name", "rolled-back")));
                throw new IllegalStateException("roll back");
            });
        } catch (IllegalStateException expected) {
            // the business change failed
        }
        assertThat(jdbcOwnerCount("select count(*) from jobs where payload->>'name' = 'rolled-back'"))
                .isZero();

        enqueue("committed");
        assertThat(job("committed").get("status")).isEqualTo("QUEUED");
        worker.runDueJobs();
        assertThat(job("committed").get("status")).isEqualTo("SUCCEEDED");
        assertThat(TestHandlers.handled).extracting(Job::organizationId).containsOnly(organization);
        assertThat(registry.get("avenra.job.succeeded")
                        .tag("type", "test.job")
                        .counter()
                        .count())
                .isPositive();
    }

    @Test
    void aJobsDatabaseEffectsCommitOnlyWithItsCompletion() {
        TestHandlers.outcomes.put("fails", () -> {
            throw new JobFailure.NonRetryable("no", null);
        });
        enqueue("fails");
        long before = auditRuns();
        worker.runDueJobs();
        assertThat(auditRuns()).isEqualTo(before);
        assertThat(job("fails").get("status")).isEqualTo("FAILED");
    }

    @Test
    void retryableFailuresBackOffAndThenDeadLetter() {
        TestHandlers.outcomes.put("flaky", () -> {
            throw new JobFailure.Retryable("provider unavailable", null);
        });
        enqueue(
                "flaky",
                JobQueue.Request.of("test.job", organization, Map.of("name", "flaky"))
                        .maxAttempts(2));

        worker.runDueJobs();
        var afterFirst = job("flaky");
        assertThat(afterFirst.get("status")).isEqualTo("QUEUED");
        assertThat(afterFirst.get("attempts")).isEqualTo(1);
        assertThat(afterFirst.get("last_error_class")).isEqualTo("RETRYABLE");
        assertThat(afterFirst.get("later")).isEqualTo(true);
        assertThat(worker.runDueJobs()).as("not due before its backoff").isZero();

        makeDue("flaky");
        worker.runDueJobs();
        assertThat(job("flaky").get("status")).isEqualTo("DEAD");
        assertThat(TestHandlers.stopped)
                .singleElement()
                .satisfies(event -> assertThat(event.reason()).isEqualTo(JobEvents.Reason.DEAD));
    }

    @Test
    void permanentAndHumanFailuresStopAtOnce() {
        TestHandlers.outcomes.put("invalid", () -> {
            throw new JobFailure.NonRetryable("invalid request", null);
        });
        TestHandlers.outcomes.put("ambiguous", () -> {
            throw new JobFailure.HumanRequired("two clients match");
        });
        enqueue("invalid");
        enqueue("ambiguous");
        worker.runDueJobs();
        assertThat(job("invalid").get("status")).isEqualTo("FAILED");
        assertThat(job("invalid").get("attempts")).isEqualTo(1);
        assertThat(job("ambiguous").get("last_error_class")).isEqualTo("HUMAN_REQUIRED");
        assertThat(TestHandlers.stopped)
                .extracting(JobEvents.JobStopped::reason)
                .containsExactlyInAnyOrder(JobEvents.Reason.NON_RETRYABLE, JobEvents.Reason.HUMAN_REQUIRED);
    }

    @Test
    void unexpectedErrorsAreRetriedWithoutRecordingTheirMessage() {
        TestHandlers.outcomes.put("bug", () -> {
            throw new IllegalStateException("secret=hunter2");
        });
        enqueue("bug");
        worker.runDueJobs();
        var job = job("bug");
        assertThat(job.get("status")).isEqualTo("QUEUED");
        assertThat((String) job.get("last_error")).isEqualTo("Unexpected IllegalStateException");
    }

    @Test
    void aCrashedWorkersJobIsReclaimedAfterItsLease() throws InterruptedException {
        enqueue("crash");
        // A worker claims the job with a 1-second lease and dies.
        var claimed = jdbc.sql("select id from jobs_claim('crashed-worker', 100, 1)")
                .query(UUID.class)
                .list();
        assertThat(claimed).hasSize(1);
        assertThat(worker.runDueJobs()).as("still leased").isZero();
        Thread.sleep(1_500);
        assertThat(worker.runDueJobs()).isEqualTo(1);
        var job = job("crash");
        assertThat(job.get("status")).isEqualTo("SUCCEEDED");
        assertThat(job.get("attempts")).isEqualTo(2);
        // The crashed worker can no longer finish what it lost.
        assertThat(jdbc.sql("select jobs_succeed(:id, 'crashed-worker', false)")
                        .param("id", claimed.getFirst())
                        .query(Boolean.class)
                        .single())
                .isFalse();
    }

    @Test
    void aWorkerCannotFinishAJobAnotherWorkerNowHolds() throws InterruptedException {
        enqueue("contested");
        UUID id = jdbc.sql("select id from jobs_claim('slow-worker', 100, 1)")
                .query(UUID.class)
                .single();
        Thread.sleep(1_500);
        // The lease expired and another worker took the job over.
        assertThat(jdbc.sql("select id from jobs_claim('new-worker', 100, 60)")
                        .query(UUID.class)
                        .list())
                .contains(id);
        for (String finish : List.of(
                "select jobs_succeed(:id, 'slow-worker', false)",
                "select jobs_retry(:id, 'slow-worker', 1, 'late')",
                "select jobs_fail(:id, 'slow-worker', 'FAILED', 'NON_RETRYABLE', 'late', false)")) {
            assertThat(jdbc.sql(finish).param("id", id).query(Boolean.class).single())
                    .as(finish)
                    .isFalse();
        }
        var job = jdbcOwner("select status, locked_by from jobs where id = '" + id + "'");
        assertThat(job).containsEntry("status", "RUNNING").containsEntry("locked_by", "new-worker");
        assertThat(jdbc.sql("select jobs_succeed(:id, 'new-worker', false)")
                        .param("id", id)
                        .query(Boolean.class)
                        .single())
                .isTrue();
    }

    @Test
    void concurrentWorkersNeverClaimTheSameJob() throws Exception {
        for (int i = 0; i < 40; i++) {
            enqueue("parallel-" + i);
        }
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(4)) {
            List<Future<List<UUID>>> claims = new ArrayList<>();
            for (int w = 0; w < 4; w++) {
                String id = "parallel-worker-" + w;
                claims.add(pool.submit(() -> {
                    start.await();
                    return jdbc.sql("select id from jobs_claim(:worker, 15, 60)")
                            .param("worker", id)
                            .query(UUID.class)
                            .list();
                }));
            }
            start.countDown();
            List<UUID> all = new ArrayList<>();
            for (var claim : claims) {
                all.addAll(claim.get());
            }
            assertThat(all).doesNotHaveDuplicates().hasSize(40);
        }
    }

    @Test
    void aSchedulesSlotFiresOnceAcrossInstances() throws Exception {
        String name = "test-schedule-" + UUID.randomUUID();
        jdbc.sql("select schedules_register(:name, 'test.scheduled', 3600)")
                .param("name", name)
                .query(Object.class)
                .optional();
        try (var pool = Executors.newFixedThreadPool(3)) {
            var start = new CountDownLatch(1);
            List<Future<Integer>> fires = new ArrayList<>();
            for (int i = 0; i < 3; i++) {
                fires.add(pool.submit(() -> {
                    start.await();
                    return worker.fireSchedules();
                }));
            }
            start.countDown();
            for (var fire : fires) {
                fire.get();
            }
        }
        worker.fireSchedules();
        assertThat(jdbcOwnerCount("select count(*) from jobs where type = 'test.scheduled' and idempotency_key like '"
                        + name + "@%'"))
                .isEqualTo(1);
        // Registering again (a restart) keeps the next slot.
        jdbc.sql("select schedules_register(:name, 'test.scheduled', 3600)")
                .param("name", name)
                .query(Object.class)
                .optional();
        worker.fireSchedules();
        assertThat(jdbcOwnerCount("select count(*) from jobs where type = 'test.scheduled' and idempotency_key like '"
                        + name + "@%'"))
                .isEqualTo(1);
    }

    @Test
    void jobsCanOnlyBeCreatedForTheTransactionsOwnOrganization() throws SQLException {
        UUID other = UUID.randomUUID();
        owner("insert into organizations values ('" + other + "', 'Other', now(), now())");
        assertThatThrownBy(() -> transactions.runWithoutResult(
                        TenantScope.system(organization),
                        () -> queue.enqueue(JobQueue.Request.of("test.job", other, Map.of("name", "x")))))
                .satisfies(error -> assertThat(sqlState(error)).isEqualTo(INSUFFICIENT_PRIVILEGE));
        assertThatThrownBy(() -> transactions.runWithoutResult(
                        TenantScope.system(organization),
                        () -> jdbc.sql("update jobs set status = 'SUCCEEDED'").update()))
                .satisfies(error -> assertThat(sqlState(error)).isEqualTo(INSUFFICIENT_PRIVILEGE));
        assertThatThrownBy(() -> transactions.runWithoutResult(
                        TenantScope.system(organization),
                        () -> jdbc.sql(
                                        "insert into jobs (id, type, status, max_attempts, run_at, created_at, updated_at)"
                                                + " values (gen_random_uuid(), 'x', 'QUEUED', 1, now(), now(), now())")
                                .update()))
                .satisfies(error -> assertThat(sqlState(error)).isEqualTo(INSUFFICIENT_PRIVILEGE));
        // Another tenant's jobs are invisible.
        enqueue("visible-to-owner-only");
        Long seen = transactions.run(
                TenantScope.system(other),
                () -> jdbc.sql("select count(*) from jobs where organization_id = :org")
                        .param("org", organization)
                        .query(Long.class)
                        .single());
        assertThat(seen).isZero();
    }

    @Test
    void emailIsEncryptedAtRestRetriedWhenTransientAndErasedAfterDelivery() {
        String to = "durable-" + UUID.randomUUID() + "@example.test";
        transactions.runWithoutResult(
                TenantScope.system(organization),
                () -> email.queue(
                        new EmailMessage(to, "Hello", "Your link: https://x.test/?token=SECRETTOKEN123", "test"),
                        organization));
        String stored = (String) jdbcOwner("select payload::text as payload from jobs where type = 'email.send'"
                        + " and status = 'QUEUED' order by created_at desc limit 1")
                .get("payload");
        assertThat(stored).doesNotContain(to, "SECRETTOKEN123", "Hello");

        outbox.failNext(new MailSendException("connection refused"));
        worker.runDueJobs();
        assertThat(outbox.now(message -> message.to().equals(to))).isEmpty();
        makeDueType("email.send");
        worker.runDueJobs();
        assertThat(outbox.now(message -> message.to().equals(to))).hasSize(1);
        assertThat(jdbcOwner("select payload::text as payload, status from jobs where type = 'email.send'"
                        + " order by created_at desc limit 1"))
                .containsEntry("payload", "{}")
                .containsEntry("status", "SUCCEEDED");
    }

    @Test
    void permanentEmailFailuresAreNotRetried() {
        String to = "rejected-" + UUID.randomUUID() + "@example.test";
        transactions.runWithoutResult(
                TenantScope.system(organization),
                () -> email.queue(new EmailMessage(to, "Hi", "Body", "test"), organization));
        outbox.failNext(new MailAuthenticationException("bad credentials"));
        worker.runDueJobs();
        assertThat(jdbcOwner("select status, payload::text as payload from jobs where type = 'email.send'"
                        + " order by created_at desc limit 1"))
                .containsEntry("status", "FAILED")
                .containsEntry("payload", "{}");
        assertThat(TestHandlers.stopped).singleElement().satisfies(event -> {
            assertThat(event.type()).isEqualTo("email.send");
            assertThat(event.organizationId()).isEqualTo(organization);
        });
    }

    @Test
    void backoffGrowsExponentiallyAndIsCapped() {
        var first = worker.backoff(1).toMillis();
        var third = worker.backoff(3).toMillis();
        var huge = worker.backoff(40).toMillis();
        assertThat(first).isBetween(1_000L, 1_200L);
        assertThat(third).isBetween(4_000L, 4_800L);
        assertThat(huge).isBetween(3_600_000L, (long) (3_600_000 * 1.2));
    }

    // --- helpers -------------------------------------------------------------

    /** Runs whatever earlier tests left due, so each test starts from a quiet queue. */
    private void drain() {
        while (worker.runDueJobs() > 0) {
            // keep going
        }
        TestHandlers.handled.clear();
        TestHandlers.stopped.clear();
    }

    private long auditRuns() {
        return jdbcOwnerCount("select count(*) from audit_events where action = 'test.job.ran' and organization_id = '"
                + organization + "'");
    }

    private void makeDue(String name) {
        owner("update jobs set run_at = now() where payload->>'name' = '" + name + "'");
    }

    private void makeDueType(String type) {
        owner("update jobs set run_at = now() where type = '" + type + "' and status = 'QUEUED'");
    }

    private static void owner(String sql) {
        try (var connection = DriverManager.getConnection(
                        PostgresTestDatabase.jdbcUrl(),
                        PostgresTestDatabase.OWNER_USER,
                        PostgresTestDatabase.OWNER_PASSWORD);
                var statement = connection.createStatement()) {
            statement.execute(sql);
        } catch (SQLException failure) {
            throw new IllegalStateException(failure);
        }
    }

    private static Map<String, Object> jdbcOwner(String sql) {
        try (var connection = DriverManager.getConnection(
                        PostgresTestDatabase.jdbcUrl(),
                        PostgresTestDatabase.OWNER_USER,
                        PostgresTestDatabase.OWNER_PASSWORD);
                var statement = connection.createStatement();
                var result = statement.executeQuery(sql)) {
            if (!result.next()) {
                return Map.of();
            }
            var row = new java.util.HashMap<String, Object>();
            for (int i = 1; i <= result.getMetaData().getColumnCount(); i++) {
                row.put(result.getMetaData().getColumnLabel(i), result.getObject(i));
            }
            return row;
        } catch (SQLException failure) {
            throw new IllegalStateException(failure);
        }
    }

    private static long jdbcOwnerCount(String sql) {
        return ((Number) jdbcOwner(sql).values().iterator().next()).longValue();
    }

    private static String sqlState(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql) {
                return sql.getSQLState();
            }
        }
        return null;
    }
}
