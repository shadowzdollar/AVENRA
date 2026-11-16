package com.avenra.information.infrastructure;

import static com.avenra.platform.analytics.AnalyticsContributor.number;
import static com.avenra.platform.analytics.AnalyticsContributor.percent;

import com.avenra.platform.analytics.AnalyticsContributor;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Information collected from clients and how quickly they answer (ADR-038). */
@Component
@Order(20)
class InformationAnalytics implements AnalyticsContributor {

    private record Figures(
            long collected,
            long accepted,
            long rejected,
            long sent,
            long answered,
            @Nullable Double responseMedianSeconds) {}

    private final JdbcClient jdbc;

    InformationAnalytics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Contribution analytics(UUID organizationId, Window current, Window previous) {
        var now = figures(organizationId, current);
        var before = figures(organizationId, previous);
        return Contribution.of(List.of(
                new Metric(
                        "information.collected", "Information collected", Unit.COUNT, (double) now.collected(), (double)
                                before.collected()),
                new Metric(
                        "information.acceptance_rate",
                        "Reviewed information accepted",
                        Unit.PERCENT,
                        percent(now.accepted(), now.accepted() + now.rejected()),
                        percent(before.accepted(), before.accepted() + before.rejected())),
                new Metric("requests.sent", "Requests sent to clients", Unit.COUNT, (double) now.sent(), (double)
                        before.sent()),
                new Metric(
                        "requests.answered_rate",
                        "Requests that got an answer",
                        Unit.PERCENT,
                        percent(now.answered(), now.sent()),
                        percent(before.answered(), before.sent())),
                new Metric(
                        "requests.response_time_median",
                        "Median time for a client's first answer",
                        Unit.SECONDS,
                        now.responseMedianSeconds(),
                        before.responseMedianSeconds())));
    }

    private Figures figures(UUID organizationId, Window window) {
        return jdbc.sql("""
                        with links as (
                            select l.id, l.created_at,
                                   (select min(i.received_at) from information_items i
                                    where i.organization_id = :org and i.source_link_id = l.id) as first_answer
                            from request_links l
                            where l.organization_id = :org and l.created_at >= :from and l.created_at < :to)
                        select
                            (select count(*) from information_items where organization_id = :org
                                and received_at >= :from and received_at < :to) as collected,
                            (select count(*) from information_items where organization_id = :org
                                and verification_state = 'ACCEPTED' and reviewed_at >= :from and reviewed_at < :to)
                                as accepted,
                            (select count(*) from information_items where organization_id = :org
                                and verification_state = 'REJECTED' and reviewed_at >= :from and reviewed_at < :to)
                                as rejected,
                            (select count(*) from links) as sent,
                            (select count(*) from links where first_answer is not null) as answered,
                            (select percentile_cont(0.5) within group (
                                    order by extract(epoch from first_answer - created_at))
                                from links where first_answer is not null) as response_median
                        """)
                .param("org", organizationId)
                .param("from", window.from())
                .param("to", window.to())
                .query((rs, row) -> new Figures(
                        rs.getLong("collected"),
                        rs.getLong("accepted"),
                        rs.getLong("rejected"),
                        rs.getLong("sent"),
                        rs.getLong("answered"),
                        number(rs.getObject("response_median"))))
                .single();
    }
}
