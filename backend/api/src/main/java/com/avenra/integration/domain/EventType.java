package com.avenra.integration.domain;

import java.util.Arrays;
import java.util.Optional;

/** Integration event types (§57): external, versioned descriptions of domain facts. */
public enum EventType {
    WORK_COMPLETED("work.completed"),
    ANSWER_RECEIVED("information.answer_received"),
    REQUEST_EXPIRED("request.expired"),
    /** Sent only by a person's test of a connection. */
    TEST("integration.test");

    public static final int VERSION = 1;

    private final String code;

    EventType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static Optional<EventType> of(String code) {
        return Arrays.stream(values()).filter(type -> type.code.equals(code)).findFirst();
    }
}
