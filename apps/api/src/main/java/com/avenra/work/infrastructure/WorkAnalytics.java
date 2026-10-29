package com.avenra.work.infrastructure;

import static com.avenra.platform.analytics.AnalyticsContributor.number;
import static com.avenra.platform.analytics.AnalyticsContributor.percent;

import com.avenra.platform.analytics.AnalyticsContributor;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * Operational and workflow metrics of work and its exceptions (ADR-038): how much is done, how
 * fast, and how often people had to step in.
 */
@Component
@Order(10)
class WorkAnalytics implements AnalyticsContributor {

    private record Figures(
            long created,
            long completed,
            long cancelled,
            @Nullable Double medianSeconds,
            @Nullable Double p90Seconds,
            long intervened,
            long raised,
            long resolved,
            @Nullable Double resolveMedianSeconds) {}

    private final JdbcClient jdbc;

    WorkAnalytics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Contribution analytics(UUID organizationId, Window current, Window previous) {
        var now = figures(organizationId, current);
        var before = figures(organizationId, previous);
        var metrics = List.of(
                new Metric("work.completed", "Work completed", Unit.COUNT, (double) now.completed(), (double)
                        before.completed()),
                new Metric(
                        "work.created", "Work created", Unit.COUNT, (double) now.created(), (double) before.created()),
                new Metric(
                        "work.completion_rate",
                        "Completion rate (completed of completed or cancelled)",
                        Unit.PERCENT,
                        percent(now.completed(), now.completed() + now.cancelled()),
                        percent(before.completed(), before.completed() + before.cancelled())),
                new Metric(
                        "work.completion_time_median",
                        "Median time to complete",
                        Unit.SECONDS,
                        now.medianSeconds(),
                        before.medianSeconds()),
                new Metric(
                        "work.completion_time_p90",
                        "Time to complete, 90th percentile",
                        Unit.SECONDS,
                        now.p90Seconds(),
                        before.p90Seconds()),
                new Metric(
                        "work.intervention_rate",
                        "Completed work that needed someone to step in",
                        Unit.PERCENT,
                        percent(now.intervened(), now.completed()),
                        percent(before.intervened(), before.completed())),
                new Metric("exceptions.raised", "Exceptions raised", Unit.COUNT, (double) now.raised(), (double)
                        before.raised()),
                new Metric("exceptions.resolved", "Exceptions resolved", Unit.COUNT, (double) now.resolved(), (double)
                        before.resolved()),
                new Metric(
                        "exceptions.resolution_time_median",
                        "Median time to resolve an exception",
                        Unit.SECONDS,
                        now.resolveMedianSeconds(),
                        before.resolveMedianSeconds()));
        return new Contribution(metrics, List.of(weekly(organizationId, current)), workTypes(organizationId, current));
    }

    private Figures figures(UUID organizationId, Window window) {
        return jdbc.sql("""
                        with done as (
                            select w.id, extract(epoch from w.completed_at - w.created_at) as seconds
                            from work w
                            where w.organization_id = :org and w.status = 'COMPLETED'
                              and w.completed_at >= :from and w.completed_at < :to)
                        select
                            (select count(*) from work where organization_id = :org
                                and created_at >= :from and created_at < :to) as created,
                            (select count(*) from done) as completed,
                            (select count(*) from work_transitions where organization_id = :org
                                and to_status = 'CANCELLED' and occurred_at >= :from and occurred_at < :to) as cancelled,
                            (select percentile_cont(0.5) within group (order by seconds) from done) as median,
                            (select percentile_cont(0.9) within group (order by seconds) from done) as p90,
                            (select count(*) from done d where exists (select 1 from work_exceptions e
                                where e.organization_id = :org and e.work_id = d.id)) as intervened,
                            (select count(*) from work_exceptions where organization_id = :org
                                and created_at >= :from and created_at < :to) as raised,
                            (select count(*) from work_exceptions where organization_id = :org
                                and resolved_at >= :from and resolved_at < :to) as resolved,
                            (select percentile_cont(0.5) within group (
                                    order by extract(epoch from resolved_at - created_at))
                                from work_exceptions where organization_id = :org
                                and resolved_at >= :from and resolved_at < :to) as resolve_median
                        """)
                .param("org", organizationId)
                .param("from", window.from())
                .param("to", window.to())
                .query((rs, row) -> new Figures(
                        rs.getLong("created"),
                        rs.getLong("completed"),
                        rs.getLong("cancelled"),
                        number(rs.getObject("median")),
                        number(rs.getObject("p90")),
                        rs.getLong("intervened"),
                        rs.getLong("raised"),
                        rs.getLong("resolved"),
                        number(rs.getObject("resolve_median"))))
                .single();
    }

    /** Completed work per week (weeks start on Monday, UTC), with empty weeks as zero. */
    private Series weekly(UUID organizationId, Window window) {
        var counts = new HashMap<LocalDate, Long>();
        jdbc.sql("""
                        select (date_trunc('week', completed_at at time zone 'UTC'))::date as week, count(*) as n
                        from work where organization_id = :org and status = 'COMPLETED'
                          and completed_at >= :from and completed_at < :to
                        group by 1
                        """)
                .param("org", organizationId)
                .param("from", window.from())
                .param("to", window.to())
                .query((rs, row) -> counts.put(rs.getObject("week", LocalDate.class), rs.getLong("n")))
                .list();
        var points = new ArrayList<Point>();
        LocalDate week = monday(window.from());
        LocalDate last = monday(window.to().minus(1, ChronoUnit.MICROS));
        for (; !week.isAfter(last); week = week.plusWeeks(1)) {
            points.add(new Point(week, counts.getOrDefault(week, 0L)));
        }
        return new Series("work.completed_weekly", "Work completed per week", Unit.COUNT, Interval.WEEK, points);
    }

    private static LocalDate monday(OffsetDateTime at) {
        return at.withOffsetSameInstant(ZoneOffset.UTC)
                .toLocalDate()
                .with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
    }

    /** Work created in the window, by type: how much, how much got done, how fast. */
    private List<WorkType> workTypes(UUID organizationId, Window window) {
        return jdbc.sql("""
                        select coalesce(nullif(type, ''), 'Untyped') as type,
                               count(*) as created,
                               count(*) filter (where status = 'COMPLETED') as completed,
                               count(*) filter (where status = 'CANCELLED') as cancelled,
                               percentile_cont(0.5) within group (
                                   order by extract(epoch from completed_at - created_at))
                                   filter (where status = 'COMPLETED') as median
                        from work where organization_id = :org and created_at >= :from and created_at < :to
                        group by 1 order by count(*) desc, 1 limit 20
                        """)
                .param("org", organizationId)
                .param("from", window.from())
                .param("to", window.to())
                .query((rs, row) -> new WorkType(
                        rs.getString("type"),
                        rs.getLong("created"),
                        rs.getLong("completed"),
                        percent(rs.getLong("completed"), rs.getLong("completed") + rs.getLong("cancelled")),
                        number(rs.getObject("median"))))
                .list();
    }
}
