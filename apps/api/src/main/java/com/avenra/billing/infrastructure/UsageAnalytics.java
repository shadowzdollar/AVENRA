package com.avenra.billing.infrastructure;

import com.avenra.platform.analytics.AnalyticsContributor;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Usage over time from the daily usage records, so usage shown matches usage billed (ADR-038). */
@Component
@Order(90)
class UsageAnalytics implements AnalyticsContributor {

    private record Shown(String label, Unit unit) {}

    private static final Map<String, Shown> SHOWN = new LinkedHashMap<>();

    static {
        SHOWN.put("members", new Shown("Members", Unit.COUNT));
        SHOWN.put("work.open", new Shown("Open work", Unit.COUNT));
        SHOWN.put("documents.bytes", new Shown("Stored files", Unit.BYTES));
        SHOWN.put("integrations.active", new Shown("Active integrations", Unit.COUNT));
    }

    private final JdbcClient jdbc;

    UsageAnalytics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Contribution analytics(UUID organizationId, Window current, Window previous) {
        var points = new LinkedHashMap<String, List<Point>>();
        SHOWN.keySet().forEach(metric -> points.put(metric, new ArrayList<>()));
        jdbc.sql("""
                        select metric, day, value from usage_records
                        where organization_id = :org and metric in (:metrics) and day >= :from and day <= :to
                        order by day
                        """)
                .param("org", organizationId)
                .param("metrics", List.copyOf(SHOWN.keySet()))
                .param("from", day(current.from()))
                .param("to", day(current.to()))
                .query((rs, row) -> points.get(rs.getString("metric"))
                        .add(new Point(rs.getObject("day", LocalDate.class), rs.getLong("value"))))
                .list();
        var series = SHOWN.entrySet().stream()
                .map(shown -> new Series(
                        "usage." + shown.getKey(),
                        shown.getValue().label(),
                        shown.getValue().unit(),
                        Interval.DAY,
                        List.copyOf(points.get(shown.getKey()))))
                .toList();
        return new Contribution(List.of(), series, List.of());
    }

    private static LocalDate day(java.time.OffsetDateTime at) {
        return at.withOffsetSameInstant(ZoneOffset.UTC).toLocalDate();
    }
}
