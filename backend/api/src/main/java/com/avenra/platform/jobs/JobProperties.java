package com.avenra.platform.jobs;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Job engine settings (ADR-022).
 *
 * @param workerEnabled whether this instance runs jobs (it can always enqueue them)
 * @param pollInterval how often the worker looks for due jobs when not woken up
 * @param concurrency jobs this instance runs at the same time
 * @param lease how long a claim is held; a job whose lease expires is run again
 * @param retryBase first retry delay; doubled per attempt, with jitter
 * @param retryCap longest retry delay
 * @param scheduleInterval how often due schedules are fired
 */
@Validated
@ConfigurationProperties("avenra.jobs")
public record JobProperties(
        @DefaultValue("true") boolean workerEnabled,
        @NotNull @DefaultValue("1s") Duration pollInterval,
        @Min(1) @Max(64) @DefaultValue("4") int concurrency,
        @NotNull @DefaultValue("5m") Duration lease,
        @NotNull @DefaultValue("10s") Duration retryBase,
        @NotNull @DefaultValue("1h") Duration retryCap,
        @NotNull @DefaultValue("15s") Duration scheduleInterval) {}
