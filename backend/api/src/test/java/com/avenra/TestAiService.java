package com.avenra;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Function;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * A stand-in for the AI service (ADR-029) speaking its wire format over real HTTP, so the API's
 * client, authentication, validation and error classification are exercised end to end. By default
 * it reads {@code Name: value} lines of text documents, like the AI service's fake provider; tests
 * can script other answers, including invalid ones and failures.
 */
public final class TestAiService {

    public static final String TOKEN = "test-ai-token-" + HexFormat.of().formatHex(random(16));

    /** What the stub answers: an HTTP status and a JSON body. */
    public record Answer(int status, Object body) {}

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final List<JsonNode> REQUESTS = new CopyOnWriteArrayList<>();
    private static volatile Function<JsonNode, Answer> responder = TestAiService::read;
    private static volatile Function<JsonNode, Answer> planner = TestAiService::plan;
    private static final List<JsonNode> PLAN_REQUESTS = new CopyOnWriteArrayList<>();
    private static HttpServer server;

    private TestAiService() {}

    public static synchronized String url() {
        if (server == null) {
            try {
                server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            } catch (IOException failure) {
                throw new UncheckedIOException(failure);
            }
            server.createContext("/v1/tasks/document-read", TestAiService::handle);
            server.createContext("/v1/tasks/work-plan", TestAiService::handlePlan);
            server.start();
        }
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    /** Requests received since the last {@link #reset}, as JSON. */
    public static List<JsonNode> requests() {
        return List.copyOf(REQUESTS);
    }

    public static void respond(Function<JsonNode, Answer> next) {
        responder = next;
    }

    public static void reset() {
        responder = TestAiService::read;
        planner = TestAiService::plan;
        REQUESTS.clear();
        PLAN_REQUESTS.clear();
    }

    /** Planning requests since the last {@link #reset}. */
    public static List<JsonNode> planRequests() {
        return List.copyOf(PLAN_REQUESTS);
    }

    public static void plan(Function<JsonNode, Answer> next) {
        planner = next;
    }

    private static void handlePlan(HttpExchange exchange) throws IOException {
        try (exchange) {
            Answer answer;
            if (!("Bearer " + TOKEN).equals(exchange.getRequestHeaders().getFirst("Authorization"))) {
                answer = new Answer(401, Map.of("code", "AUTHENTICATION_REQUIRED", "message", "x", "requestId", "r"));
            } else {
                JsonNode request = JSON.readTree(exchange.getRequestBody());
                PLAN_REQUESTS.add(request);
                answer = planner.apply(request);
            }
            byte[] body = JSON.writeValueAsBytes(answer.body());
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(answer.status(), body.length);
            exchange.getResponseBody().write(body);
        }
    }

    /** A plan with these steps, as the AI service would return it. */
    public static Answer planOf(List<Map<String, Object>> steps) {
        var invocation = invocation();
        invocation.put("prompt", Map.of("name", "work_plan", "version", 1, "sha256", "cd".repeat(32)));
        return new Answer(200, Map.of("summary", "A plan for the work.", "steps", steps, "invocation", invocation));
    }

    public static Map<String, Object> step(String tool, Map<String, Object> input) {
        return Map.of("tool", tool, "input", input, "reason", "Needed for this work.");
    }

    /** The default plan: two requirements, a task, and the request to the client. */
    public static Answer plan(JsonNode request) {
        return planOf(List.of(
                step(
                        "create_requirement",
                        Map.of(
                                "title", "Passport",
                                "kind", "DOCUMENT",
                                "required", true,
                                "instructions", "A clear copy of the photo page.")),
                step(
                        "create_requirement",
                        Map.of("title", "Date of birth", "kind", "DATE", "required", true, "instructions", "")),
                step("create_task", Map.of("title", "Review the documents", "completionCondition", "All accepted.")),
                step("send_information_request", Map.of("message", "Please send the items below."))));
    }

    private static void handle(HttpExchange exchange) throws IOException {
        try (exchange) {
            Answer answer;
            if (!("Bearer " + TOKEN).equals(exchange.getRequestHeaders().getFirst("Authorization"))) {
                answer = new Answer(401, Map.of("code", "AUTHENTICATION_REQUIRED", "message", "x", "requestId", "r"));
            } else {
                JsonNode request = JSON.readTree(exchange.getRequestBody());
                REQUESTS.add(request);
                answer = responder.apply(request);
            }
            byte[] body = JSON.writeValueAsBytes(answer.body());
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(answer.status(), body.length);
            exchange.getResponseBody().write(body);
        }
    }

    public static Map<String, Object> invocation() {
        var invocation = new LinkedHashMap<String, Object>();
        invocation.put("provider", "fake");
        invocation.put("modelRequested", "fake");
        invocation.put("model", "fake");
        invocation.put("prompt", Map.of("name", "document_read", "version", 1, "sha256", "ab".repeat(32)));
        invocation.put(
                "usage", Map.of("inputTokens", 120, "outputTokens", 30, "cacheReadTokens", 0, "cacheWriteTokens", 0));
        invocation.put("latencyMs", 5);
        invocation.put("estimatedCostMicros", 540);
        invocation.put("fallbackUsed", false);
        return invocation;
    }

    public static Answer failure(int status, String code, boolean retryable, boolean withInvocation) {
        var body = new LinkedHashMap<String, Object>();
        body.put("code", code);
        body.put("message", "failed");
        body.put("requestId", "r");
        body.put("retryable", retryable);
        body.put("detail", code.toLowerCase(Locale.ROOT));
        body.put("invocation", withInvocation ? invocation() : null);
        return new Answer(status, body);
    }

    /** The default: reads {@code Name: value} lines; the kind is the first label in the heading. */
    public static Answer read(JsonNode request) {
        String text = request.path("contentType").asString().startsWith("text/")
                ? new String(Base64.getDecoder().decode(request.path("content").asString()), StandardCharsets.UTF_8)
                : "";
        String heading = text.lines().limit(3).reduce("", (a, b) -> a + " " + b).toLowerCase(Locale.ROOT);
        var body = new LinkedHashMap<String, Object>();
        var kinds = new ArrayList<String>();
        request.path("kinds").forEach(kind -> kinds.add(kind.asString()));
        if (!kinds.isEmpty()) {
            String label = kinds.stream()
                    .filter(kind -> heading.contains(kind.toLowerCase(Locale.ROOT)))
                    .findFirst()
                    .orElse("other");
            body.put("kind", Map.of("label", label, "confidence", 0.9));
        } else {
            body.put("kind", null);
        }
        var fields = new ArrayList<Map<String, Object>>();
        for (JsonNode field : request.path("fields")) {
            String name = field.path("name").asString();
            var line = text.lines()
                    .filter(candidate -> Pattern.compile(
                                    "^\\s*" + Pattern.quote(name) + "\\s*:", Pattern.CASE_INSENSITIVE)
                            .matcher(candidate)
                            .find())
                    .findFirst();
            var entry = new LinkedHashMap<String, Object>();
            entry.put("name", name);
            entry.put("kind", field.path("kind").asString());
            entry.put("found", line.isPresent());
            entry.put(
                    "value",
                    line.map(found -> found.substring(found.indexOf(':') + 1).strip())
                            .orElse(null));
            entry.put("quote", line.map(String::strip).orElse(null));
            entry.put("page", line.isPresent() ? 1 : null);
            entry.put("located", line.isPresent() ? true : null);
            fields.add(entry);
        }
        body.put("fields", fields);
        boolean suspicious = text.toLowerCase(Locale.ROOT).contains("ignore all previous instructions");
        body.put("instructionsDetected", suspicious);
        body.put(
                "proposals",
                suspicious
                        ? List.of(Map.of(
                                "tool",
                                "flag_for_review",
                                "risk",
                                "LOW",
                                "input",
                                Map.of("reason", "Text for an AI reader.")))
                        : List.of());
        body.put("source", text.isEmpty() ? "FILE" : "TEXT");
        body.put("retrieval", null);
        body.put("invocation", invocation());
        return new Answer(200, body);
    }

    private static byte[] random(int bytes) {
        byte[] value = new byte[bytes];
        new SecureRandom().nextBytes(value);
        return value;
    }
}
