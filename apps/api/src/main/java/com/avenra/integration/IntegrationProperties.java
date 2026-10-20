package com.avenra.integration;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Integration delivery settings (ADR-034).
 *
 * @param allowLoopbackHttp lets connections target plain HTTP on loopback; local development and
 *     tests only, refused in production
 * @param maxAttempts attempts per delivery before it fails
 * @param pauseAfter consecutive failed deliveries that pause a connection
 * @param timeout longest a single delivery attempt may take
 * @param firstRetry first retry delay, doubled per attempt up to {@code maxRetry}
 */
@Validated
@ConfigurationProperties("avenra.integrations")
public record IntegrationProperties(
        @DefaultValue("false") boolean allowLoopbackHttp,
        @Min(1) @Max(20) @DefaultValue("8") int maxAttempts,
        @Min(1) @Max(100) @DefaultValue("5") int pauseAfter,
        @NotNull @DefaultValue("10s") Duration timeout,
        @NotNull @DefaultValue("1m") Duration firstRetry,
        @NotNull @DefaultValue("6h") Duration maxRetry) {}
