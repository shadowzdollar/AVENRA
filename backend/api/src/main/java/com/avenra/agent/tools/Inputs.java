package com.avenra.agent.tools;

import java.util.Map;
import java.util.Set;
import org.jspecify.annotations.Nullable;

/** Strict reading of tool input: exactly the declared properties, of the declared types. */
final class Inputs {

    private Inputs() {}

    static void only(Map<String, Object> raw, Set<String> allowed) {
        for (String key : raw.keySet()) {
            if (!allowed.contains(key)) {
                throw new ToolInputException("unexpected input " + key);
            }
        }
    }

    static String text(Map<String, Object> raw, String name, int max, boolean required) {
        Object value = raw.get(name);
        if (value == null) {
            if (required) {
                throw new ToolInputException(name + " is required");
            }
            return "";
        }
        if (!(value instanceof String text)) {
            throw new ToolInputException(name + " must be text");
        }
        String stripped = text.strip();
        if (required && stripped.isEmpty()) {
            throw new ToolInputException(name + " is required");
        }
        if (stripped.length() > max) {
            throw new ToolInputException(name + " is longer than " + max + " characters");
        }
        if (stripped.chars().anyMatch(c -> c < 0x20 && c != '\n')) {
            throw new ToolInputException(name + " contains control characters");
        }
        return stripped;
    }

    static boolean bool(Map<String, Object> raw, String name) {
        if (!(raw.get(name) instanceof Boolean value)) {
            throw new ToolInputException(name + " must be true or false");
        }
        return value;
    }

    static String oneOf(Map<String, Object> raw, String name, Set<String> values) {
        @Nullable Object value = raw.get(name);
        if (!(value instanceof String text) || !values.contains(text)) {
            throw new ToolInputException(name + " must be one of " + values);
        }
        return text;
    }

    static Map<String, Object> string(int max) {
        return Map.of("type", "string", "maxLength", max);
    }
}
