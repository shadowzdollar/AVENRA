package com.avenra.work.application;

import com.avenra.work.infrastructure.WorkRepository;
import com.avenra.work.infrastructure.WorkRepository.TaskRow;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tasks the platform creates when a person has to act (Guidelines §106, ADR-024). Each says what
 * is needed, why, by when and with which choices, and is closed by the action it asks for.
 */
@Component
class HumanTasks {

    static final String REQUIREMENT = "requirement";
    static final Duration REVIEW_WITHIN = Duration.ofDays(2);

    private final WorkRepository work;
    private final Clock clock;

    HumanTasks(WorkRepository work, Clock clock) {
        this.work = work;
        this.clock = clock;
    }

    /** An answer arrived for a requirement: someone must accept or reject it. */
    @Transactional(propagation = Propagation.MANDATORY)
    void reviewNeeded(WorkRow target, UUID requirementId, String requirementTitle, String source) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        work.openSystemTask(
                target.organizationId(),
                new TaskRow(
                        UUID.randomUUID(),
                        target.id(),
                        "Review: " + requirementTitle,
                        "The answer is accepted or rejected",
                        "HUMAN",
                        "OPEN",
                        target.ownerMembershipId(),
                        now.plus(REVIEW_WITHIN),
                        null,
                        null,
                        now,
                        "SYSTEM",
                        "Accept the answer for \"" + requirementTitle + "\", or reject it with a reason the client"
                                + " will see",
                        "An answer arrived from " + source,
                        "ACCEPT,REJECT",
                        REQUIREMENT,
                        requirementId));
    }

    /** The platform decided on the answer (ADR-027): the review task is closed as decided by rules. */
    @Transactional(propagation = Propagation.MANDATORY)
    void decidedBySystem(UUID organizationId, UUID requirementId, boolean accepted, @Nullable String reason) {
        work.closeSystemTask(
                organizationId,
                REQUIREMENT,
                requirementId,
                "DONE",
                (accepted ? "Accepted automatically" : "Rejected automatically: " + reason),
                null,
                OffsetDateTime.now(clock));
    }

    /** The answer was reviewed: the review task is done. */
    @Transactional(propagation = Propagation.MANDATORY)
    void reviewed(UUID organizationId, UUID requirementId, boolean accepted, @Nullable String reason, UUID by) {
        work.closeSystemTask(
                organizationId,
                REQUIREMENT,
                requirementId,
                "DONE",
                accepted ? "Accepted" : "Rejected: " + reason,
                by,
                OffsetDateTime.now(clock));
    }
}
