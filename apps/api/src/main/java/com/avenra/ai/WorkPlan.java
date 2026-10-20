package com.avenra.ai;

import java.util.List;
import java.util.Map;

/**
 * A plan the AI service proposed and validated (ADR-033). Untrusted: the agent's tool gateway
 * validates every step again against its own catalogue before anything runs.
 *
 * @param input each step's input as the service validated it; typed by the gateway
 */
public record WorkPlan(String summary, List<Step> steps) {

    public WorkPlan {
        steps = List.copyOf(steps);
    }

    public record Step(String tool, Map<String, Object> input, String reason) {}
}
