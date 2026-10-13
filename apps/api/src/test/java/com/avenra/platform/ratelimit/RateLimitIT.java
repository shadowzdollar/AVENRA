package com.avenra.platform.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

/**
 * Rate limits through the API with strict limits (ADR-016, Phase 2 criterion 2.12): repeated
 * sign-in failures for one account are throttled with {@code 429} and {@code Retry-After}, without
 * affecting other accounts.
 */
@IntegrationTest
@TestPropertySource(properties = "avenra.rate-limits.policies.sign-in-account.capacity=3")
class RateLimitIT extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    @Test
    void repeatedSignInAttemptsForOneAccountAreThrottled() {
        String target = TestAccounts.newEmail();
        TestAccounts.signedIn(port, outbox, target); // uses 1 of the 3 attempts
        String other = TestAccounts.newEmail();
        TestAccounts.signedIn(port, outbox, other);
        var attacker = new BrowserClient(port);
        var wrong = Map.of("email", target, "password", "not-the-password-1");

        assertThat(attacker.post("/api/v1/auth/sign-in", wrong).code()).isEqualTo("INVALID_CREDENTIALS");
        assertThat(attacker.post("/api/v1/auth/sign-in", wrong).code()).isEqualTo("INVALID_CREDENTIALS");
        var limited = attacker.post("/api/v1/auth/sign-in", wrong);

        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.code()).isEqualTo("RATE_LIMITED");
        assertThat(limited.raw().headers().firstValue("Retry-After"))
                .hasValueSatisfying(
                        seconds -> assertThat(Long.parseLong(seconds)).isPositive());

        // Even the right password is refused while the account is throttled.
        assertThat(attacker.post("/api/v1/auth/sign-in", Map.of("email", target, "password", TestAccounts.PASSWORD))
                        .status())
                .isEqualTo(429);
        // Other accounts are unaffected.
        assertThat(attacker.post("/api/v1/auth/sign-in", Map.of("email", other, "password", TestAccounts.PASSWORD))
                        .status())
                .isEqualTo(200);
    }
}
