package com.avenra.work.application;

import com.avenra.information.InformationEvents;
import com.avenra.work.domain.ExceptionType;
import java.util.Map;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Reacts to what happened to information (ADR-026), inside the transaction that published it:
 * review tasks, automatic transitions (as jobs), executions for reminders, and exceptions.
 */
@Component
class InformationListener {

    private final WorkAutomation automation;
    private final HumanTasks tasks;
    private final Executions executions;
    private final Exceptions exceptions;

    InformationListener(WorkAutomation automation, HumanTasks tasks, Executions executions, Exceptions exceptions) {
        this.automation = automation;
        this.tasks = tasks;
        this.executions = executions;
        this.exceptions = exceptions;
    }

    @EventListener
    void on(InformationEvents.AnswerReceived event) {
        automation.answerReceived(
                event.organizationId(),
                event.workId(),
                event.requirementId(),
                event.requirementTitle(),
                event.itemId(),
                event.fromClient());
    }

    @EventListener
    void on(InformationEvents.AnswerReviewed event) {
        if (event.reviewerUserId() != null) {
            tasks.reviewed(
                    event.organizationId(),
                    event.requirementId(),
                    event.accepted(),
                    event.reason(),
                    event.reviewerUserId());
        } else {
            tasks.decidedBySystem(event.organizationId(), event.requirementId(), event.accepted(), event.reason());
        }
        if (!event.accepted()) {
            automation.answerRejected(event.organizationId(), event.workId(), event.requirementId(), event.itemId());
        }
    }

    @EventListener
    void on(InformationEvents.InformationRequested event) {
        automation.informationRequested(event.organizationId(), event.workId(), event.requestLinkId());
    }

    /** A reminder is an automated action: recorded as an execution, verified by being durably queued. */
    @EventListener
    void on(InformationEvents.ReminderSent event) {
        executions
                .start(new Executions.Plan(
                        event.organizationId(),
                        event.workId(),
                        "information.reminder",
                        "request_link.remind",
                        "request_link",
                        event.requestLinkId(),
                        event.recipient(),
                        "reminder " + event.reminder(),
                        event.requestLinkId() + ":" + event.reminder()))
                .ifPresent(id -> executions.completeVerified(
                        id,
                        Map.of(
                                "reminder", String.valueOf(event.reminder()),
                                "outstanding", String.valueOf(event.outstanding()))));
    }

    @EventListener
    void on(InformationEvents.AcceptedAnswerInconsistent event) {
        exceptions.raise(
                event.organizationId(),
                event.workId(),
                ExceptionType.INCONSISTENT_INFORMATION,
                "The accepted answer for \"" + event.requirementTitle() + "\" no longer passes its checks: "
                        + String.join(" ", event.problems())
                        + " Ask for a corrected answer, or keep it with an override reason.",
                "information_item",
                event.itemId().toString());
    }

    @EventListener
    void on(InformationEvents.RequestExpiredIncomplete event) {
        exceptions.raise(
                event.organizationId(),
                event.workId(),
                ExceptionType.REQUEST_EXPIRED_INCOMPLETE,
                "The request sent to " + event.recipient() + " expired with " + event.missing()
                        + (event.missing() == 1 ? " required item" : " required items")
                        + " still missing. Contact the client or send a new request.",
                "request_link",
                event.requestLinkId().toString());
    }
}
