package com.avenra.agent.tools;

import com.avenra.agent.InformationTools;
import com.avenra.agent.domain.Risk;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Adds a requirement to the run's own work. MEDIUM: reversible, inside Avenra. */
@Component
class CreateRequirementTool implements Tool<CreateRequirementTool.Input> {

    static final Set<String> KINDS = Set.of("TEXT", "NUMBER", "DATE", "BOOLEAN", "DOCUMENT");

    record Input(String title, String kind, boolean required, String instructions) {}

    private final InformationTools information;

    CreateRequirementTool(InformationTools information) {
        this.information = information;
    }

    @Override
    public String name() {
        return "create_requirement";
    }

    @Override
    public String description() {
        return "Add a requirement (information or a document the client must provide) to this work.";
    }

    @Override
    public Risk risk() {
        return Risk.MEDIUM;
    }

    @Override
    public String permission() {
        return "work.update";
    }

    @Override
    public String auditAction() {
        return "agent.step.create_requirement";
    }

    @Override
    public Duration timeout() {
        return Duration.ofSeconds(10);
    }

    @Override
    public int maxAttempts() {
        return 3;
    }

    @Override
    public boolean sideEffect() {
        return false;
    }

    @Override
    public Map<String, Object> inputSchema() {
        return Map.of(
                "type",
                "object",
                "required",
                List.of("title", "kind", "required", "instructions"),
                "additionalProperties",
                false,
                "properties",
                Map.of(
                        "title", Inputs.string(200),
                        "kind", Map.of("type", "string", "enum", List.copyOf(KINDS)),
                        "required", Map.of("type", "boolean"),
                        "instructions", Inputs.string(1000)));
    }

    @Override
    public Input validate(Map<String, Object> raw) {
        Inputs.only(raw, Set.of("title", "kind", "required", "instructions"));
        return new Input(
                Inputs.text(raw, "title", 200, true),
                Inputs.oneOf(raw, "kind", KINDS),
                Inputs.bool(raw, "required"),
                Inputs.text(raw, "instructions", 1000, false));
    }

    @Override
    public String describe(Input input) {
        return "Ask for \"" + input.title() + "\" (" + input.kind().toLowerCase(java.util.Locale.ROOT)
                + (input.required() ? ", required" : ", optional") + ")";
    }

    @Override
    public Outcome execute(Context context, Input input) {
        var id = information.createRequirement(
                context.userId(),
                context.organizationId(),
                context.workId(),
                context.idempotencyKey(),
                input.title(),
                input.kind(),
                input.required(),
                input.instructions());
        return new Outcome(id, "Added the requirement \"" + input.title() + "\".");
    }

    @Override
    public boolean verify(Context context, Input input, Outcome outcome) {
        return information.requirementExists(
                context.organizationId(), context.workId(), outcome.resourceId(), input.title());
    }
}
