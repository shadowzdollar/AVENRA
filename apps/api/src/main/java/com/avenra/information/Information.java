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
    public Optional<RequirementSummary> requirement(UUID requirementId) {
        return requirements.find(requirementId).map(row -> new RequirementSummary(row.id(), row.workId(), row.title()));
    }
}
