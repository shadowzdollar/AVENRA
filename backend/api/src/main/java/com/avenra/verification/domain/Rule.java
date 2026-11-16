package com.avenra.verification.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * One deterministic check on an answer (ADR-027). Only the parameters of its type apply; {@link
 * RuleValidation} rejects anything else before a rule is stored.
 */
public record Rule(
        @Nullable UUID id,
        Type type,
        Severity severity,
        String message,
        @Nullable String pattern,
        @Nullable Integer minLength,
        @Nullable Integer maxLength,
        List<String> values,
        @Nullable BigDecimal min,
        @Nullable BigDecimal max,
        @Nullable LocalDate notBefore,
        @Nullable LocalDate notAfter,
        @Nullable Integer minDaysFromToday,
        @Nullable Integer maxDaysFromToday,
        @Nullable UUID otherRequirementId,
        @Nullable Order order,
        List<String> contentTypes,
        @Nullable Long maxBytes,
        @Nullable String field,
        @Nullable FieldKind fieldKind) {

    public Rule {
        values = values == null ? List.of() : List.copyOf(values);
        contentTypes = contentTypes == null ? List.of() : List.copyOf(contentTypes);
    }

    public enum Type {
        PATTERN,
        LENGTH,
        ONE_OF,
        RANGE,
        DATE_RANGE,
        EQUALS_REQUIREMENT,
        DATE_ORDER,
        FILE_TYPE,
        FILE_SIZE,
        /** The document reads as one of {@link #values()} (ADR-031). Advisory only. */
        DOCUMENT_KIND,
        /** A field read from the document is present, and optionally matches (ADR-031). Advisory only. */
        DOCUMENT_FIELD;

        /** Based on an automatic reading of the document: advisory, never a decision (ADR-031). */
        public boolean aiDerived() {
            return this == DOCUMENT_KIND || this == DOCUMENT_FIELD;
        }
    }

    /** How a field read from a document is compared. */
    public enum FieldKind {
        TEXT,
        NUMBER,
        DATE
    }

    public enum Severity {
        BLOCKING,
        ADVISORY;

        /** Blocking checks count double in the confidence (ADR-027). */
        int weight() {
            return this == BLOCKING ? 2 : 1;
        }
    }

    public enum Order {
        BEFORE,
        AFTER
    }

    public Rule withId(UUID value) {
        return new Rule(
                value,
                type,
                severity,
                message,
                pattern,
                minLength,
                maxLength,
                values,
                min,
                max,
                notBefore,
                notAfter,
                minDaysFromToday,
                maxDaysFromToday,
                otherRequirementId,
                order,
                contentTypes,
                maxBytes,
                field,
                fieldKind);
    }

    public boolean refersToOtherRequirement() {
        return otherRequirementId != null;
    }
}
