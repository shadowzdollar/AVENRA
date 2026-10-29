package com.avenra.billing.domain;

import com.avenra.platform.entitlements.Entitlements.Limit;
import java.util.EnumMap;
import java.util.Map;
import java.util.OptionalLong;

/**
 * Plans and their limits (ADR-037, product defaults). The only place limits are defined; prices
 * are not here, they live at the billing provider.
 */
public enum Plan {
    STARTER("Starter", true, limits(5, 100, 2, 5L * GiB.BYTES, 500)),
    BUSINESS("Business", true, limits(25, 1_000, 10, 50L * GiB.BYTES, 5_000)),
    ENTERPRISE("Enterprise", false, Map.of());

    private final String displayName;
    private final boolean selfServe;
    private final Map<Limit, Long> limits;

    Plan(String displayName, boolean selfServe, Map<Limit, Long> limits) {
        this.displayName = displayName;
        this.selfServe = selfServe;
        this.limits = limits;
    }

    public String displayName() {
        return displayName;
    }

    /** Whether it can be chosen at checkout; otherwise it is agreed with us. */
    public boolean selfServe() {
        return selfServe;
    }

    /** The most allowed, or empty when unlimited. */
    public OptionalLong allowed(Limit limit) {
        Long value = limits.get(limit);
        return value == null ? OptionalLong.empty() : OptionalLong.of(value);
    }

    private static Map<Limit, Long> limits(long members, long openWork, long integrations, long bytes, long aiCalls) {
        var map = new EnumMap<Limit, Long>(Limit.class);
        map.put(Limit.MEMBERS, members);
        map.put(Limit.OPEN_WORK, openWork);
        map.put(Limit.INTEGRATIONS, integrations);
        map.put(Limit.STORAGE_BYTES, bytes);
        map.put(Limit.AI_CALLS_MONTH, aiCalls);
        return Map.copyOf(map);
    }

    private static final class GiB {
        static final long BYTES = 1024L * 1024 * 1024;
    }
}
