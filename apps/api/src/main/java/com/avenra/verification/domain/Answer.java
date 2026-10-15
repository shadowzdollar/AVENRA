package com.avenra.verification.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * What is being verified: a value in its canonical text form, or a document's detected
 * properties. Never the document content itself.
 */
public record Answer(
        Kind kind, @Nullable String value, @Nullable DocumentFacts document) {

    public enum Kind {
        DOCUMENT,
        TEXT,
        NUMBER,
        DATE,
        BOOLEAN
    }

    /**
     * @param reading what an automatic reading found, when the rules ask for one; {@code null} when
     *     they do not
     */
    public record DocumentFacts(
            String contentType,
            long sizeBytes,
            String sha256Hex,
            @Nullable Reading reading) {

        public DocumentFacts(String contentType, long sizeBytes, String sha256Hex) {
            this(contentType, sizeBytes, sha256Hex, null);
        }
    }

    /**
     * An automatic reading of the document as the checks see it (ADR-031). Untrusted: it only feeds
     * advisory checks.
     *
     * @param reason why it is not available, shown on the skipped checks
     */
    public record Reading(
            Availability availability,
            @Nullable String reason,
            @Nullable String kindLabel,
            List<ReadField> fields) {

        public Reading {
            fields = List.copyOf(fields);
        }

        public enum Availability {
            AVAILABLE,
            UNAVAILABLE
        }

        public static Reading unavailable(String reason) {
            return new Reading(Availability.UNAVAILABLE, reason, null, List.of());
        }
    }

    /** @param located whether the quote is in the document text; {@code null} when it has none */
    public record ReadField(
            String name,
            boolean found,
            @Nullable String value,
            @Nullable String quote,
            @Nullable Boolean located) {}

    public static Answer value(Kind kind, String value) {
        return new Answer(kind, value, null);
    }

    public static Answer document(DocumentFacts facts) {
        return new Answer(Kind.DOCUMENT, null, facts);
    }
}
