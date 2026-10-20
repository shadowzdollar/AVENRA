package com.avenra.agent.tools;

import com.avenra.agent.WorkTools;
import com.avenra.agent.domain.Risk;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Adds an internal task to the run's own work. MEDIUM: reversible, inside Avenra. */
@Component
class CreateTaskTool implements Tool<CreateTaskTool.Input> {

    record Input(String title, String completionCondition) {}

    private final WorkTools work;

    CreateTaskTool(WorkTools work) {
        this.work = work;
    }

    @Override
    public String name() {
        return "create_task";
    }

    @Override
    public String description() {
        return "Add an internal task for a person at the firm to this work.";
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
        return "agent.step.create_task";
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
                List.of("title", "completionCondition"),
                "additionalProperties",
                false,
                "properties",
                Map.of("title", Inputs.string(200), "completionCondition", Inputs.string(500)));
    }

    @Override
    public Input validate(Map<String, Object> raw) {
        Inputs.only(raw, Set.of("title", "completionCondition"));
        return new Input(Inputs.text(raw, "title", 200, true), Inputs.text(raw, "completionCondition", 500, true));
    }

    @Override
    public String describe(Input input) {
        return "Add the task \"" + input.title() + "\" (done when: " + input.completionCondition() + ")";
    }

    @Override
    public Outcome execute(Context context, Input input) {
        var id = work.createTask(
                context.userId(),
                context.organizationId(),
                context.workId(),
                context.idempotencyKey(),
                input.title(),
                input.completionCondition());
        return new Outcome(id, "Added the task \"" + input.title() + "\".");
    }

    @Override
    public boolean verify(Context context, Input input, Outcome outcome) {
        return work.taskExists(context.organizationId(), context.workId(), outcome.resourceId(), input.title());
    }
}
