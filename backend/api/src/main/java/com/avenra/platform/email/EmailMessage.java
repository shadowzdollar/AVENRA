package com.avenra.platform.email;

/**
 * A plain-text transactional email (ADR-015). Bodies may contain single-use links but never
 * passwords or other secrets.
 *
 * @param to recipient address
 * @param subject subject line; control characters (line breaks included) are replaced by spaces, so
 *     names typed by users cannot inject headers
 * @param body plain-text body
 * @param category short label for logs and metrics, e.g. {@code email-verification}; the address
 *     and body are never logged
 */
public record EmailMessage(String to, String subject, String body, String category) {

    private static final int MAX_SUBJECT = 200;

    public EmailMessage {
        subject = subject.replaceAll("\\p{Cntrl}", " ").strip();
        if (subject.length() > MAX_SUBJECT) {
            subject = subject.substring(0, MAX_SUBJECT);
        }
        if (to.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("recipient contains control characters");
        }
    }
}
