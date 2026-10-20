package com.avenra.ai.infrastructure;

import com.avenra.ai.AiProperties;
import com.avenra.ai.DocumentReading;
import io.micrometer.observation.ObservationRegistry;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Calls the AI service's tasks (ADR-029). Authenticates with the service token, propagates the
 * trace through the client observation, and classifies every failure as retryable or not
 * (Guidelines §103). The answer is validated again here: what the AI service returns is model
 * output, and model output is untrusted.
 */
@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    static final int MAX_VALUE = 500;
    static final int MAX_QUOTE = 1_000;
    static final int MAX_REASON = 300;
    static final Set<String> TOOLS = Set.of("request_clearer_copy", "flag_for_review");
    static final Set<String> RISKS = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");

    /** What one call cost and who answered, as the AI service reported it (ADR-030). */
    public record Invocation(
            String provider,
            String modelRequested,
            @Nullable String model,
            String promptName,
            int promptVersion,
            String promptSha256,
            int inputTokens,
            int outputTokens,
            int cacheReadTokens,
            int cacheWriteTokens,
            int latencyMs,
            @Nullable Long estimatedCostMicros) {}

    public record Field(String name, String kind) {}

    public sealed interface Result permits Success, Failure {}

    public record Success(DocumentReading reading, Invocation invocation) implements Result {}

    /**
     * @param invocation present when a model was called and cost was incurred, so it is recorded
     */
    public record Failure(
            String code, boolean retryable, @Nullable Invocation invocation, String detail) implements Result {}

    private final RestClient http;
    private final JsonMapper json;

    AiServiceClient(AiProperties properties, ObservationRegistry observations, JsonMapper json) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build());
        factory.setReadTimeout(properties.timeout());
        this.http = RestClient.builder()
                .baseUrl(properties.url().toString())
                .requestFactory(factory)
                .observationRegistry(observations)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.serviceToken())
                .build();
        this.json = json;
    }

    public Result readDocument(String contentType, byte[] content, List<String> kinds, List<Field> fields) {
        var body = new LinkedHashMap<String, Object>();
        body.put("contentType", contentType);
        body.put("content", Base64.getEncoder().encodeToString(content));
        body.put("kinds", kinds);
        body.put("fields", fields);
        try {
            return http.post()
                    .uri("/v1/tasks/document-read")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(json.writeValueAsString(body))
                    .exchange((request, response) -> {
                        JsonNode answer = read(response.getBody());
                        if (response.getStatusCode().is2xxSuccessful()) {
                            return success(answer, kinds, fields);
                        }
                        return failure(response.getStatusCode().value(), answer);
                    });
        } catch (ResourceAccessException unreachable) {
            boolean timedOut = unreachable.getCause() instanceof java.net.http.HttpTimeoutException;
            log.warn("AI service unreachable", unreachable);
            return new Failure(
                    timedOut ? "TIMEOUT" : "AI_SERVICE_UNAVAILABLE", true, null, "the AI service did not answer");
        }
    }

    private @Nullable JsonNode read(InputStream body) {
        try {
            return json.readTree(body);
        } catch (JacksonException unreadable) {
            return null;
        }
    }

    private static Failure failure(int status, @Nullable JsonNode answer) {
        if (answer == null || !answer.path("code").isString()) {
            // Not the AI service's error format: a proxy or a crash. Server errors may pass.
            return new Failure("AI_SERVICE_ERROR", status >= 500, null, "the AI service answered " + status);
        }
        String code = answer.path("code").asString();
        if (status == 401) {
            return new Failure("AI_SERVICE_REJECTED_TOKEN", false, null, "the AI service refused the service token");
        }
        boolean retryable = answer.path("retryable").asBoolean(status >= 500);
        Invocation invocation = answer.path("invocation").isObject() ? invocation(answer.path("invocation")) : null;
        return new Failure(code, retryable, invocation, text(answer.path("detail"), MAX_REASON, code));
    }

    private static Result success(@Nullable JsonNode answer, List<String> kinds, List<Field> fields) {
        if (answer == null || !answer.path("invocation").isObject()) {
            return new Failure("INVALID_OUTPUT", false, null, "the AI service's answer could not be read");
        }
        Invocation invocation = invocation(answer.path("invocation"));
        try {
            return new Success(reading(answer, kinds, fields, invocation.model()), invocation);
        } catch (IllegalArgumentException invalid) {
            return new Failure("INVALID_OUTPUT", false, invocation, invalid.getMessage());
        }
    }

    /** Re-checks the reading against what was asked; anything else rejects the whole answer. */
    static DocumentReading reading(JsonNode answer, List<String> kinds, List<Field> fields, @Nullable String model) {
        DocumentReading.Kind kind = null;
        if (!answer.path("kind").isNull() && !answer.path("kind").isMissingNode()) {
            String label = answer.path("kind").path("label").asString("");
            boolean offered = label.equals("other") || kinds.contains(label);
            BigDecimal confidence = answer.path("kind").path("confidence").decimalValue();
            if (kinds.isEmpty() || !offered || confidence.signum() < 0 || confidence.compareTo(BigDecimal.ONE) > 0) {
                throw new IllegalArgumentException("the kind is not one that was asked for");
            }
            kind = new DocumentReading.Kind(label, confidence);
        }
        Map<String, String> asked = new LinkedHashMap<>();
        fields.forEach(field -> asked.put(field.name(), field.kind()));
        var read = new ArrayList<DocumentReading.Field>();
        for (JsonNode node : answer.path("fields")) {
            String name = node.path("name").asString("");
            String expectedKind = asked.remove(name);
            if (expectedKind == null || !expectedKind.equals(node.path("kind").asString(""))) {
                throw new IllegalArgumentException("a field was not asked for or repeated");
            }
            boolean found = node.path("found").asBoolean(false);
            String value = optional(node.path("value"), MAX_VALUE);
            String quote = optional(node.path("quote"), MAX_QUOTE);
            if (found != (value != null)) {
                throw new IllegalArgumentException("a field's value does not match whether it was found");
            }
            Integer page = node.path("page").isInt() ? node.path("page").intValue() : null;
            Boolean located =
                    node.path("located").isBoolean() ? node.path("located").booleanValue() : null;
            read.add(new DocumentReading.Field(name, expectedKind, found, value, quote, page, located));
        }
        if (!asked.isEmpty()) {
            throw new IllegalArgumentException("a requested field is missing");
        }
        var proposals = new ArrayList<DocumentReading.Proposal>();
        for (JsonNode node : answer.path("proposals")) {
            String tool = node.path("tool").asString("");
            String risk = node.path("risk").asString("");
            String reason = optional(node.path("input").path("reason"), MAX_REASON);
            if (!TOOLS.contains(tool) || !RISKS.contains(risk) || reason == null) {
                throw new IllegalArgumentException("a proposal is not from the catalogue");
            }
            proposals.add(new DocumentReading.Proposal(tool, risk, reason));
        }
        String source = answer.path("source").asString("");
        if (!source.equals("TEXT") && !source.equals("FILE")) {
            throw new IllegalArgumentException("the source is unknown");
        }
        return new DocumentReading(
                kind, read, answer.path("instructionsDetected").asBoolean(false), proposals, source, model);
    }

    private static Invocation invocation(JsonNode node) {
        JsonNode prompt = node.path("prompt");
        JsonNode usage = node.path("usage");
        JsonNode cost = node.path("estimatedCostMicros");
        return new Invocation(
                text(node.path("provider"), 40, "unknown"),
                text(node.path("modelRequested"), 100, "unknown"),
                node.path("model").isString() ? text(node.path("model"), 100, "unknown") : null,
                text(prompt.path("name"), 60, "unknown"),
                Math.max(1, prompt.path("version").asInt(1)),
                sha(prompt.path("sha256").asString("")),
                Math.max(0, usage.path("inputTokens").asInt(0)),
                Math.max(0, usage.path("outputTokens").asInt(0)),
                Math.max(0, usage.path("cacheReadTokens").asInt(0)),
                Math.max(0, usage.path("cacheWriteTokens").asInt(0)),
                Math.max(0, node.path("latencyMs").asInt(0)),
                cost.isIntegralNumber() && cost.longValue() >= 0 ? cost.longValue() : null);
    }

    private static String sha(String value) {
        return value.matches("[0-9a-f]{64}") ? value : "0".repeat(64);
    }

    private static @Nullable String optional(JsonNode node, int max) {
        if (!node.isString()) {
            return null;
        }
        String value = node.asString();
        if (value.length() > max) {
            throw new IllegalArgumentException("a value is too long");
        }
        return value;
    }

    private static String text(JsonNode node, int max, String fallback) {
        String value = node.isString() ? node.asString() : fallback;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
