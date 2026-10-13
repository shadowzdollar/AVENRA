package com.avenra.platform.observability;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.StandaloneApplication;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.sdk.testing.exporter.InMemorySpanExporter;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.data.SpanData;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Proves end-to-end tracing (Guidelines §60): one request produces one trace from the HTTP server
 * span down to the SQL statement; the trace carries the request id; inbound W3C trace context is
 * continued; and the request's log line carries the same trace id.
 *
 * <p>Runs the real application (tracing is switched off in ordinary Spring Boot tests) with an
 * in-memory span exporter.
 */
@ExtendWith(OutputCaptureExtension.class)
class TracingIT {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    /** Captures exported spans in memory instead of sending them over OTLP. */
    @Configuration(proxyBeanMethods = false)
    static class InMemoryExport {

        @Bean
        InMemorySpanExporter inMemorySpanExporter() {
            return InMemorySpanExporter.create();
        }
    }

    @Test
    void oneRequestIsOneTraceFromHttpToSql(CapturedOutput output) {
        String requestId = "tracing-it-req-0001";
        String inboundTraceId = "4bf92f3577b34da6a3ce929d0e0e4736";
        String traceparent = "00-" + inboundTraceId + "-00f067aa0ba902b7-01";

        List<SpanData> spans = new ArrayList<>();
        StandaloneApplication.withRunning(StandaloneApplication.testProperties(), InMemoryExport.class, context -> {
            int status = get(context, "/__test/db", Map.of("X-Request-Id", requestId, "traceparent", traceparent));
            assertThat(status).isEqualTo(200);
            spans.addAll(flushedSpans(context));
        });

        // The inbound trace is continued, not replaced.
        List<SpanData> trace = spans.stream()
                .filter(span -> span.getTraceId().equals(inboundTraceId))
                .toList();
        assertThat(trace).as("spans of the inbound trace").isNotEmpty();

        SpanData server = trace.stream()
                .filter(span -> span.getName().startsWith("http get"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no HTTP server span in " + names(trace)));
        assertThat(server.getAttributes().get(AttributeKey.stringKey("avenra.request_id")))
                .isEqualTo(requestId);

        Map<String, SpanData> byId = trace.stream().collect(Collectors.toMap(SpanData::getSpanId, Function.identity()));
        SpanData sql = trace.stream()
                .filter(span -> span.getName().equals("query"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no SQL span in " + names(trace)));
        assertThat(isDescendant(sql, server, byId))
                .as("the SQL span is inside the HTTP span")
                .isTrue();

        JsonNode requestLog = output.getOut()
                .lines()
                .filter(line -> line.startsWith("{"))
                .map(JSON::readTree)
                .filter(entry ->
                        "Request completed".equals(entry.path("message").asString()))
                .filter(entry -> requestId.equals(entry.path("requestId").asString()))
                .findFirst()
                .orElseThrow();
        assertThat(requestLog.path("traceId").asString()).isEqualTo(inboundTraceId);
        assertThat(requestLog.path("spanId").asString()).matches("[0-9a-f]{16}");
    }

    private static List<SpanData> flushedSpans(ConfigurableApplicationContext context) {
        context.getBean(SdkTracerProvider.class).forceFlush().join(10, java.util.concurrent.TimeUnit.SECONDS);
        return context.getBean(InMemorySpanExporter.class).getFinishedSpanItems();
    }

    private static boolean isDescendant(SpanData span, SpanData ancestor, Map<String, SpanData> byId) {
        for (SpanData current = span; current != null; current = byId.get(current.getParentSpanId())) {
            if (current.getSpanId().equals(ancestor.getSpanId())) {
                return true;
            }
        }
        return false;
    }

    private static List<String> names(List<SpanData> spans) {
        return spans.stream().map(SpanData::getName).toList();
    }

    private static int get(ConfigurableApplicationContext context, String path, Map<String, String> headers) {
        var request =
                HttpRequest.newBuilder(URI.create("http://localhost:" + StandaloneApplication.port(context) + path));
        headers.forEach(request::header);
        try {
            return HttpClient.newHttpClient()
                    .send(request.build(), HttpResponse.BodyHandlers.discarding())
                    .statusCode();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
