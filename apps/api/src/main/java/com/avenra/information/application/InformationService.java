package com.avenra.information.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.CreateRequirementRequest;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.RequirementRulesInput;
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
import com.avenra.verification.Verification;
import com.avenra.verification.domain.Result;
import com.avenra.verification.domain.Rule;
import java.io.InputStream;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
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
    private final Verification verification;
    private final AnswerChecks checks;
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
            Verification verification,
            AnswerChecks checks,
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
        this.verification = verification;
        this.checks = checks;
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
        String acceptance =
                input.getAcceptance() == null ? "MANUAL" : input.getAcceptance().getValue();
        String risk = input.getRisk() == null ? "NORMAL" : input.getRisk().getValue();
        List<Rule> rules = RuleInputs.from(input.getRules());
        return access.run(
                userId,
                organizationId,
                Permission.WORK_UPDATE,
                granted -> idempotency.once(
                        userId,
                        "createRequirement",
                        idempotencyKey,
                        Text.fingerprint(
                                organizationId, workId, title, instructions, kind, required, acceptance, risk, rules),
                        Requirement.class,
                        () -> {
                            work.lockOpen(organizationId, workId);
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            requireAcceptanceAllowed(acceptance, risk);
                            var row = RequirementRow.create(
                                    UUID.randomUUID(),
                                    organizationId,
                                    workId,
                                    title,
                                    instructions,
                                    kind,
                                    required,
                                    acceptance,
                                    risk,
                                    now);
                            requirements.insert(row, userId);
                            if (!rules.isEmpty()) {
                                verification.validate(
                                        rules, AnswerChecks.kind(kind), row.id(), siblings(organizationId, workId));
                                verification.saveRules(organizationId, row.id(), 1, rules, userId);
                                requirements.updateRules(row.id(), 1, acceptance, risk, now);
                                row = requirements.find(row.id()).orElseThrow();
                            }
                            work.touch(organizationId, workId);
                            audit.record(AuditLog.Event.of("work.requirement.created", organizationId, userId)
                                    .resource("requirement", row.id())
                                    .detail("workId", workId.toString()));
                            return views.requirement(row, views.load(List.of(row)));
                        }));
    }

    /** Replaces how a requirement is verified (ADR-027); a pending answer is checked again. */
    public Requirement setRules(
            UUID userId, UUID organizationId, UUID workId, UUID requirementId, RequirementRulesInput input) {
        List<Rule> rules = RuleInputs.from(input.getRules());
        String acceptance = input.getAcceptance().getValue();
        String risk = input.getRisk().getValue();
        requireAcceptanceAllowed(acceptance, risk);
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            work.lockOpen(organizationId, workId);
            var requirement = lock(workId, requirementId);
            verification.validate(
                    rules, AnswerChecks.kind(requirement.kind()), requirementId, siblings(organizationId, workId));
            int version = requirement.rulesVersion() + 1;
            verification.saveRules(organizationId, requirementId, version, rules, userId);
            OffsetDateTime now = OffsetDateTime.now(clock);
            requirements.updateRules(requirementId, version, acceptance, risk, now);
            var updated = lock(workId, requirementId);
            checks.recheckCurrent(updated);
            work.touch(organizationId, workId);
            audit.record(AuditLog.Event.of("information.rules.changed", organizationId, userId)
                    .resource("requirement", requirementId)
                    .detail("version", version)
                    .detail("rules", rules.size()));
            var reloaded = lock(workId, requirementId);
            return views.requirement(reloaded, views.load(List.of(reloaded)));
        });
    }

    public List<com.avenra.contract.v1.model.VerificationResult> verifications(
            UUID userId, UUID organizationId, UUID workId, UUID requirementId) {
        return access.run(userId, organizationId, Permission.INFORMATION_READ, granted -> {
            requirement(organizationId, workId, requirementId);
            return verification.history(requirementId).stream()
                    .map(InformationViews::result)
                    .toList();
        });
    }

    private Map<UUID, com.avenra.verification.domain.Answer.Kind> siblings(UUID organizationId, UUID workId) {
        var siblings = new java.util.HashMap<UUID, com.avenra.verification.domain.Answer.Kind>();
        requirements
                .forWork(organizationId, workId)
                .forEach(row -> siblings.put(row.id(), AnswerChecks.kind(row.kind())));
        return siblings;
    }

    /** High-risk requirements are always decided by a person (ADR-027). */
    private static void requireAcceptanceAllowed(String acceptance, String risk) {
        if (acceptance.equals("AUTOMATIC") && risk.equals("HIGH")) {
            throw ApiException.invalid("acceptance", "cannot be AUTOMATIC for a high-risk requirement");
        }
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
            if (accept && item.verificationState() == VerificationState.ACCEPTED && failedNow(item)) {
                // An accepted answer that stopped passing its checks: confirm it with an override.
                String override = Text.optional(input.getOverrideReason());
                if (override == null) {
                    throw new ApiException(
                            "OVERRIDE_REQUIRED",
                            HttpStatus.CONFLICT,
                            "This accepted answer no longer passes its checks. Give an override reason to keep it.");
                }
                requirements.reconfirm(item.id(), userId, override, OffsetDateTime.now(clock));
                verification.recordDecision(
                        AnswerChecks.subject(requirement, item),
                        true,
                        "Kept despite failed checks (override: " + override + ")");
                audit.record(AuditLog.Event.of("work.information.reconfirmed", organizationId, userId)
                        .resource("information_item", item.id())
                        .detail("requirementId", requirementId.toString())
                        .detail("override", true));
                var reloaded = requirements.findForUpdate(workId, requirementId).orElseThrow();
                return views.requirement(reloaded, views.load(List.of(reloaded)));
            }
            if (item.verificationState() == decision) {
                // The same review again: nothing changes (idempotent).
                return views.requirement(requirement, views.load(List.of(requirement)));
            }
            boolean rulesRejected =
                    item.verificationState() == VerificationState.REJECTED && "RULES".equals(item.decidedBy());
            if (item.verificationState() != VerificationState.PENDING && !(rulesRejected && accept)) {
                throw notAwaitingReview();
            }
            String override = Text.optional(input.getOverrideReason());
            var latest = verification.latest(List.of(item.id())).get(item.id());
            boolean checksClear = latest == null || latest.result().status() == Result.Status.PASSED;
            if (accept && (!checksClear || rulesRejected) && override == null) {
                throw new ApiException(
                        "OVERRIDE_REQUIRED",
                        HttpStatus.CONFLICT,
                        "This answer did not pass its checks. Give an override reason to accept it anyway.");
            }
            if (!accept || checksClear && !rulesRejected) {
                override = null;
            }
            OffsetDateTime now = OffsetDateTime.now(clock);
            if (!requirements.decideByPerson(item.id(), decision, userId, reason, override, now)) {
                throw notAwaitingReview();
            }
            verification.recordDecision(
                    AnswerChecks.subject(requirement, item),
                    true,
                    (accept ? "Accepted" : "Rejected: " + reason)
                            + (override == null ? "" : " (override: " + override + ")"));
            events.publishEvent(new InformationEvents.AnswerReviewed(
                    organizationId, workId, requirementId, item.id(), accept, reason, userId));
            work.touch(organizationId, workId);
            var event = AuditLog.Event.of(
                            accept ? "work.information.accepted" : "work.information.rejected", organizationId, userId)
                    .resource("information_item", item.id())
                    .detail("requirementId", requirementId.toString())
                    .detail("workId", workId.toString());
            audit.record(override == null ? event : event.detail("override", true));
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

    private boolean failedNow(RequirementRepository.ItemRow item) {
        var latest = verification.latest(List.of(item.id())).get(item.id());
        return latest != null && latest.result().status() == Result.Status.FAILED && item.overrideReason() == null;
    }

    private static ApiException notAwaitingReview() {
        return ApiException.conflict("NOT_AWAITING_REVIEW", "This submission is not awaiting review.");
    }
}
