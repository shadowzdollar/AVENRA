package com.avenra.agent.application;

import com.avenra.agent.infrastructure.AgentRepository.RunRow;
import com.avenra.agent.infrastructure.AgentRepository.StepRow;
import com.avenra.agent.tools.Tool;
import com.avenra.agent.tools.ToolRegistry;
import com.avenra.contract.v1.model.AgentBudget;
import com.avenra.contract.v1.model.AgentRun;
import com.avenra.contract.v1.model.AgentRunStatus;
import com.avenra.contract.v1.model.AgentStep;
import com.avenra.contract.v1.model.AgentStepStatus;
import com.avenra.contract.v1.model.ToolRisk;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Runs and steps as the contract shows them (ADR-008). */
@Component
class AgentViews {

    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {};

    private final ToolRegistry tools;
    private final JsonMapper json;

    AgentViews(ToolRegistry tools, JsonMapper json) {
        this.tools = tools;
        this.json = json;
    }

    Map<String, Object> input(StepRow step) {
        return json.readValue(step.input(), MAP);
    }

    AgentRun run(RunRow run, List<StepRow> steps) {
        var b = run.budget();
        var budget = new AgentBudget(
                b.maxModelCalls(),
                b.maxToolCalls(),
                b.maxSideEffects(),
                b.modelCalls(),
                b.toolCalls(),
                b.sideEffects(),
                b.maxCostMicros(),
                b.costMicros(),
                utc(b.deadline()));
        return new AgentRun(
                        run.id(),
                        run.workId(),
                        AgentRun.CapabilityEnum.fromValue(run.capability()),
                        AgentRunStatus.fromValue(run.status().name()),
                        run.startedBy(),
                        budget,
                        steps.stream().map(this::step).toList(),
                        utc(run.createdAt()))
                .summary(run.summary())
                .stopReason(run.stopReason())
                .traceId(run.traceId())
                .finishedAt(utcOrNull(run.finishedAt()));
    }

    private AgentStep step(StepRow step) {
        var input = input(step);
        return new AgentStep(
                        step.id(),
                        step.position(),
                        AgentStep.ToolEnum.fromValue(step.tool()),
                        ToolRisk.fromValue(step.risk().name()),
                        input,
                        AgentStepStatus.fromValue(step.status().name()),
                        step.risk().needsOwnApproval(),
                        step.attempts())
                .description(describe(step.tool(), input))
                .reason(step.reason())
                .approvedByUserId(step.approvedBy())
                .approvedAt(utcOrNull(step.approvedAt()))
                .result(step.result())
                .error(step.error())
                .finishedAt(utcOrNull(step.finishedAt()));
    }

    @Nullable
    String describe(String toolName, Map<String, Object> input) {
        return tools.find(toolName).map(tool -> describe(tool, input)).orElse(null);
    }

    private static <I> String describe(Tool<I> tool, Map<String, Object> input) {
        return tool.describe(tool.validate(input));
    }

    static OffsetDateTime utc(OffsetDateTime value) {
        return value.withOffsetSameInstant(ZoneOffset.UTC);
    }

    static @Nullable OffsetDateTime utcOrNull(@Nullable OffsetDateTime value) {
        return value == null ? null : utc(value);
    }
}
