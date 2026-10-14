package com.avenra.work.application;

import com.avenra.audit.AuditLog;
import com.avenra.platform.web.ApiException;
import com.avenra.work.domain.WorkStatus;
import com.avenra.work.infrastructure.RequirementRepository;
import com.avenra.work.infrastructure.WorkRepository;
import com.avenra.work.infrastructure.WorkRepository.TransitionRow;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * The only way work changes status (ADR-018, ADR-023), for people and for the platform's rules
 * alike: the lifecycle, reasons and the completion guard apply to both, and every move is recorded
 * with its actor and audited.
 */
@Component
class WorkLifecycle {

    /** Who moves the work: a person, or a named platform rule. */
    record Actor(@Nullable UUID userId, @Nullable String rule) {

        static Actor user(UUID userId) {
            return new Actor(userId, null);
        }

        static Actor rule(String rule) {
            return new Actor(null, rule);
        }
    }

    private final WorkRepository work;
    private final RequirementRepository requirements;
    private final WorkViews views;
    private final AuditLog audit;
    private final Clock clock;

    WorkLifecycle(
            WorkRepository work, RequirementRepository requirements, WorkViews views, AuditLog audit, Clock clock) {
        this.work = work;
        this.requirements = requirements;
        this.views = views;
        this.audit = audit;
        this.clock = clock;
    }

    /**
     * Moves locked work to {@code target}.
     *
     * @throws ApiException {@code INVALID_TRANSITION}, a missing reason, {@code REQUIREMENTS_INCOMPLETE}
     *     or {@code TASKS_OPEN}
     */
    @Transactional(propagation = Propagation.MANDATORY)
    void move(WorkRow current, WorkStatus target, @Nullable String reason, Actor actor) {
        if (!current.status().canMoveTo(target)) {
            throw ApiException.conflict(
                    "INVALID_TRANSITION", "Work cannot move from " + current.status() + " to " + target + ".");
        }
        if (target.needsReason() && reason == null) {
            throw ApiException.invalid("reason", "is required when moving to " + target);
        }
        UUID organizationId = current.organizationId();
        UUID workId = current.id();
        if (target == WorkStatus.COMPLETED) {
            requireCompletable(organizationId, workId);
        }
        OffsetDateTime now = OffsetDateTime.now(clock);
        OffsetDateTime startedAt =
                current.startedAt() == null && target == WorkStatus.RUNNING ? now : current.startedAt();
        work.changeStatus(
                organizationId,
                workId,
                target,
                startedAt,
                target.isFinal() ? now : null,
                target.isFinal() ? reason : null,
                now);
        work.insertTransition(
                organizationId,
                workId,
                new TransitionRow(
                        UUID.randomUUID(), current.status(), target, actor.userId(), actor.rule(), reason, now));
        if (target == WorkStatus.CANCELLED || target == WorkStatus.FAILED) {
            work.cancelSystemTasks(
                    organizationId,
                    workId,
                    "The work was " + target.name().toLowerCase(java.util.Locale.ROOT),
                    actor.userId(),
                    now);
        }
        var event = AuditLog.Event.of("work.transitioned", organizationId, actor.userId())
                .resource("work", workId)
                .detail("from", current.status().name())
                .detail("to", target.name());
        audit.record(actor.rule() == null ? event : event.detail("rule", actor.rule()));
    }

    private void requireCompletable(UUID organizationId, UUID workId) {
        var loaded = views.load(requirements.forWork(organizationId, workId));
        if (!loaded.completeness().complete()) {
            throw ApiException.conflict(
                    "REQUIREMENTS_INCOMPLETE", "Every required item must be accepted before the work is completed.");
        }
        if (work.openTasks(organizationId, workId) > 0) {
            throw ApiException.conflict(
                    "TASKS_OPEN", "Every task must be done or cancelled before the work is completed.");
        }
    }
}
