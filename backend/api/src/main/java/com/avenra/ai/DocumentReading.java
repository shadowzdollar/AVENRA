package com.avenra.ai;

import java.math.BigDecimal;
import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * What the AI service read in a document, already validated by it against the request (ADR-031).
 * Still untrusted: it may only feed advisory checks and be shown to people.
 *
 * @param kind the kind the document reads as, when kinds were asked for
 * @param source {@code TEXT} when the document's own text was read, {@code FILE} for images and
 *     scans, where quotes cannot be located
 * @param model the model that answered
 */
public record DocumentReading(
        @Nullable Kind kind,
        List<Field> fields,
        boolean instructionsDetected,
        List<Proposal> proposals,
        String source,
        @Nullable String model) {

    public DocumentReading {
        fields = List.copyOf(fields);
        proposals = List.copyOf(proposals);
    }

    public record Kind(String label, BigDecimal confidence) {}

    /** @param located whether the quote is in the document text; {@code null} when it has none */
    public record Field(
            String name,
            String kind,
            boolean found,
            @Nullable String value,
            @Nullable String quote,
            @Nullable Integer page,
            @Nullable Boolean located) {}

    /** A suggestion from the closed catalogue; never carried out automatically (ADR-029). */
    public record Proposal(String tool, String risk, String reason) {}
}
