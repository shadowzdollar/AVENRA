package com.avenra.platform.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.StandaloneApplication;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import org.junit.jupiter.api.Test;

/**
 * Readiness must reflect the database while liveness must not (Guidelines §94): with the database
 * unreachable the process is alive but not ready for traffic.
 */
class ReadinessWithoutDatabaseIT {

    @Test
    void isAliveButNotReadyWhenTheDatabaseIsUnreachable() {
        var properties = new HashMap<>(StandaloneApplication.testProperties());
        // Nothing listens on port 1. Startup must not need the database for this scenario.
        properties.put("AVENRA_DB_URL", "jdbc:postgresql://127.0.0.1:1/avenra");
        properties.put("spring.flyway.enabled", "false");
        properties.put("spring.datasource.hikari.initialization-fail-timeout", "-1");
        properties.put("spring.datasource.hikari.connection-timeout", "1000");
        properties.put("spring.jpa.hibernate.ddl-auto", "none");
        properties.put("spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access", "false");
        properties.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

        StandaloneApplication.withRunning(properties, context -> {
            int port = StandaloneApplication.port(context);

            assertThat(status(port, "/health/liveness")).isEqualTo(200);
            assertThat(status(port, "/health/readiness")).isEqualTo(503);
        });
    }

    private static int status(int port, String path) {
        try {
            return HttpClient.newHttpClient()
                    .send(
                            HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                                    .build(),
                            HttpResponse.BodyHandlers.discarding())
                    .statusCode();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
