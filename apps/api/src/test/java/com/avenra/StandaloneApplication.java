package com.avenra;

import java.util.Map;
import java.util.function.Consumer;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Starts the real application in-process with explicit properties, for tests that must observe
 * startup itself (log output, fail-fast behavior, degraded dependencies).
 */
public final class StandaloneApplication {

    private StandaloneApplication() {}

    /** Properties pointing at the shared test database, on a random port, with the test profile. */
    public static Map<String, Object> testProperties() {
        return Map.of(
                "spring.profiles.active", "test",
                "server.port", "0",
                "AVENRA_DB_URL", PostgresTestDatabase.jdbcUrl(),
                "AVENRA_DB_APP_USER", PostgresTestDatabase.APP_USER,
                "AVENRA_DB_APP_PASSWORD", PostgresTestDatabase.APP_PASSWORD,
                "AVENRA_DB_OWNER_USER", PostgresTestDatabase.OWNER_USER,
                "AVENRA_DB_OWNER_PASSWORD", PostgresTestDatabase.OWNER_PASSWORD);
    }

    /**
     * Properties are passed as command-line arguments, the highest-precedence property source, so
     * they override the application and profile YAML files just like real deployment overrides.
     */
    public static ConfigurableApplicationContext start(Map<String, Object> properties) {
        String[] args = properties.entrySet().stream()
                .map(entry -> "--" + entry.getKey() + "=" + entry.getValue())
                .toArray(String[]::new);
        return new SpringApplicationBuilder(AvenraApplication.class).run(args);
    }

    public static void withRunning(Map<String, Object> properties, Consumer<ConfigurableApplicationContext> test) {
        try (var context = start(properties)) {
            test.accept(context);
        }
    }

    public static int port(ConfigurableApplicationContext context) {
        return Integer.parseInt(context.getEnvironment().getRequiredProperty("local.server.port"));
    }
}
