package com.avenra.verification.domain;

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

    public record DocumentFacts(String contentType, long sizeBytes, String sha256Hex) {}

    public static Answer value(Kind kind, String value) {
        return new Answer(kind, value, null);
    }

    public static Answer document(DocumentFacts facts) {
        return new Answer(Kind.DOCUMENT, null, facts);
    }
}
