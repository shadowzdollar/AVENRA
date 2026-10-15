package com.avenra.information.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;

/**
 * What satisfies a requirement (ADR-018): a document, or a value of a type. Values are stored in a
 * canonical text form so equal answers compare equal.
 */
public enum RequirementKind {
    DOCUMENT,
    TEXT,
    NUMBER,
    DATE,
    BOOLEAN;

    private static final int MAX_TEXT = 4000;
    private static final int MAX_NUMBER_LENGTH = 40;
    private static final LocalDate EARLIEST = LocalDate.of(1800, 1, 1);
    private static final LocalDate LATEST = LocalDate.of(2300, 12, 31);

    /**
     * The canonical form of a submitted value, or empty when it is not a valid value of this kind.
     * Documents have no value form.
     */
    public Optional<String> canonicalValue(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String value = raw.strip();
        return switch (this) {
            case DOCUMENT -> Optional.empty();
            case TEXT -> value.isEmpty() || value.length() > MAX_TEXT ? Optional.empty() : Optional.of(value);
            case NUMBER -> number(value);
            case DATE -> date(value);
            case BOOLEAN ->
                switch (value.toLowerCase(Locale.ROOT)) {
                    case "true" -> Optional.of("true");
                    case "false" -> Optional.of("false");
                    default -> Optional.empty();
                };
        };
    }

    /** What a valid value looks like, for error messages. */
    public String expectedFormat() {
        return switch (this) {
            case DOCUMENT -> "a file";
            case TEXT -> "text of 1 to 4000 characters";
            case NUMBER -> "a decimal number such as 1250.50";
            case DATE -> "a date as YYYY-MM-DD";
            case BOOLEAN -> "true or false";
        };
    }

    private static Optional<String> number(String value) {
        if (value.isEmpty() || value.length() > MAX_NUMBER_LENGTH || !value.matches("-?[0-9]+(\\.[0-9]+)?")) {
            return Optional.empty();
        }
        BigDecimal number = new BigDecimal(value).stripTrailingZeros();
        return Optional.of(number.scale() < 0 ? number.setScale(0).toPlainString() : number.toPlainString());
    }

    private static Optional<String> date(String value) {
        try {
            LocalDate date = LocalDate.parse(value);
            return date.isBefore(EARLIEST) || date.isAfter(LATEST) ? Optional.empty() : Optional.of(date.toString());
        } catch (DateTimeParseException invalid) {
            return Optional.empty();
        }
    }
}
