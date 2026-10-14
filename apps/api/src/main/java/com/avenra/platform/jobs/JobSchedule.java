package com.avenra.platform.jobs;

import java.time.Duration;

/**
 * A persisted recurring schedule (Guidelines §105): every {@code interval}, one platform job of
 * {@code jobType} is enqueued, once per slot across all instances. Declare as a bean.
 */
public record JobSchedule(String name, String jobType, Duration interval) {}
