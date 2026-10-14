package com.avenra.work.application;

import com.avenra.document.DocumentEvents;
import com.avenra.work.domain.ExceptionType;
import com.avenra.work.infrastructure.RequirementRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * A stored file turned out to be malware on rescan (ADR-021): the work it belongs to gets a
 * high-severity exception, inside the transaction that quarantined the file.
 */
@Component
class QuarantinedDocuments {

    private final RequirementRepository requirements;
    private final Exceptions exceptions;

    QuarantinedDocuments(RequirementRepository requirements, Exceptions exceptions) {
        this.requirements = requirements;
        this.exceptions = exceptions;
    }

    @EventListener
    void on(DocumentEvents.Quarantined quarantined) {
        var requirement = quarantined.requirementId() == null
                ? null
                : requirements.find(quarantined.requirementId()).orElse(null);
        exceptions.raise(
                quarantined.organizationId(),
                requirement == null ? null : requirement.workId(),
                ExceptionType.MALWARE_FOUND,
                "A stored file" + (requirement == null ? "" : " for \"" + requirement.title() + "\"")
                        + " (version " + quarantined.version() + ") was found to contain malware ("
                        + quarantined.signature() + ") when it was checked again. It has been quarantined and can no"
                        + " longer be downloaded. Ask for a clean copy and check anyone who opened it.",
                "document",
                quarantined.documentId() + ":" + quarantined.version());
    }
}
