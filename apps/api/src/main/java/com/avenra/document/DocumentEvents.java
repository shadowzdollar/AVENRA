package com.avenra.document;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** Facts the document module publishes for other modules. */
public final class DocumentEvents {

    private DocumentEvents() {}

    /**
     * A stored file was found infected when rescanned and moved to quarantine (ADR-021). Published
     * inside the transaction that recorded it.
     */
    public record Quarantined(
            UUID organizationId,
            UUID documentId,
            int version,
            @Nullable UUID requirementId,
            String signature) {}

    /**
     * A document version's automatic reading was settled (done, failed or skipped), so answers that
     * use it can be verified again (ADR-031). Published inside the transaction that settled it.
     */
    public record Read(
            UUID organizationId,
            UUID documentId,
            int version,
            @Nullable UUID requirementId) {}
}
