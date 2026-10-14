package com.avenra.information.application;

import com.avenra.audit.AuditLog;
import com.avenra.document.Documents;
import com.avenra.information.InformationEvents;
import com.avenra.information.domain.Completeness.VerificationState;
import com.avenra.information.domain.RequirementKind;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.information.infrastructure.RequirementRepository.ItemRow;
import com.avenra.information.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Recording information for a requirement, from a team member or a request link (ADR-018). Every
 * submission is a new, immutable item with its source (Guidelines §136); the requirement then
 * points at it. Repeating the submission that is already awaiting review returns that item.
 *
 * <p>All methods run inside the caller's tenant transaction, with the requirement locked.
 */
@Component
class Submissions {

    /** Who is submitting: exactly one of a user and a request link. */
    record Source(@Nullable UUID userId, @Nullable UUID requestLinkId) {

        static Source teamMember(UUID userId) {
            return new Source(userId, null);
        }

        static Source requestLink(UUID linkId) {
            return new Source(null, linkId);
        }

        String type() {
            return userId != null ? "TEAM_MEMBER" : "CLIENT_LINK";
        }

        Documents.Uploader uploader() {
            return userId != null ? Documents.Uploader.user(userId) : Documents.Uploader.requestLink(requestLinkId);
        }

        boolean matches(ItemRow item) {
            return Objects.equals(item.sourceUserId(), userId) && Objects.equals(item.sourceLinkId(), requestLinkId);
        }
    }

    /** The result of an upload: the new (or repeated) item, or the malware detection. */
    record UploadOutcome(@Nullable ItemRow item, boolean rejected) {}

    private final RequirementRepository requirements;
    private final Documents documents;
    private final ApplicationEventPublisher events;
    private final AuditLog audit;
    private final Clock clock;

    Submissions(
            RequirementRepository requirements,
            Documents documents,
            ApplicationEventPublisher events,
            AuditLog audit,
            Clock clock) {
        this.requirements = requirements;
        this.documents = documents;
        this.events = events;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    ItemRow submitValue(RequirementRow requirement, String raw, Source source) {
        if (requirement.kind() == RequirementKind.DOCUMENT) {
            throw new ApiException(
                    "WRONG_SUBMISSION_KIND", HttpStatus.CONFLICT, "This item needs a file, not a value.");
        }
        String value = requirement
                .kind()
                .canonicalValue(raw)
                .orElseThrow(() -> ApiException.invalid(
                        "value", "must be " + requirement.kind().expectedFormat()));
        ItemRow current = current(requirement);
        if (current != null
                && current.verificationState() == VerificationState.PENDING
                && source.matches(current)
                && value.equals(current.valueText())) {
            return current;
        }
        requireNotAccepted(current);
        var item = newItem(requirement, value, null, null, source);
        record(requirement, item, source, "work.information.submitted");
        return item;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    UploadOutcome storeFile(RequirementRow requirement, Documents.PreparedFile file, Source source) {
        requireDocument(requirement);
        ItemRow current = current(requirement);
        if (!file.infected()
                && current != null
                && current.verificationState() == VerificationState.PENDING
                && source.matches(current)
                && current.documentId() != null
                && sameContent(current, file)) {
            return new UploadOutcome(current, false);
        }
        if (!file.infected()) {
            requireNotAccepted(current);
        }
        var stored = documents.store(file, requirement.organizationId(), requirement.id(), source.uploader());
        if (file.infected()) {
            var event = AuditLog.Event.of("document.malware_detected", requirement.organizationId(), source.userId())
                    .resource("document", stored.documentId())
                    .detail("version", stored.version())
                    .detail("requirementId", requirement.id().toString())
                    .detail("signature", String.valueOf(documents.detection(file)));
            audit.record(
                    source.requestLinkId() == null
                            ? event
                            : event.detail(
                                    "requestLinkId", source.requestLinkId().toString()));
            return new UploadOutcome(null, true);
        }
        var item = newItem(requirement, null, stored.documentId(), stored.version(), source);
        record(requirement, item, source, "work.document.uploaded");
        return new UploadOutcome(item, false);
    }

    static void requireDocument(RequirementRow requirement) {
        if (requirement.kind() != RequirementKind.DOCUMENT) {
            throw new ApiException(
                    "WRONG_SUBMISSION_KIND", HttpStatus.CONFLICT, "This item needs a value, not a file.");
        }
    }

    static ApiException fileRejected() {
        return new ApiException(
                "FILE_REJECTED",
                HttpStatus.UNPROCESSABLE_CONTENT,
                "The file was rejected because it contains malware. It has been quarantined.");
    }

    private @Nullable ItemRow current(RequirementRow requirement) {
        if (requirement.currentItemId() == null) {
            return null;
        }
        return requirements.itemsByIds(java.util.List.of(requirement.currentItemId())).stream()
                .findFirst()
                .orElse(null);
    }

    /** Once accepted, a requirement is settled; changing it needs a new requirement. */
    private static void requireNotAccepted(@Nullable ItemRow current) {
        if (current != null && current.verificationState() == VerificationState.ACCEPTED) {
            throw ApiException.conflict("ALREADY_ACCEPTED", "This item has already been accepted.");
        }
    }

    private boolean sameContent(ItemRow current, Documents.PreparedFile file) {
        return documents.versions(java.util.List.of(current.documentId())).stream()
                .anyMatch(version -> version.version() == current.documentVersion()
                        && version.sha256Hex().equals(file.sha256Hex()));
    }

    private ItemRow newItem(
            RequirementRow requirement,
            @Nullable String value,
            @Nullable UUID documentId,
            @Nullable Integer version,
            Source source) {
        return new ItemRow(
                UUID.randomUUID(),
                requirement.organizationId(),
                requirement.id(),
                requirement.kind(),
                value,
                documentId,
                version,
                source.type(),
                source.userId(),
                source.requestLinkId(),
                OffsetDateTime.now(clock),
                null,
                VerificationState.PENDING,
                null,
                null,
                null);
    }

    private void record(RequirementRow requirement, ItemRow item, Source source, String action) {
        requirements.insertItem(item);
        requirements.setCurrentItem(requirement.id(), item.id(), item.receivedAt());
        // The work module follows up (review task, resuming the work) in the organization's scope.
        events.publishEvent(new InformationEvents.AnswerReceived(
                requirement.organizationId(),
                requirement.workId(),
                requirement.id(),
                requirement.title(),
                item.id(),
                source.requestLinkId() != null));
        var event = AuditLog.Event.of(action, requirement.organizationId(), source.userId())
                .resource("information_item", item.id())
                .detail("requirementId", requirement.id().toString())
                .detail("workId", requirement.workId().toString());
        audit.record(
                source.requestLinkId() == null
                        ? event
                        : event.detail("requestLinkId", source.requestLinkId().toString()));
    }
}
