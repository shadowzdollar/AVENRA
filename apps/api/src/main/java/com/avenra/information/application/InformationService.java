package com.avenra.information.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.CreateRequirementRequest;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.ReviewRequest;
import com.avenra.document.Documents;
import com.avenra.information.InformationEvents;
import com.avenra.information.WorkGate;
import com.avenra.information.domain.Completeness.VerificationState;
import com.avenra.information.domain.RequirementKind;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.information.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.web.ApiException;
import com.avenra.platform.web.Text;
import java.io.InputStream;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/**
 * Requirements of work, the information team members submit for them, its review, and document
 * downloads.
 */
@Service
public class InformationService {

    private final RequirementRepository requirements;
    private final WorkGate work;
    private final Submissions submissions;
    private final Documents documents;
    private final InformationViews views;
    private final Idempotency idempotency;
    private final ApplicationEventPublisher events;
    private final OrganizationAccess access;
    private final AuditLog audit;
    private final Clock clock;

    InformationService(
            RequirementRepository requirements,
            WorkGate work,
            Submissions submissions,
            Documents documents,
            InformationViews views,
            Idempotency idempotency,
            ApplicationEventPublisher events,
            OrganizationAccess access,
            AuditLog audit,
            Clock clock) {
        this.requirements = requirements;
        this.work = work;
        this.submissions = submissions;
        this.documents = documents;
        this.views = views;
        this.idempotency = idempotency;
        this.events = events;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    public Requirement createRequirement(
            UUID userId, UUID organizationId, UUID workId, String idempotencyKey, CreateRequirementRequest input) {
        String title = Text.required(input.getTitle(), "title");
        String instructions = Text.optional(input.getInstructions());
        RequirementKind kind = RequirementKind.valueOf(input.getKind().getValue());
        boolean required = Boolean.TRUE.equals(input.getRequired());
        return access.run(
                userId,
                organizationId,
                Permission.WORK_UPDATE,
                granted -> idempotency.once(
                        userId,
                        "createRequirement",
                        idempotencyKey,
                        Text.fingerprint(organizationId, workId, title, instructions, kind, required),
                        Requirement.class,
                        () -> {
                            work.lockOpen(organizationId, workId);
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var row = new RequirementRow(
                                    UUID.randomUUID(),
                                    organizationId,
                                    workId,
                                    title,
                                    instructions,
                                    kind,
                                    required,
                                    null,
                                    now);
                            requirements.insert(row, userId);
                            work.touch(organizationId, workId);
                            audit.record(AuditLog.Event.of("work.requirement.created", organizationId, userId)
                                    .resource("requirement", row.id())
                                    .detail("workId", workId.toString()));
                            return views.requirement(row, views.load(List.of(row)));
                        }));
    }

    public List<InformationItem> items(UUID userId, UUID organizationId, UUID workId, UUID requirementId) {
        return access.run(userId, organizationId, Permission.INFORMATION_READ, granted -> {
            work.find(organizationId, workId).orElseThrow(ApiException::notFound);
            requirement(organizationId, workId, requirementId);
            var items = requirements.items(requirementId);
            var versions = views.versionsOf(items);
            return items.stream()
                    .map(item -> InformationViews.item(item, versions))
                    .toList();
        });
    }

    public InformationItem submitValue(
            UUID userId, UUID organizationId, UUID workId, UUID requirementId, String value) {
        return access.run(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
            work.lockOpen(organizationId, workId);
            var requirement = lock(workId, requirementId);
            var item = submissions.submitValue(requirement, value, Submissions.Source.teamMember(userId));
            work.touch(organizationId, workId);
            return InformationViews.item(item, views.versionsOf(List.of(item)));
        });
    }

    public InformationItem uploadFile(
            UUID userId,
            UUID organizationId,
            UUID workId,
            UUID requirementId,
            InputStream content,
            @Nullable String fileName) {
        // Check access and the target before spending time on the file.
        access.runWithoutResult(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
            work.lockOpen(organizationId, workId);
            Submissions.requireDocument(requirement(organizationId, workId, requirementId));
        });
        try (var prepared = documents.prepare(content, fileName)) {
            var outcome = access.run(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
                work.lockOpen(organizationId, workId);
                var requirement = lock(workId, requirementId);
                var result = submissions.storeFile(requirement, prepared, Submissions.Source.teamMember(userId));
                if (result.item() == null) {
                    return result;
                }
                work.touch(organizationId, workId);
                return result;
            });
            if (outcome.rejected() || outcome.item() == null) {
                throw Submissions.fileRejected();
            }
            return access.run(
                    userId,
                    organizationId,
                    Permission.INFORMATION_READ,
                    granted -> InformationViews.item(outcome.item(), views.versionsOf(List.of(outcome.item()))));
        }
    }

    public Requirement review(UUID userId, UUID organizationId, UUID workId, UUID requirementId, ReviewRequest input) {
        boolean accept = input.getDecision() == ReviewRequest.DecisionEnum.ACCEPT;
        String reason = Text.optional(input.getReason());
        if (!accept && reason == null) {
            throw ApiException.invalid("reason", "is required when rejecting");
        }
        VerificationState decision = accept ? VerificationState.ACCEPTED : VerificationState.REJECTED;
        return access.run(userId, organizationId, Permission.INFORMATION_VERIFY, granted -> {
            work.lockOpen(organizationId, workId);
            var requirement = lock(workId, requirementId);
            if (!input.getItemId().equals(requirement.currentItemId())) {
                throw notAwaitingReview();
            }
            var item = requirements.itemsByIds(List.of(input.getItemId())).getFirst();
            if (item.verificationState() == decision) {
                // The same review again: nothing changes (idempotent).
                return views.requirement(requirement, views.load(List.of(requirement)));
            }
            if (item.verificationState() != VerificationState.PENDING) {
                throw notAwaitingReview();
            }
            OffsetDateTime now = OffsetDateTime.now(clock);
            requirements.review(item.id(), decision, userId, reason, now);
            events.publishEvent(new InformationEvents.AnswerReviewed(
                    organizationId, workId, requirementId, item.id(), accept, reason, userId));
            work.touch(organizationId, workId);
            audit.record(AuditLog.Event.of(
                            accept ? "work.information.accepted" : "work.information.rejected", organizationId, userId)
                    .resource("information_item", item.id())
                    .detail("requirementId", requirementId.toString())
                    .detail("workId", workId.toString()));
            var reloaded = requirements.findForUpdate(workId, requirementId).orElseThrow();
            return views.requirement(reloaded, views.load(List.of(reloaded)));
        });
    }

    /** Opens a clean document version of the organization. Every download is audited. */
    public Documents.Download download(UUID userId, UUID organizationId, UUID documentId, int version) {
        return access.run(userId, organizationId, Permission.INFORMATION_READ, granted -> {
            var download = documents.open(organizationId, documentId, version);
            audit.record(AuditLog.Event.of("document.downloaded", organizationId, userId)
                    .resource("document", documentId)
                    .detail("version", version));
            return download;
        });
    }

    private RequirementRow requirement(UUID organizationId, UUID workId, UUID requirementId) {
        return requirements.forWork(organizationId, workId).stream()
                .filter(row -> row.id().equals(requirementId))
                .findFirst()
                .orElseThrow(ApiException::notFound);
    }

    private RequirementRow lock(UUID workId, UUID requirementId) {
        return requirements.findForUpdate(workId, requirementId).orElseThrow(ApiException::notFound);
    }

    private static ApiException notAwaitingReview() {
        return ApiException.conflict("NOT_AWAITING_REVIEW", "This submission is not awaiting review.");
    }
}
