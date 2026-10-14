package com.avenra.work.application;

import com.avenra.platform.jobs.Job;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.jobs.JobWorker;
import com.avenra.work.domain.Completeness;
import com.avenra.work.domain.WorkStatus;
import com.avenra.work.infrastructure.RequestLinkRepository;
import com.avenra.work.infrastructure.RequirementRepository;
import com.avenra.work.infrastructure.WorkRepository;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * The rules that move work on their own (ADR-023). Triggers enqueue a job in the transaction of
 * the change that caused them; the job re-checks the rule against the current state, so a late or
 * repeated job does nothing wrong, and records what it did as an execution.
 */
@Configuration(proxyBeanMethods = false)
class WorkAutomation {

    static final String ANSWER_RECEIVED = "work.answer_received";
    static final String INFORMATION_REQUESTED = "work.information_requested";
    static final String ANSWER_REJECTED = "work.answer_rejected";

    private final JobQueue jobs;

    WorkAutomation(JobQueue jobs) {
        this.jobs = jobs;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    void answerReceived(UUID organizationId, UUID workId, UUID requirementId, UUID itemId) {
        jobs.enqueue(JobQueue.Request.of(
                        ANSWER_RECEIVED,
                        organizationId,
                        Map.of("workId", workId, "requirementId", requirementId, "itemId", itemId))
                .idempotencyKey(itemId.toString()));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    void informationRequested(UUID organizationId, UUID workId, UUID linkId) {
        jobs.enqueue(JobQueue.Request.of(
                        INFORMATION_REQUESTED, organizationId, Map.of("workId", workId, "requestLinkId", linkId))
                .idempotencyKey(linkId.toString()));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    void answerRejected(UUID organizationId, UUID workId, UUID requirementId, UUID itemId) {
        jobs.enqueue(JobQueue.Request.of(
                        ANSWER_REJECTED,
                        organizationId,
                        Map.of("workId", workId, "requirementId", requirementId, "itemId", itemId))
                .idempotencyKey(itemId.toString()));
    }

    /** Applies one rule inside the job's tenant transaction. */
    static final class Rules {

        private final WorkRepository work;
        private final RequirementRepository requirements;
        private final RequestLinkRepository links;
        private final WorkLifecycle lifecycle;
        private final WorkViews views;
        private final Executions executions;
        private final HumanTasks tasks;
        private final Clock clock;

        Rules(
                WorkRepository work,
                RequirementRepository requirements,
                RequestLinkRepository links,
                WorkLifecycle lifecycle,
                WorkViews views,
                Executions executions,
                HumanTasks tasks,
                Clock clock) {
            this.work = work;
            this.requirements = requirements;
            this.links = links;
            this.lifecycle = lifecycle;
            this.views = views;
            this.executions = executions;
            this.tasks = tasks;
            this.clock = clock;
        }

        /** Opens the review task and, when nothing asked for is still outstanding, resumes the work. */
        void answerReceived(Job job) {
            UUID workId = UUID.fromString(JobWorker.text(job.payload(), "workId"));
            UUID requirementId = UUID.fromString(JobWorker.text(job.payload(), "requirementId"));
            UUID itemId = UUID.fromString(JobWorker.text(job.payload(), "itemId"));
            var target = work.findForUpdate(job.organizationId(), workId).orElse(null);
            if (target == null || target.status().isFinal()) {
                return;
            }
            var requirement = requirements.forWork(job.organizationId(), workId).stream()
                    .filter(row -> row.id().equals(requirementId))
                    .findFirst()
                    .orElse(null);
            if (requirement == null || !itemId.equals(requirement.currentItemId())) {
                return; // a newer answer arrived meanwhile; its own job handles it
            }
            var item = requirements.itemsByIds(List.of(itemId)).getFirst();
            if (item.verificationState() == Completeness.VerificationState.PENDING) {
                tasks.reviewNeeded(
                        target, requirement, item.sourceType().equals("CLIENT_LINK") ? "the client" : "a team member");
            }
            if (target.status() == WorkStatus.WAITING_FOR_INFORMATION && nothingOutstanding(target)) {
                advance(
                        target,
                        WorkStatus.RUNNING,
                        "information.received",
                        "Every requested item was answered",
                        itemId);
            }
        }

        void informationRequested(Job job) {
            UUID workId = UUID.fromString(JobWorker.text(job.payload(), "workId"));
            UUID linkId = UUID.fromString(JobWorker.text(job.payload(), "requestLinkId"));
            var target = work.findForUpdate(job.organizationId(), workId).orElse(null);
            if (target == null || target.status() != WorkStatus.RUNNING || nothingOutstanding(target)) {
                return;
            }
            advance(
                    target,
                    WorkStatus.WAITING_FOR_INFORMATION,
                    "information.requested",
                    "Information was requested from the client",
                    linkId);
        }

        void answerRejected(Job job) {
            UUID workId = UUID.fromString(JobWorker.text(job.payload(), "workId"));
            UUID requirementId = UUID.fromString(JobWorker.text(job.payload(), "requirementId"));
            UUID itemId = UUID.fromString(JobWorker.text(job.payload(), "itemId"));
            var target = work.findForUpdate(job.organizationId(), workId).orElse(null);
            if (target == null || target.status() != WorkStatus.RUNNING) {
                return;
            }
            if (links.activeLinksCovering(job.organizationId(), requirementId, OffsetDateTime.now(clock)) == 0) {
                return; // nobody outside was asked for it; the team corrects it themselves
            }
            advance(
                    target,
                    WorkStatus.WAITING_FOR_INFORMATION,
                    "information.rejected",
                    "An answer was rejected and the client was asked to correct it",
                    itemId);
        }

        private boolean nothingOutstanding(WorkRow target) {
            var completeness = views.load(requirements.forWork(target.organizationId(), target.id()))
                    .completeness();
            return completeness.missing() == 0 && completeness.rejected() == 0;
        }

        private void advance(WorkRow target, WorkStatus to, String rule, String reason, UUID cause) {
            var execution = executions.start(new Executions.Plan(
                    target.organizationId(),
                    target.id(),
                    rule,
                    "work.advance",
                    null,
                    null,
                    to.name(),
                    cause.toString(),
                    rule + ":" + cause));
            if (execution.isEmpty()) {
                return;
            }
            lifecycle.move(target, to, reason, WorkLifecycle.Actor.rule(rule));
            WorkStatus now = work.find(target.organizationId(), target.id())
                    .orElseThrow()
                    .status();
            if (now == to) {
                executions.completeVerified(
                        execution.get(), Map.of("from", target.status().name(), "to", to.name()));
            } else {
                executions.fail(execution.get(), "The work is " + now + ", not " + to);
            }
        }
    }

    @Bean
    Rules workRules(
            WorkRepository work,
            RequirementRepository requirements,
            RequestLinkRepository links,
            WorkLifecycle lifecycle,
            WorkViews views,
            Executions executions,
            HumanTasks tasks,
            Clock clock) {
        return new Rules(work, requirements, links, lifecycle, views, executions, tasks, clock);
    }

    @Bean
    JobHandler answerReceivedHandler(Rules rules) {
        return handler(ANSWER_RECEIVED, rules::answerReceived);
    }

    @Bean
    JobHandler informationRequestedHandler(Rules rules) {
        return handler(INFORMATION_REQUESTED, rules::informationRequested);
    }

    @Bean
    JobHandler answerRejectedHandler(Rules rules) {
        return handler(ANSWER_REJECTED, rules::answerRejected);
    }

    static JobHandler handler(String type, java.util.function.Consumer<Job> body) {
        return new JobHandler() {
            @Override
            public String type() {
                return type;
            }

            @Override
            public void handle(Job job) {
                body.accept(job);
            }
        };
    }
}
