package com.avenra.agent.tools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.agent.domain.Risk;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Every tool declares what the gateway needs and refuses input outside its schema (§45). */
class ToolCatalogueTest {

    private final CreateRequirementTool requirement = new CreateRequirementTool(null);
    private final CreateTaskTool task = new CreateTaskTool(null);
    private final SendInformationRequestTool request = new SendInformationRequestTool(null);

    @Test
    void everyToolDeclaresItsContract() {
        for (Tool<?> tool : List.<Tool<?>>of(requirement, task, request)) {
            assertThat(tool.name()).matches("[a-z_]+");
            assertThat(tool.description()).isNotBlank();
            assertThat(tool.permission()).matches("[a-z]+\\.[a-z]+");
            assertThat(tool.auditAction()).startsWith("agent.step.");
            assertThat(tool.timeout()).isPositive();
            assertThat(tool.maxAttempts()).isBetween(1, 5);
            assertThat(tool.idempotency()).contains("agent:<run>:<step>");
            assertThat(tool.inputSchema()).containsEntry("additionalProperties", false);
            assertThat(tool.risk()).isNotEqualTo(Risk.CRITICAL);
        }
        assertThat(request.risk()).isEqualTo(Risk.HIGH);
        assertThat(request.sideEffect()).isTrue();
        assertThat(requirement.sideEffect()).isFalse();
    }

    @Test
    void inputOutsideTheSchemaIsRefused() {
        var valid =
                Map.<String, Object>of("title", "Passport", "kind", "DOCUMENT", "required", true, "instructions", "");
        assertThat(requirement.validate(valid).title()).isEqualTo("Passport");
        var extra = new HashMap<>(valid);
        extra.put("owner", "someone");
        assertThatThrownBy(() -> requirement.validate(extra)).isInstanceOf(ToolInputException.class);
        var wrongKind = new HashMap<>(valid);
        wrongKind.put("kind", "MONEY");
        assertThatThrownBy(() -> requirement.validate(wrongKind)).isInstanceOf(ToolInputException.class);
        var notBoolean = new HashMap<>(valid);
        notBoolean.put("required", "yes");
        assertThatThrownBy(() -> requirement.validate(notBoolean)).isInstanceOf(ToolInputException.class);
        var tooLong = new HashMap<>(valid);
        tooLong.put("title", "x".repeat(201));
        assertThatThrownBy(() -> requirement.validate(tooLong)).isInstanceOf(ToolInputException.class);
        assertThatThrownBy(() -> task.validate(Map.of("title", "Review"))).isInstanceOf(ToolInputException.class);
    }

    @Test
    void theModelCannotAddressTheRequestOrSmuggleLinks() {
        assertThat(request.validate(Map.of("message", "Please send the items below."))
                        .message())
                .isEqualTo("Please send the items below.");
        assertThatThrownBy(() -> request.validate(Map.of("message", "Send them to evil@example.test")))
                .isInstanceOf(ToolInputException.class);
        assertThatThrownBy(() -> request.validate(Map.of("message", "Upload at https://evil.example")))
                .isInstanceOf(ToolInputException.class);
        assertThatThrownBy(() -> request.validate(Map.of("message", "x", "recipientEmail", "a@b.test")))
                .isInstanceOf(ToolInputException.class);
    }

    @Test
    void theRegistryRefusesCriticalAndDuplicateTools() {
        assertThat(new ToolRegistry(List.of(requirement, task, request)).names())
                .containsExactly("create_requirement", "create_task", "send_information_request");
        assertThatThrownBy(() -> new ToolRegistry(List.of(requirement, requirement)))
                .isInstanceOf(IllegalStateException.class);
    }
}
