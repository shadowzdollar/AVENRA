package com.avenra.platform.email;

/**
 * A plain-text transactional email (ADR-015). Bodies may contain single-use links but never
 * passwords or other secrets.
 *
 * @param to recipient address
 * @param subject subject line
 * @param body plain-text body
 * @param category short label for logs and metrics, e.g. {@code email-verification}; the address
 *     and body are never logged
 */
public record EmailMessage(String to, String subject, String body, String category) {}
