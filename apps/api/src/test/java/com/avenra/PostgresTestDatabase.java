package com.avenra;

import java.nio.file.Path;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/**
 * A real PostgreSQL for integration tests, initialised with the same role script as local
 * development ({@code infrastructure/docker/postgres/init}), so tests exercise the real owner/app
 * role split rather than a superuser connection.
 *
 * <p>One container is shared by all integration tests in a JVM run.
 */
public final class PostgresTestDatabase {

    public static final String DATABASE = "avenra";
    public static final String OWNER_USER = "avenra_owner";
    public static final String OWNER_PASSWORD = "it-owner-K4mZ8pQw";
    public static final String APP_USER = "avenra_app";
    public static final String APP_PASSWORD = "it-app-7Q2xV9rT";

    private static final Path ROLE_SCRIPT = Path.of("../../infrastructure/docker/postgres/init/01-roles.sh");

    private static final PostgreSQLContainer CONTAINER = new PostgreSQLContainer("postgres:18.6")
            .withDatabaseName("postgres")
            .withUsername("postgres")
            .withPassword("test-superuser")
            .withEnv("AVENRA_DB_NAME", DATABASE)
            .withEnv("AVENRA_DB_OWNER_USER", OWNER_USER)
            .withEnv("AVENRA_DB_OWNER_PASSWORD", OWNER_PASSWORD)
            .withEnv("AVENRA_DB_APP_USER", APP_USER)
            .withEnv("AVENRA_DB_APP_PASSWORD", APP_PASSWORD)
            .withEnv("TZ", "UTC")
            .withEnv("PGTZ", "UTC")
            .withCopyFileToContainer(
                    MountableFile.forHostPath(ROLE_SCRIPT, 0755), "/docker-entrypoint-initdb.d/01-roles.sh");

    private PostgresTestDatabase() {}

    public static synchronized void start() {
        if (!CONTAINER.isRunning()) {
            CONTAINER.start();
        }
    }

    public static String jdbcUrl() {
        start();
        return "jdbc:postgresql://%s:%d/%s".formatted(CONTAINER.getHost(), CONTAINER.getMappedPort(5432), DATABASE);
    }

    /** Registers the same environment-driven properties the application reads in production. */
    public static void register(DynamicPropertyRegistry registry) {
        registry.add("AVENRA_DB_URL", PostgresTestDatabase::jdbcUrl);
        registry.add("AVENRA_DB_APP_USER", () -> APP_USER);
        registry.add("AVENRA_DB_APP_PASSWORD", () -> APP_PASSWORD);
        registry.add("AVENRA_DB_OWNER_USER", () -> OWNER_USER);
        registry.add("AVENRA_DB_OWNER_PASSWORD", () -> OWNER_PASSWORD);
    }
}
