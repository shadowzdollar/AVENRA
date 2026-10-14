package com.avenra.work.application;

import com.avenra.platform.web.ApiException;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;

/** Normalizes free text from requests: trimmed, and blank means absent. */
final class Text {

    private Text() {}

    static String required(@Nullable String value, String field) {
        String text = optional(value);
        if (text == null) {
            throw ApiException.invalid(field, "must not be blank");
        }
        return text;
    }

    static @Nullable String optional(@Nullable String value) {
        if (value == null) {
            return null;
        }
        String text = value.strip();
        return text.isEmpty() ? null : text;
    }

    /**
     * A canonical request description for idempotency keys (Guidelines §30). Each part is
     * length-prefixed, so different requests never produce the same fingerprint.
     */
    static String fingerprint(@Nullable Object... parts) {
        return Arrays.stream(parts)
                .map(part -> part == null ? "-" : Objects.toString(part).length() + ":" + part)
                .collect(Collectors.joining("|"));
    }
}
