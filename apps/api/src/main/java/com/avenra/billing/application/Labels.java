package com.avenra.billing.application;

import com.avenra.platform.entitlements.Entitlements.Limit;

/** What a person reads for each limit. */
final class Labels {

    private Labels() {}

    static String of(Limit limit) {
        return switch (limit) {
            case MEMBERS -> "members and pending invitations";
            case OPEN_WORK -> "open work";
            case INTEGRATIONS -> "active integrations";
            case STORAGE_BYTES -> "stored files (bytes)";
            case AI_CALLS_MONTH -> "assistant calls this month";
        };
    }
}
