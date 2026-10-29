package com.avenra.platform.entitlements;

import java.util.UUID;

/**
 * The one question business code asks about billing (ADR-037): may this organization add more of
 * something? Plans and subscriptions stay with the billing module. Call in the organization's
 * tenant scope, before the action that would add.
 */
public interface Entitlements {

    /**
     * @throws com.avenra.platform.web.ApiException {@code SUBSCRIPTION_INACTIVE} when the subscription
     *     is not in good standing, {@code PLAN_LIMIT_REACHED} when the plan's limit would be exceeded
     */
    void requireRoom(UUID organizationId, Limit limit, long adding);

    /** The same check without an exception, for background work that skips instead of failing. */
    boolean hasRoom(UUID organizationId, Limit limit, long adding);

    /** What plans limit; each code is the usage figure (ADR-036) the limit is measured by. */
    enum Limit {
        MEMBERS("members"),
        OPEN_WORK("work.open"),
        INTEGRATIONS("integrations.active"),
        STORAGE_BYTES("documents.bytes"),
        AI_CALLS_MONTH("ai.calls_month");

        private final String code;

        Limit(String code) {
            this.code = code;
        }

        public String code() {
            return code;
        }
    }
}
