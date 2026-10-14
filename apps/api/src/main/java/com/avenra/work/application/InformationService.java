package com.avenra.work.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.ReviewRequest;
import com.avenra.document.Documents;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.web.ApiException;
import com.avenra.work.domain.Completeness.VerificationState;
import com.avenra.work.infrastructure.RequirementRepository;
import com.avenra.work.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.work.infrastructure.WorkRepository;
import java.io.InputStream;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

/**
 * Information submitted for requirements by team members, its review (manual in Phase 3;
 * automated verification is Phase 5) and document downloads.
 */
@Service
public class InformationService {

    private final RequirementRepository requirements;
    private final WorkRepository work;
    private final WorkService workService;
    private final Submissions submissions;
    private final Documents documents;
    private final WorkViews views;
    private final HumanTasks tasks;
    private final WorkAutomation automation;
    private final OrganizationAccess access;
    private final AuditLog audit;
    private final Clock clock;

    InformationService(
            RequirementRepository requirements,
            WorkRepository work,
            WorkService workService,
            Submissions submissions,
            Documents documents,
            WorkViews views,
            HumanTasks tasks,
            WorkAutomation automation,
            OrganizationAccess access,
            AuditLog audit,
            Clock clock) {
        this.requirements = requirements;
        this.work = work;
        this.workService = workService;
        this.submissions = submissions;
        this.documents = documents;
        this.views = views;
        this.tasks = tasks;
        this.automation = automation;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    public List<InformationItem> items(UUID userId, UUID organizationId, UUID workId, UUID requirementId) {
        return access.run(userId, organizationId, Permission.INFORMATION_READ, granted -> {
            work.find(organizationId, workId).orElseThrow(ApiException::notFound);
            requirement(organizationId, workId, requirementId);
            var items = requirements.items(requirementId);
            var versions = views.versionsOf(items);
            return items.stream().map(item -> WorkViews.item(item, versions)).toList();
        });
    }

    public InformationItem submitValue(
            UUID userId, UUID organizationId, UUID workId, UUID requirementId, String value) {
        return access.run(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
            workService.openForUpdate(organizationId, workId);
            var requirement = lock(workId, requirementId);
            var item = submissions.submitValue(requirement, value, Submissions.Source.teamMember(userId));
            work.touch(organizationId, workId, OffsetDateTime.now(clock));
            return WorkViews.item(item, views.versionsOf(List.of(item)));
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
            workService.openForUpdate(organizationId, workId);
            Submissions.requireDocument(requirement(organizationId, workId, requirementId));
        });
        try (var prepared = documents.prepare(content, fileName)) {
            var outcome = access.run(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
                workService.openForUpdate(organizationId, workId);
                var requirement = lock(workId, requirementId);
                var result = submissions.storeFile(requirement, prepared, Submissions.Source.teamMember(userId));
                if (result.item() == null) {
                    return result;
                }
                work.touch(organizationId, workId, OffsetDateTime.now(clock));
                return result;
            });
            if (outcome.rejected() || outcome.item() == null) {
                throw Submissions.fileRejected();
            }
            return access.run(
                    userId,
                    organizationId,
                    Permission.INFORMATION_READ,
                    granted -> WorkViews.item(outcome.item(), views.versionsOf(List.of(outcome.item()))));
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
            workService.openForUpdate(organizationId, workId);
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
            tasks.reviewed(organizationId, requirementId, accept, reason, userId);
            if (!accept) {
                automation.answerRejected(organizationId, workId, requirementId, item.id());
            }
            work.touch(organizationId, workId, now);
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
