package com.avenra;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.GenericContainer;

/**
 * Real infrastructure for integration tests besides PostgreSQL: Redis (rate limiting) and a fresh
 * random encryption key per test run, so no key material is ever committed.
 */
public final class TestServices {

    private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:8.10.2").withExposedPorts(6379);

    public static final String CRYPTO_KEY_ID = "test1";
    private static final String CRYPTO_KEY = randomKey();

    private TestServices() {}

    public static synchronized String redisUrl() {
        if (!REDIS.isRunning()) {
            REDIS.start();
        }
        return "redis://" + REDIS.getHost() + ":" + REDIS.getMappedPort(6379);
    }

    /** Everything besides the database, as property name to value. */
    public static Map<String, Object> properties() {
        return Map.of(
                "AVENRA_REDIS_URL",
                redisUrl(),
                "AVENRA_CRYPTO_ACTIVE_KEY_ID",
                CRYPTO_KEY_ID,
                "avenra.crypto.keys." + CRYPTO_KEY_ID,
                CRYPTO_KEY);
    }

    public static void register(DynamicPropertyRegistry registry) {
        properties().forEach((name, value) -> registry.add(name, () -> value));
    }

    private static String randomKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}
