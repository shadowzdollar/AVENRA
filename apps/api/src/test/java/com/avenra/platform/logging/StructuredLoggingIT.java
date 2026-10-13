package com.avenra.platform.logging;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.PostgresTestDatabase;
import com.avenra.StandaloneApplication;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Proves the logging rules (Guidelines §62) on real output, from startup to shutdown: every line is
 * structured JSON, request lines carry the request id, and secrets never appear.
 */
@ExtendWith(OutputCaptureExtension.class)
class StructuredLoggingIT {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Test
    void logsAreStructuredCorrelatedAndFreeOfSecrets(CapturedOutput output) throws Exception {
        String requestId = "logging-it-req-0001";

        StandaloneApplication.withRunning(StandaloneApplication.testProperties(), context -> {
            var request = HttpRequest.newBuilder(
                            URI.create("http://localhost:" + StandaloneApplication.port(context) + "/health/liveness"))
                    .header("X-Request-Id", requestId)
                    .build();
            try {
                HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.discarding());
            } catch (Exception exception) {
                throw new IllegalStateException(exception);
            }
        });

        List<String> lines = output.getOut()
                .lines()
                .filter(line -> !line.isBlank())
                .filter(line -> !line.startsWith("WARNING:")) // JVM notices, not application logs
                .toList();

        assertThat(lines).isNotEmpty();
        List<JsonNode> entries = lines.stream().map(JSON::readTree).toList();

        assertThat(entries).allSatisfy(entry -> {
            assertThat(entry.has("@timestamp")).isTrue();
            assertThat(entry.get("@timestamp").asString()).endsWith("Z");
            assertThat(entry.at("/log/level").asString()).isNotBlank();
            assertThat(entry.at("/service/name").asString()).isEqualTo("avenra-api");
            assertThat(entry.at("/service/version").asString()).isEqualTo(System.getProperty("avenra.version"));
        });

        assertThat(entries)
                .filteredOn(entry ->
                        "Request completed".equals(entry.path("message").asString()))
                .singleElement()
                .satisfies(entry -> {
                    assertThat(entry.get("requestId").asString()).isEqualTo(requestId);
                    assertThat(entry.at("/url/path").asString()).isEqualTo("/health/liveness");
                    assertThat(entry.at("/http/response/status_code").asInt()).isEqualTo(200);
                    assertThat(entry.at("/http/request/method").asString()).isEqualTo("GET");
                });

        String everything = output.getAll();
        assertThat(everything)
                .doesNotContain(PostgresTestDatabase.APP_PASSWORD)
                .doesNotContain(PostgresTestDatabase.OWNER_PASSWORD)
                .doesNotContainIgnoringCase("generated security password");
    }
}
