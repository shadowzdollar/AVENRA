package com.avenra.platform.ratelimit;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.avenra.platform.web.ApiException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

/** When Redis is unavailable, credential policies deny and others allow (ADR-016). */
class RateLimiterFailureModeTest {

    @SuppressWarnings("unchecked")
    private static RateLimiter limiterWithBrokenRedis() {
        var redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenThrow(new RedisConnectionFailureException("down"));
        var policy = new RateLimitProperties.Policy(5, Duration.ofMinutes(1));
        return new RateLimiter(
                redis, new RateLimitProperties(Map.of("sign-in", policy, "default", policy), Set.of("sign-in")));
    }

    @Test
    void credentialPoliciesFailClosed() {
        assertThatThrownBy(() -> limiterWithBrokenRedis().consume("sign-in", "ip:203.0.113.4"))
                .isInstanceOfSatisfying(
                        ApiException.class,
                        exception -> org.assertj.core.api.Assertions.assertThat(exception.code())
                                .isEqualTo("SERVICE_UNAVAILABLE"));
    }

    @Test
    void otherPoliciesFailOpen() {
        assertThatCode(() -> limiterWithBrokenRedis().consume("default", "ip:203.0.113.4"))
                .doesNotThrowAnyException();
    }

    @Test
    void unknownPoliciesAreAProgrammingError() {
        assertThatThrownBy(() -> limiterWithBrokenRedis().consume("no-such-policy", "x"))
                .isInstanceOf(IllegalStateException.class);
    }
}
