package com.avenra.ai.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.ai.AiProperties;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** The API validates what the AI service returns a second time: it is model output (ADR-029). */
class AiServiceClientTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final List<String> KINDS = List.of("passport");
    private static final List<AiServiceClient.Field> FIELDS = List.of(new AiServiceClient.Field("Surname", "TEXT"));

    private static JsonNode answer(String kind, String field, String proposals) {
        return JSON.readTree("{\"kind\":" + kind + ",\"fields\":[" + field + "],\"instructionsDetected\":false,"
                + "\"proposals\":[" + proposals + "],\"source\":\"TEXT\"}");
    }

    private static final String KIND = "{\"label\":\"passport\",\"confidence\":0.9}";
    private static final String FIELD = "{\"name\":\"Surname\",\"kind\":\"TEXT\",\"found\":true,\"value\":\"Doe\","
            + "\"quote\":\"Surname: Doe\",\"page\":1,\"located\":true}";

    @Test
    void aReadingThatMatchesTheRequestIsAccepted() {
        var reading = AiServiceClient.reading(answer(KIND, FIELD, ""), KINDS, FIELDS, "claude-sonnet-5-5");
        assertThat(reading.kind().label()).isEqualTo("passport");
        assertThat(reading.fields().getFirst().value()).isEqualTo("Doe");
        assertThat(reading.model()).isEqualTo("claude-sonnet-5-5");
    }

    @Test
    void anythingOutsideTheRequestRejectsTheWholeReading() {
        assertThatThrownBy(() -> AiServiceClient.reading(
                        answer("{\"label\":\"visa\",\"confidence\":0.9}", FIELD, ""), KINDS, FIELDS, null))
                .hasMessageContaining("kind");
        assertThatThrownBy(() -> AiServiceClient.reading(
                        answer(KIND, FIELD.replace("Surname", "Nationality"), ""), KINDS, FIELDS, null))
                .hasMessageContaining("not asked for");
        assertThatThrownBy(() -> AiServiceClient.reading(answer(KIND, FIELD + "," + FIELD, ""), KINDS, FIELDS, null))
                .hasMessageContaining("repeated");
        assertThatThrownBy(() -> AiServiceClient.reading(answer(KIND, "", ""), KINDS, FIELDS, null))
                .hasMessageContaining("missing");
        assertThatThrownBy(() -> AiServiceClient.reading(
                        answer(KIND, FIELD.replace("\"Doe\"", "\"" + "x".repeat(501) + "\""), ""), KINDS, FIELDS, null))
                .hasMessageContaining("too long");
        assertThatThrownBy(() -> AiServiceClient.reading(
                        answer(KIND, FIELD.replace("\"found\":true", "\"found\":false"), ""), KINDS, FIELDS, null))
                .hasMessageContaining("found");
        assertThatThrownBy(() -> AiServiceClient.reading(
                        answer(KIND, FIELD, "{\"tool\":\"send_email\",\"risk\":\"LOW\",\"input\":{\"reason\":\"x\"}}"),
                        KINDS,
                        FIELDS,
                        null))
                .hasMessageContaining("catalogue");
    }

    @Test
    void theServiceTokenNeverAppearsInTheSettingsDescription() {
        var properties = new AiProperties(
                URI.create("http://127.0.0.1:8090"),
                "secret-token-0123456789abcdef0123456789",
                Duration.ofSeconds(1),
                1);
        assertThat(properties.toString()).doesNotContain("secret-token");
    }
}
