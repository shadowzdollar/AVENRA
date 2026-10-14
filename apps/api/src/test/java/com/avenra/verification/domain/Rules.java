package com.avenra.verification.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Rule builders for tests. */
final class Rules {

    private Rules() {}

    static Rule blank(Rule.Type type, Rule.Severity severity) {
        return new Rule(
                null,
                type,
                severity,
                type + " failed",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule pattern(String pattern) {
        var r = blank(Rule.Type.PATTERN, Rule.Severity.BLOCKING);
        return new Rule(
                null,
                r.type(),
                r.severity(),
                "Use 8 digits",
                pattern,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule range(String min, String max, Rule.Severity severity) {
        return new Rule(
                null,
                Rule.Type.RANGE,
                severity,
                "Out of range",
                null,
                null,
                null,
                List.of(),
                min == null ? null : new BigDecimal(min),
                max == null ? null : new BigDecimal(max),
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule oneOf(String... values) {
        return new Rule(
                null,
                Rule.Type.ONE_OF,
                Rule.Severity.BLOCKING,
                "Not allowed",
                null,
                null,
                null,
                List.of(values),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule length(Integer min, Integer max) {
        return new Rule(
                null,
                Rule.Type.LENGTH,
                Rule.Severity.ADVISORY,
                "Length",
                null,
                min,
                max,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule notExpiringWithin(int days) {
        return new Rule(
                null,
                Rule.Type.DATE_RANGE,
                Rule.Severity.BLOCKING,
                "Expires too soon",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                days,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule between(LocalDate notBefore, LocalDate notAfter) {
        return new Rule(
                null,
                Rule.Type.DATE_RANGE,
                Rule.Severity.BLOCKING,
                "Date range",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                notBefore,
                notAfter,
                null,
                null,
                null,
                null,
                List.of(),
                null);
    }

    static Rule equalsOther(UUID other, Rule.Severity severity) {
        return new Rule(
                null,
                Rule.Type.EQUALS_REQUIREMENT,
                severity,
                "Must match",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                other,
                null,
                List.of(),
                null);
    }

    static Rule dateOrder(UUID other, Rule.Order order) {
        return new Rule(
                null,
                Rule.Type.DATE_ORDER,
                Rule.Severity.BLOCKING,
                "Order",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                other,
                order,
                List.of(),
                null);
    }

    static Rule fileType(String... types) {
        return new Rule(
                null,
                Rule.Type.FILE_TYPE,
                Rule.Severity.BLOCKING,
                "Send a PDF",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(types),
                null);
    }

    static Rule fileSize(long max) {
        return new Rule(
                null,
                Rule.Type.FILE_SIZE,
                Rule.Severity.BLOCKING,
                "Too large",
                null,
                null,
                null,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                max);
    }
}
