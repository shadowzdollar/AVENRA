package com.avenra.integration.domain;

import org.jspecify.annotations.Nullable;

/**
 * What one delivery attempt achieved. {@code retryable} says whether another attempt may succeed
 * (Guidelines §103); the error is for people and never holds a secret or a response body.
 */
public record Outcome(
        boolean delivered,
        boolean retryable,
        @Nullable Integer statusCode,
        @Nullable String error) {

    public static Outcome ok(@Nullable Integer statusCode) {
        return new Outcome(true, false, statusCode, null);
    }

    public static Outcome retry(@Nullable Integer statusCode, String error) {
        return new Outcome(false, true, statusCode, error);
    }

    public static Outcome fail(@Nullable Integer statusCode, String error) {
        return new Outcome(false, false, statusCode, error);
    }
}
