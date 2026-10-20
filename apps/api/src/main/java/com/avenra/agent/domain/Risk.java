package com.avenra.agent.domain;

/** Tool risk levels (Guidelines §46). */
public enum Risk {
    /** Read-only. */
    LOW,
    /** Reversible changes inside Avenra. */
    MEDIUM,
    /** External side effects or sensitive changes: approved one by one. */
    HIGH,
    /** Financial, legal, destructive or irreversible: never available to agents. */
    CRITICAL;

    /** Whether approving the plan is enough, or the step needs its own approval (ADR-033). */
    public boolean needsOwnApproval() {
        return this == HIGH || this == CRITICAL;
    }
}
