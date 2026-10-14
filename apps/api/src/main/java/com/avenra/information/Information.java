package com.avenra.information;

import com.avenra.contract.v1.model.Requirement;
import com.avenra.information.application.InformationViews;
import com.avenra.information.domain.Completeness;
import com.avenra.information.infrastructure.RequestLinkRepository;
import com.avenra.information.infrastructure.RequirementRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * What other modules may ask about requirements and answers (ADR-026). Every method runs inside
 * the caller's tenant transaction; the caller has already checked access.
 */
@Component
public class Information {

    /** The requirements of a work item as the API shows them, with their completeness. */
    public record RequirementsView(List<Requirement> requirements, Completeness completeness) {}

    /**
     * One requirement in the completion manifest (ADR-028): its accepted answer with a fingerprint
     * or document checksum, how it was decided, and its latest verification.
     */
    public record CompletionFact(
            UUID requirementId,
            String title,
            String kind,
            boolean required,
            String state,
            @Nullable UUID itemId,
            @Nullable String answerFingerprint,
            @Nullable UUID documentId,
            @Nullable Integer documentVersion,
            @Nullable String documentSha256,
            @Nullable String decidedBy,
            @Nullable UUID decidedByUserId,
            @Nullable OffsetDateTime decidedAt,
            @Nullable String overrideReason,
            @Nullable UUID verificationId,
            @Nullable String verificationStatus,
            @Nullable String confidence,
            int rulesVersion) {

        /** An accepted answer whose latest check failed and that nobody confirmed with an override. */
        public boolean failedWithoutOverride() {
            return "ACCEPTED".equals(state) && "FAILED".equals(verificationStatus) && overrideReason == null;
        }
    }

    /** A requirement's identity, for messages about it. */
    public record RequirementSummary(UUID id, UUID workId, String title) {}

    private final RequirementRepository requirements;
    private final RequestLinkRepository links;
    private final InformationViews views;
    private final Clock clock;

    Information(RequirementRepository requirements, RequestLinkRepository links, InformationViews views, Clock clock) {
        this.requirements = requirements;
        this.links = links;
        this.views = views;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public RequirementsView requirementsOf(UUID organizationId, UUID workId) {
        var rows = requirements.forWork(organizationId, workId);
        var loaded = views.load(rows);
        return new RequirementsView(
                rows.stream().map(row -> views.requirement(row, loaded)).toList(), loaded.completeness());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Completeness completeness(UUID organizationId, UUID workId) {
        return views.load(requirements.forWork(organizationId, workId)).completeness();
    }

    /** Completeness of several work items at once, for lists. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Map<UUID, Completeness> completenessByWork(UUID organizationId, Collection<UUID> workIds) {
        var byWork = requirements.states(organizationId, workIds).stream()
                .collect(Collectors.groupingBy(
                        RequirementRepository.RequirementStateRow::workId,
                        Collectors.mapping(
                                state -> new Completeness.Entry(
                                        state.required(), Completeness.RequirementState.of(state.verificationState())),
                                Collectors.toList())));
        return workIds.stream()
                .collect(Collectors.toMap(id -> id, id -> Completeness.of(byWork.getOrDefault(id, List.of()))));
    }

    /** Whether an answer is still the current one for its requirement and still awaits review. */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean isPendingCurrentAnswer(UUID requirementId, UUID itemId) {
        var requirement = requirements.find(requirementId).orElse(null);
        if (requirement == null || !itemId.equals(requirement.currentItemId())) {
            return false;
        }
        return requirements.itemsByIds(List.of(itemId)).stream()
                .anyMatch(item -> item.verificationState() == Completeness.VerificationState.PENDING);
    }

    /** Whether a client is currently being asked for this requirement through an active link. */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean askedThroughActiveLink(UUID organizationId, UUID requirementId) {
        return links.activeLinksCovering(organizationId, requirementId, OffsetDateTime.now(clock)) > 0;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public List<CompletionFact> completionFacts(UUID organizationId, UUID workId) {
        var rows = requirements.forWork(organizationId, workId);
        var loaded = views.load(rows);
        return rows.stream()
                .map(row -> {
                    var item = loaded.current(row);
                    var state = loaded.state(row).name();
                    if (item == null) {
                        return new CompletionFact(
                                row.id(),
                                row.title(),
                                row.kind().name(),
                                row.required(),
                                state,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                row.rulesVersion());
                    }
                    var checks = loaded.results().get(item.id());
                    var document = item.documentId() == null
                            ? null
                            : loaded.versions().get(InformationViews.key(item.documentId(), item.documentVersion()));
                    return new CompletionFact(
                            row.id(),
                            row.title(),
                            row.kind().name(),
                            row.required(),
                            state,
                            item.id(),
                            item.valueText() == null
                                    ? null
                                    : com.avenra.verification.Verification.fingerprint(item.valueText()),
                            item.documentId(),
                            item.documentVersion(),
                            document == null ? null : document.sha256Hex(),
                            item.decidedBy(),
                            item.reviewedBy(),
                            item.reviewedAt(),
                            item.overrideReason(),
                            checks == null ? null : checks.id(),
                            checks == null ? null : checks.result().status().name(),
                            checks == null || checks.result().confidence() == null
                                    ? null
                                    : checks.result().confidence().toPlainString(),
                            row.rulesVersion());
                })
                .toList();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<RequirementSummary> requirement(UUID requirementId) {
        return requirements.find(requirementId).map(row -> new RequirementSummary(row.id(), row.workId(), row.title()));
    }
}
