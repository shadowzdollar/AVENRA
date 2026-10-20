package com.avenra.platform.administration;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Background jobs and outgoing email of the organization (ADR-007, ADR-025). */
@Component
@Order(90)
class JobHealth implements HealthContributor {

    /** A job due longer than this is waiting too long. */
    static final Duration WAITING_TOO_LONG = Duration.ofMinutes(15);

    private final JdbcClient jdbc;
    private final Clock clock;

    JobHealth(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Override
    public List<Check> health(UUID organizationId, OffsetDateTime since) {
        long failed = count(
                "select count(*) from jobs where organization_id = :org and status in ('FAILED', 'DEAD')"
                        + " and type <> 'email.send' and finished_at >= :since",
                organizationId,
                since);
        long emails = count(
                "select count(*) from jobs where organization_id = :org and status in ('FAILED', 'DEAD')"
                        + " and type = 'email.send' and finished_at >= :since",
                organizationId,
                since);
        long waiting = jdbc.sql("""
                        select coalesce(extract(epoch from (:now - min(run_at)))::bigint, 0)
                        from jobs where organization_id = :org and status = 'QUEUED' and run_at <= :now
                        """)
                .param("org", organizationId)
                .param("now", OffsetDateTime.now(clock))
                .query(Long.class)
                .single();
        return List.of(
                new Check("jobs.failed", "Background jobs failed", failed, failed > 0),
                new Check(
                        "jobs.oldest_waiting_seconds",
                        "Oldest waiting job (seconds)",
                        waiting,
                        waiting > WAITING_TOO_LONG.toSeconds()),
                new Check("email.failed", "Emails that could not be sent", emails, emails > 0));
    }

    private long count(String sql, UUID organizationId, OffsetDateTime since) {
        return jdbc.sql(sql)
                .param("org", organizationId)
                .param("since", since)
                .query(Long.class)
                .single();
    }
}
