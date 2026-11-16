package com.avenra.notification.domain;

import java.util.Arrays;
import java.util.Optional;

/** What a notification is about, and whether it is emailed when the person has not chosen. */
public enum Category {
    EXCEPTION("exception", true),
    ANSWER("answer", false),
    REQUEST("request", true),
    APPROVAL("approval", true),
    INTEGRATION("integration", true),
    ESCALATION("escalation", true);

    private final String code;
    private final boolean emailByDefault;

    Category(String code, boolean emailByDefault) {
        this.code = code;
        this.emailByDefault = emailByDefault;
    }

    public String code() {
        return code;
    }

    /** Product defaults (ADR-035). In-app notifications are always created. */
    public boolean emailByDefault() {
        return emailByDefault;
    }

    public static Optional<Category> of(String code) {
        return Arrays.stream(values())
                .filter(category -> category.code.equals(code))
                .findFirst();
    }
}
