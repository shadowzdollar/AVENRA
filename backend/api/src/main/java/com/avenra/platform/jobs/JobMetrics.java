package com.avenra.platform.jobs;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Job telemetry (Guidelines §101): counters by type and outcome, duration, and queue depth. */
@Component
class JobMetrics {

    private final MeterRegistry registry;
    private final Map<String, AtomicLong> depth = new ConcurrentHashMap<>();

    JobMetrics(MeterRegistry registry) {
        this.registry = registry;
        for (String status : new String[] {"QUEUED", "RUNNING", "DEAD"}) {
            var value = new AtomicLong();
            depth.put(status, value);
            Gauge.builder("avenra.job.depth", value, AtomicLong::get)
                    .tag("status", status.toLowerCase(java.util.Locale.ROOT))
                    .description("Jobs by status")
                    .register(registry);
        }
    }

    void enqueued(String type) {
        registry.counter("avenra.job.enqueued", "type", type).increment();
    }

    void finished(String type, String outcome, Duration took) {
        registry.counter("avenra.job." + outcome, "type", type).increment();
        Timer.builder("avenra.job.duration")
                .tag("type", type)
                .tag("outcome", outcome)
                .register(registry)
                .record(took);
    }

    void refreshDepth(JdbcClient jdbc) {
        depth.values().forEach(value -> value.set(0));
        jdbc.sql("select status, jobs from jobs_depth()")
                .query((rs, row) -> Map.entry(rs.getString(1), rs.getLong(2)))
                .list()
                .forEach(entry -> depth.computeIfAbsent(entry.getKey(), key -> new AtomicLong())
                        .set(entry.getValue()));
    }
}
