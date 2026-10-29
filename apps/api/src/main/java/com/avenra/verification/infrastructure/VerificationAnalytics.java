package com.avenra.verification.infrastructure;

import static com.avenra.platform.analytics.AnalyticsContributor.percent;

import com.avenra.platform.analytics.AnalyticsContributor;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** How often collected information passes its checks (ADR-038). */
@Component
@Order(30)
class VerificationAnalytics implements AnalyticsContributor {

    private final JdbcClient jdbc;

    VerificationAnalytics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Contribution analytics(UUID organizationId, Window current, Window previous) {
        long[] now = counts(organizationId, current);
        long[] before = counts(organizationId, previous);
        return Contribution.of(List.of(
                new Metric(
                        "verification.checks", "Information checked", Unit.COUNT, (double) now[1], (double) before[1]),
                new Metric(
                        "verification.pass_rate",
                        "Checks passed",
                        Unit.PERCENT,
                        percent(now[0], now[1]),
                        percent(before[0], before[1]))));
    }

    /** Passed and all verifications in the window. */
    private long[] counts(UUID organizationId, Window window) {
        return jdbc.sql("""
                        select count(*) filter (where status = 'PASSED') as passed, count(*) as total
                        from verifications where organization_id = :org and created_at >= :from and created_at < :to
                        """)
                .param("org", organizationId)
                .param("from", window.from())
                .param("to", window.to())
                .query((rs, row) -> new long[] {rs.getLong("passed"), rs.getLong("total")})
                .single();
    }
}
