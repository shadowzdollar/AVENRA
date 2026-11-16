package com.avenra.agent;

import java.util.UUID;

/** Facts the agent module publishes, inside the transaction that recorded them. */
public final class AgentEvents {

    private AgentEvents() {}

    /**
     * A run was stopped (by a person, its budget or its deadline) or failed, so a person must look
     * at the work (§131: stop, record the reason, raise an exception, ask for a human).
     */
    public record RunNeedsAttention(UUID organizationId, UUID workId, UUID runId, String status, String reason) {}

    /**
     * A run waits for a person's decision: its plan, or a high-risk step (§132).
     *
     * @param highRiskStep whether the plan was approved and a high-risk step now waits
     */
    public record ApprovalNeeded(UUID organizationId, UUID workId, UUID runId, boolean highRiskStep) {}
}
