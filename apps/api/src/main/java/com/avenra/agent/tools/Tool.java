package com.avenra.agent.tools;

import com.avenra.agent.WorkTools.WorkFacts;
import com.avenra.agent.domain.Risk;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * A governed capability the agent may use (Guidelines §45, ADR-033). Every tool declares what it
 * does, what it needs and how it fails; the gateway relies on these declarations, never on the
 * model.
 *
 * @param <I> the validated input
 */
public interface Tool<I> {

    String name();

    String description();

    Risk risk();

    /** The permission the starting person must hold when the step runs. */
    String permission();

    /** The audit action written when the step runs. */
    String auditAction();

    /** Longest one attempt may take. */
    Duration timeout();

    /** Attempts before the step fails for good (transient failures only). */
    int maxAttempts();

    /** Whether the tool has an effect outside Avenra, counted against the budget. */
    boolean sideEffect();

    /** How a repeated attempt behaves; every tool here is idempotent by key. */
    default String idempotency() {
        return "idempotent by key agent:<run>:<step>";
    }

    /** The input's JSON schema, as the planner is shown it. */
    Map<String, Object> inputSchema();

    /** Parses and validates raw input; anything else is refused with {@link ToolInputException}. */
    I validate(Map<String, Object> raw);

    /** One line a person reads before approving. */
    String describe(I input);

    /** Runs as {@code context.userId()}. Must be idempotent under {@code context.idempotencyKey()}. */
    Outcome execute(Context context, I input);

    /** Reads the resulting state back and says whether it is what the step meant to do (§133). */
    boolean verify(Context context, I input, Outcome outcome);

    record Context(UUID organizationId, UUID workId, UUID userId, String idempotencyKey, WorkFacts work) {}

    /** What a step did: the resource it created and a sentence for people. */
    record Outcome(UUID resourceId, String summary) {}
}
