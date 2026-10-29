package com.avenra.analytics.application;

import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobSchedule;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * Customer analytics for Avenra's operators (ADR-038): once a day, aggregate counts across all
 * organizations (never an id, a name or content) are kept and published as gauges.
 */
@Configuration(proxyBeanMethods = false)
class PlatformMetrics {

    static final String DAILY = "analytics.platform_daily";

    /** The latest counts, by column; the gauges read them. */
    private final Map<String, AtomicLong> latest = new ConcurrentHashMap<>();

    PlatformMetrics(MeterRegistry meters) {
        for (String column : new String[] {
            "organizations",
            "created_last_30d",
            "activated",
            "active_last_7d",
            "active_last_30d",
            "cohort_30_to_60d",
            "cohort_retained"
        }) {
            var value = new AtomicLong();
            latest.put(column, value);
            Gauge.builder("avenra.customers", value, AtomicLong::get)
                    .tag("measure", column)
                    .description("Customer analytics across all organizations (counts only)")
                    .register(meters);
        }
    }

    @Bean
    JobSchedule platformMetricsSchedule(@Value("${avenra.analytics.platform-every:6h}") Duration every) {
        return new JobSchedule("analytics-platform-daily", DAILY, every);
    }

    @Bean
    JobHandler platformMetricsHandler(JdbcClient jdbc, Clock clock) {
        return JobHandler.of(DAILY, job -> {
            var counts = jdbc.sql("select * from platform_daily_counts()")
                    .query((rs, row) -> {
                        var values = new java.util.LinkedHashMap<String, Long>();
                        for (String column : latest.keySet()) {
                            values.put(column, rs.getLong(column));
                        }
                        return values;
                    })
                    .single();
            OffsetDateTime now = OffsetDateTime.now(clock);
            LocalDate day = now.withOffsetSameInstant(ZoneOffset.UTC).toLocalDate();
            jdbc.sql("""
                            insert into platform_daily_metrics (day, organizations, created_last_30d, activated,
                                active_last_7d, active_last_30d, cohort_30_to_60d, cohort_retained, recorded_at)
                            values (:day, :organizations, :created_last_30d, :activated, :active_last_7d,
                                :active_last_30d, :cohort_30_to_60d, :cohort_retained, :now)
                            on conflict (day) do nothing
                            """)
                    .param("day", day)
                    .params(Map.copyOf(counts))
                    .param("now", now)
                    .update();
            counts.forEach((column, value) -> latest.get(column).set(value));
        });
    }
}
