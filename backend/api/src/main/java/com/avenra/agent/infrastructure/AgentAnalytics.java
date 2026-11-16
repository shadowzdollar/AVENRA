package com.avenra.agent.infrastructure;

import static com.avenra.platform.analytics.AnalyticsContributor.percent;

import com.avenra.platform.analytics.AnalyticsContributor;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** How much of the assistant's proposed work was carried out (ADR-038). */
@Component
@Order(40)
class AgentAnalytics implements AnalyticsContributor {

    private final JdbcClient jdbc;

    AgentAnalytics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Contribution analytics(UUID organizationId, Window current, Window previous) {
        long[] now = counts(organizationId, current);
        long[] before = counts(organizationId, previous);
        return Contribution.of(List.of(
                new Metric(
                        "agent.steps_proposed", "Steps proposed by the assistant", Unit.COUNT, (double) now[1], (double)
                                before[1]),
                new Metric(
                        "agent.automation_rate",
                        "Proposed steps carried out",
                        Unit.PERCENT,
                        percent(now[0], now[1]),
                        percent(before[0], before[1]))));
    }

    /** Succeeded and all proposed steps in the window. */
    private long[] counts(UUID organizationId, Window window) {
        return jdbc.sql("""
                        select count(*) filter (where status = 'SUCCEEDED') as succeeded, count(*) as total
                        from agent_steps where organization_id = :org and created_at >= :from and created_at < :to
                        """)
                .param("org", organizationId)
                .param("from", window.from())
                .param("to", window.to())
                .query((rs, row) -> new long[] {rs.getLong("succeeded"), rs.getLong("total")})
                .single();
    }
}
