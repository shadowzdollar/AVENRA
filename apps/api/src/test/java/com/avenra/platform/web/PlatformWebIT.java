package com.avenra.platform.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import java.io.ByteArrayInputStream;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Proves the Phase 1 HTTP baseline over real HTTP: request ids, the structured error format,
 * deny-by-default security, secure headers, CORS, request size limits and health probes.
 */
@IntegrationTest
class PlatformWebIT extends IntegrationTestBase {

    private static final String UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

    @Autowired
    private JsonMapper json;

    private JsonNode body(HttpResponse<String> response) {
        return json.readTree(response.body());
    }

    private void assertError(HttpResponse<String> response, int status, String code) {
        assertThat(response.statusCode()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type"))
                .hasValueSatisfying(type -> assertThat(type).startsWith("application/json"));
        JsonNode body = body(response);
        assertThat(body.get("code").asString()).isEqualTo(code);
        assertThat(body.get("message").asString()).isNotBlank();
        assertThat(body.get("requestId").asString())
                .isEqualTo(response.headers().firstValue("X-Request-Id").orElseThrow());
        assertThat(response.body()).doesNotContain("Exception", "\tat ", "stackTrace", "trace");
    }

    private HttpResponse<String> postJson(String path, String json) {
        return send(request(path)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build());
    }

    @Nested
    class RequestIds {

        @Test
        void generatesAnIdWhenNoneIsSent() {
            assertThat(get("/health/liveness").headers().firstValue("X-Request-Id"))
                    .hasValueSatisfying(id -> assertThat(id).matches(UUID_PATTERN));
        }

        @Test
        void keepsAWellFormedInboundId() {
            var response = send(request("/health/liveness")
                    .header("X-Request-Id", "client-abc-12345")
                    .GET()
                    .build());

            assertThat(response.headers().firstValue("X-Request-Id")).hasValue("client-abc-12345");
        }

        @Test
        void replacesAnInboundIdThatCouldPolluteLogs() {
            var response = send(request("/health/liveness")
                    .header("X-Request-Id", "short")
                    .GET()
                    .build());

            assertThat(response.headers().firstValue("X-Request-Id"))
                    .hasValueSatisfying(id -> assertThat(id).matches(UUID_PATTERN));
        }
    }

    @Nested
    class Security {

        @Test
        void deniesUnknownPathsWithoutRevealingWhetherTheyExist() {
            assertError(get("/anything"), 401, "AUTHENTICATION_REQUIRED");
            assertError(get("/actuator/env"), 401, "AUTHENTICATION_REQUIRED");
        }

        @Test
        void sendsSecureHeaders() {
            var headers = get("/health/liveness").headers();

            assertThat(headers.firstValue("X-Content-Type-Options")).hasValue("nosniff");
            assertThat(headers.firstValue("X-Frame-Options")).hasValue("DENY");
            assertThat(headers.firstValue("Content-Security-Policy"))
                    .hasValue("default-src 'none'; frame-ancestors 'none'");
            assertThat(headers.firstValue("Referrer-Policy")).hasValue("no-referrer");
            assertThat(headers.firstValue("Permissions-Policy"))
                    .hasValueSatisfying(value -> assertThat(value).contains("camera=()"));
            assertThat(headers.firstValue("Cache-Control"))
                    .hasValueSatisfying(value -> assertThat(value).contains("no-store"));
        }

        @Test
        void allowsCorsOnlyForConfiguredOrigins() {
            var allowed = send(request("/health/liveness")
                    .header("Origin", "https://app.avenra.test")
                    .header("Access-Control-Request-Method", "GET")
                    .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                    .build());
            var denied = send(request("/health/liveness")
                    .header("Origin", "https://evil.example")
                    .header("Access-Control-Request-Method", "GET")
                    .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                    .build());

            assertThat(allowed.statusCode()).isEqualTo(200);
            assertThat(allowed.headers().firstValue("Access-Control-Allow-Origin"))
                    .hasValue("https://app.avenra.test");
            assertThat(denied.statusCode()).isEqualTo(403);
            assertThat(denied.headers().firstValue("Access-Control-Allow-Origin"))
                    .isEmpty();
        }
    }

    @Nested
    class ErrorFormat {

        @Test
        void hidesInternalsOfUnexpectedErrors() {
            var response = get("/__test/boom");

            assertError(response, 500, "INTERNAL_ERROR");
            assertThat(response.body()).doesNotContain(PlatformTestEndpoints.SECRET_IN_EXCEPTION, "IllegalState");
        }

        @Test
        void reportsValidationProblemsPerField() {
            var response = postJson("/__test/echo", "{\"name\":\"\"}");

            assertError(response, 400, "VALIDATION_FAILED");
            JsonNode details = body(response).get("details");
            assertThat(details).hasSize(1);
            assertThat(details.get(0).get("field").asString()).isEqualTo("name");
        }

        @Test
        void rejectsMalformedJson() {
            assertError(postJson("/__test/echo", "{not json"), 400, "MALFORMED_REQUEST");
        }

        @Test
        void rejectsUnsupportedContentType() {
            var response = send(request("/__test/echo")
                    .header("Content-Type", "text/plain")
                    .POST(HttpRequest.BodyPublishers.ofString("hello"))
                    .build());

            assertError(response, 415, "UNSUPPORTED_MEDIA_TYPE");
        }

        @Test
        void rejectsUnsupportedMethodAndListsAllowedOnes() {
            var response = get("/__test/echo");

            assertError(response, 405, "METHOD_NOT_ALLOWED");
            assertThat(response.headers().firstValue("Allow")).hasValue("POST");
        }

        @Test
        void returnsNotFoundForUnknownPathsOnceAccessIsPermitted() {
            assertError(get("/__test/does-not-exist"), 404, "NOT_FOUND");
        }

        @Test
        void acceptsAValidRequest() {
            var response = postJson("/__test/echo", "{\"name\":\"Avenra\"}");

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(body(response).get("name").asString()).isEqualTo("Avenra");
        }
    }

    @Nested
    class RequestSizeLimits {

        private static final String OVERSIZED = "{\"name\":\"" + "x".repeat(5 * 1024) + "\"}";

        @Test
        void rejectsADeclaredBodyOverTheLimit() {
            assertError(postJson("/__test/echo", OVERSIZED), 413, "PAYLOAD_TOO_LARGE");
        }

        @Test
        void rejectsAStreamedBodyOverTheLimit() {
            var response = send(request("/__test/echo")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofInputStream(
                            () -> new ByteArrayInputStream(OVERSIZED.getBytes())))
                    .build());

            assertError(response, 413, "PAYLOAD_TOO_LARGE");
        }
    }

    @Nested
    class Health {

        @Test
        void livenessIsUp() {
            var response = get("/health/liveness");

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(body(response).get("status").asString()).isEqualTo("UP");
        }

        @Test
        void readinessIsUpAndIncludesTheDatabaseWithoutExposingDetails() {
            var response = get("/health/readiness");

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(body(response).get("status").asString()).isEqualTo("UP");
            assertThat(body(response).has("components")).isFalse();
            assertThat(body(response).has("details")).isFalse();
        }

        @Test
        void aggregateHealthIsNotPublic() {
            assertError(get("/health"), 401, "AUTHENTICATION_REQUIRED");
        }
    }
}
