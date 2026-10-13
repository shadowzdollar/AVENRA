package com.avenra.platform.ratelimit;

import com.avenra.platform.web.ApiException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Token-bucket rate limiting shared by every API instance (ADR-016). One atomic Redis script per
 * check, using Redis's own clock so instances with drifting clocks agree. Keys are hashed into a
 * fixed namespace and never contain raw email addresses.
 */
@Component
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RateLimiter.class);

    /** Returns {allowed (1/0), retry-after in milliseconds}. */
    private static final RedisScript<List<Long>> TOKEN_BUCKET = script("""
            local capacity = tonumber(ARGV[1])
            local refill_ms_per_token = tonumber(ARGV[2])
            local time = redis.call('TIME')
            local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
            local state = redis.call('HMGET', KEYS[1], 'tokens', 'at')
            local tokens = tonumber(state[1]) or capacity
            local at = tonumber(state[2]) or now
            tokens = math.min(capacity, tokens + math.max(0, now - at) / refill_ms_per_token)
            local allowed, retry = 0, 0
            if tokens >= 1 then
              tokens = tokens - 1
              allowed = 1
            else
              retry = math.ceil((1 - tokens) * refill_ms_per_token)
            end
            redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'at', now)
            redis.call('PEXPIRE', KEYS[1], math.ceil(capacity * refill_ms_per_token) + 1000)
            return {allowed, retry}
            """);

    private final StringRedisTemplate redis;
    private final RateLimitProperties properties;

    /** Redis returns a list of integers; the generic type cannot be expressed as a class literal. */
    @SuppressWarnings("unchecked")
    private static RedisScript<List<Long>> script(String lua) {
        return RedisScript.of(lua, (Class<List<Long>>) (Class<?>) List.class);
    }

    RateLimiter(StringRedisTemplate redis, RateLimitProperties properties) {
        this.redis = redis;
        this.properties = properties;
    }

    public boolean hasPolicy(String policy) {
        return properties.policies().containsKey(policy);
    }

    /**
     * Consumes one token, or throws {@code 429 RATE_LIMITED} with the wait time.
     *
     * @param policy a configured policy name
     * @param subject who is limited, e.g. {@code ip:203.0.113.4} or {@code email:<hash>}
     */
    public void consume(String policy, String subject) {
        var limit = properties.policies().get(policy);
        if (limit == null) {
            throw new IllegalStateException("Unknown rate-limit policy '" + policy + "'");
        }
        long refillPerToken = Math.max(1, limit.refill().toMillis() / limit.capacity());
        List<Long> result;
        try {
            result = redis.execute(
                    TOKEN_BUCKET,
                    List.of("avenra:ratelimit:" + policy + ":" + subject),
                    Integer.toString(limit.capacity()),
                    Long.toString(refillPerToken));
        } catch (RuntimeException exception) {
            boolean failClosed = properties.failClosed().contains(policy);
            log.atError()
                    .addKeyValue("ratelimit.policy", policy)
                    .addKeyValue("ratelimit.fail_closed", failClosed)
                    .setCause(exception)
                    .log("Rate limiter unavailable");
            if (failClosed) {
                throw new ApiException(
                        "SERVICE_UNAVAILABLE",
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "This action is temporarily unavailable. Please try again shortly.");
            }
            return;
        }
        if (result == null || result.get(0) != 1L) {
            long retryAfterSeconds = result == null ? 1 : Math.max(1, (result.get(1) + 999) / 1000);
            throw new RateLimitedException(retryAfterSeconds);
        }
    }

    /** {@code 429} with the number of seconds after which a retry can succeed. */
    public static final class RateLimitedException extends ApiException {

        private static final long serialVersionUID = 1L;

        private final long retryAfterSeconds;

        RateLimitedException(long retryAfterSeconds) {
            super("RATE_LIMITED", HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please wait and try again.");
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public long retryAfterSeconds() {
            return retryAfterSeconds;
        }
    }
}
