package com.avenra.information.application;

import com.avenra.agent.InformationTools;
import com.avenra.contract.v1.model.CreateRequestLinkRequest;
import com.avenra.contract.v1.model.CreateRequirementRequest;
import com.avenra.contract.v1.model.RequirementKind;
import com.avenra.information.domain.Completeness.RequirementState;
import com.avenra.information.infrastructure.RequestLinkRepository;
import com.avenra.information.infrastructure.RequirementRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * The information module's side of the agent's tool gateway (ADR-033). Actions go through the
 * module's own services, so their permission checks, validation, idempotency and audit apply.
 */
@Component
class AgentInformationTools implements InformationTools {

    /** Request links sent by the assistant stay valid for the default period. */
    private static final int LINK_DAYS = 14;

    private final RequirementRepository requirements;
    private final RequestLinkRepository links;
    private final InformationService information;
    private final RequestLinkService requestLinks;
    private final InformationViews views;
    private final Clock clock;

    AgentInformationTools(
            RequirementRepository requirements,
            RequestLinkRepository links,
            InformationService information,
            RequestLinkService requestLinks,
            InformationViews views,
            Clock clock) {
        this.requirements = requirements;
        this.links = links;
        this.information = information;
        this.requestLinks = requestLinks;
        this.views = views;
        this.clock = clock;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public List<String> requirementTitles(UUID organizationId, UUID workId) {
        return requirements.forWork(organizationId, workId).stream()
                .map(RequirementRepository.RequirementRow::title)
                .toList();
    }

    @Override
    public UUID createRequirement(
            UUID userId,
            UUID organizationId,
            UUID workId,
            String idempotencyKey,
            String title,
            String kind,
            boolean required,
            String instructions) {
        var request = new CreateRequirementRequest(title, RequirementKind.fromValue(kind), required);
        if (!instructions.isBlank()) {
            request.instructions(instructions);
        }
        return information
                .createRequirement(userId, organizationId, workId, idempotencyKey, request)
                .getId();
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean requirementExists(UUID organizationId, UUID workId, UUID requirementId, String title) {
        return requirements.forWork(organizationId, workId).stream()
                .anyMatch(row -> row.id().equals(requirementId) && row.title().equals(title));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public List<UUID> openRequiredRequirements(UUID organizationId, UUID workId) {
        var rows = requirements.forWork(organizationId, workId);
        var loaded = views.load(rows);
        var open = new ArrayList<UUID>();
        for (var row : rows) {
            var state = loaded.state(row);
            if (row.required() && (state == RequirementState.MISSING || state == RequirementState.REJECTED)) {
                open.add(row.id());
            }
        }
        return open;
    }

    @Override
    public UUID sendRequest(
            UUID userId,
            UUID organizationId,
            UUID workId,
            String idempotencyKey,
            String recipientEmail,
            String message,
            List<UUID> requirementIds) {
        var request =
                new CreateRequestLinkRequest(recipientEmail, new ArrayList<>(requirementIds)).expiresInDays(LINK_DAYS);
        if (!message.isBlank()) {
            request.message(message);
        }
        return requestLinks
                .create(userId, organizationId, workId, idempotencyKey, request)
                .getId();
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean activeRequestTo(UUID organizationId, UUID workId, UUID linkId, String recipientEmail) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return links.find(organizationId, workId, linkId)
                .filter(link -> link.revokedAt() == null && link.expiresAt().isAfter(now))
                .filter(link -> link.recipientEmail().equalsIgnoreCase(recipientEmail.strip()))
                .isPresent();
    }
}
