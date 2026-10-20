package com.avenra.notification.application;

import org.jspecify.annotations.Nullable;

/**
 * Plain-text notification texts (ADR-035). Titles of organizations and work only: never answer
 * values, document content, tokens or client email addresses.
 */
final class Templates {

    record Text(String title, String body) {}

    private Templates() {}

    static Text exception(String organization, @Nullable String work, String severity, String description) {
        String where = work == null ? organization : "\"" + work + "\" at " + organization;
        return new Text(
                cap("Exception on " + where, 200),
                cap(
                        severity.charAt(0) + severity.substring(1).toLowerCase(java.util.Locale.ROOT) + " exception: "
                                + description,
                        2000));
    }

    static Text answer(String organization, String work, String requirement) {
        return new Text(
                cap("The client answered \"" + requirement + "\"", 200),
                cap(
                        "A client answer for \"" + requirement + "\" on \"" + work + "\" (" + organization
                                + ") is waiting for review.",
                        2000));
    }

    static Text requestExpired(String organization, String work, long missing) {
        return new Text(
                cap("A request expired with " + missing + " item" + (missing == 1 ? "" : "s") + " missing", 200),
                cap(
                        "The client request for \"" + work + "\" (" + organization + ") expired before everything was"
                                + " sent. Send a new request or follow up with the client.",
                        2000));
    }

    static Text approval(String organization, String work, boolean highRiskStep) {
        return new Text(
                cap(
                        highRiskStep
                                ? "The assistant waits for approval to email the client"
                                : "A plan waits for your decision",
                        200),
                cap(
                        (highRiskStep
                                        ? "The assistant's next step on \"" + work
                                                + "\" sends an email to the client and needs" + " its own approval."
                                        : "The assistant proposed a plan for \"" + work
                                                + "\". Nothing happens until someone" + " approves it.")
                                + " (" + organization + ")",
                        2000));
    }

    static Text integrationPaused(String organization, String connection, int failures) {
        return new Text(
                cap("The integration \"" + connection + "\" was paused", 200),
                cap(
                        "After " + failures + " failed deliveries in a row, \"" + connection + "\" (" + organization
                                + ") was paused. Check the receiving system, then resume the connection.",
                        2000));
    }

    static Text escalation(String organization, @Nullable String work, String description) {
        String where = work == null ? organization : "\"" + work + "\" at " + organization;
        return new Text(
                cap("Unattended: a high-severity exception on " + where, 200),
                cap("Nobody has picked up this exception for a day: " + description, 2000));
    }

    static String cap(String text, int max) {
        String clean = text.replaceAll("\\p{Cntrl}", " ").strip();
        return clean.length() > max ? clean.substring(0, max - 1) + "…" : clean;
    }
}
