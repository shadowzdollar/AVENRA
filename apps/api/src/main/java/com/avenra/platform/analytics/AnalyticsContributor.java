package com.avenra.platform.analytics;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * A module's analytics for one organization (ADR-038). Called in that organization's tenant
 * scope; a contributor reads only its own module's tables and reports counts and durations, never
 * content, names or answers.
 */
public interface AnalyticsContributor {

    Contribution analytics(UUID organizationId, Window current, Window previous);

    /** A half-open time window, {@code from} included, {@code to} excluded. */
    record Window(OffsetDateTime from, OffsetDateTime to) {}

    enum Unit {
        COUNT,
        PERCENT,
        SECONDS,
        BYTES
    }

    enum Interval {
        DAY,
        WEEK
    }

    /**
     * @param value {@code null} when there is nothing to measure, such as a median of no work
     * @param previous the same metric over the previous window
     */
    record Metric(
            String key,
            String label,
            Unit unit,
            @Nullable Double value,
            @Nullable Double previous) {}

    record Point(LocalDate start, double value) {}

    record Series(String key, String label, Unit unit, Interval interval, List<Point> points) {}

    /** Workflow metrics per work type. */
    record WorkType(
            String type,
            long created,
            long completed,
            @Nullable Double completionRate,
            @Nullable Double medianCompletionSeconds) {}

    record Contribution(List<Metric> metrics, List<Series> series, List<WorkType> workTypes) {

        public static Contribution of(List<Metric> metrics) {
            return new Contribution(metrics, List.of(), List.of());
        }
    }

    /** A nullable SQL number (a median of no rows is null) as a double. */
    static @Nullable Double number(@Nullable Object value) {
        return value == null ? null : ((Number) value).doubleValue();
    }

    /** {@code part} as a percent of {@code whole}, or {@code null} when the whole is zero. */
    static @Nullable Double percent(long part, long whole) {
        return whole == 0 ? null : Math.round(1000.0 * part / whole) / 10.0;
    }
}
