package com.avenra.platform.ratelimit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Named rate-limit policies (ADR-016). Contract operations refer to them by name through
 * {@code x-avenra-rate-limit}; a contract test checks that every name exists here.
 *
 * @param policies token buckets by policy name
 * @param failClosed policies that deny requests when Redis is unavailable (credential endpoints);
 *     all others allow requests and log the outage
 */
@Validated
@ConfigurationProperties("avenra.rate-limits")
public record RateLimitProperties(
        @NotNull Map<String, @Valid Policy> policies,
        @NotNull Set<String> failClosed) {

    public RateLimitProperties {
        policies = Map.copyOf(policies);
        failClosed = Set.copyOf(failClosed);
    }

    /**
     * @param capacity requests allowed in a burst
     * @param refill time to earn back the whole capacity
     */
    public record Policy(@Min(1) int capacity, @NotNull Duration refill) {}
}
