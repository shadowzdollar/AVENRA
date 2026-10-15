package com.avenra.information;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * Facts the information module publishes inside the transaction that caused them (ADR-026). The
 * work module turns them into review tasks, automatic transitions, executions and exceptions.
 */
public final class InformationEvents {

    private InformationEvents() {}

    /** An answer was recorded for a requirement. {@code fromClient} is false for team members. */
    public record AnswerReceived(
            UUID organizationId,
            UUID workId,
            UUID requirementId,
            String requirementTitle,
            UUID itemId,
            boolean fromClient) {}

    /** A person or the platform decided on an answer. {@code reviewerUserId} is null for system decisions. */
    public record AnswerReviewed(
            UUID organizationId,
            UUID workId,
            UUID requirementId,
            UUID itemId,
            boolean accepted,
            @Nullable String reason,
            @Nullable UUID reviewerUserId) {}

    /** A request link was sent to a client. */
    public record InformationRequested(UUID organizationId, UUID workId, UUID requestLinkId) {}

    /** A reminder for a request link was queued (an automated action, ADR-023). */
    public record ReminderSent(
            UUID organizationId, UUID workId, UUID requestLinkId, int reminder, String recipient, int outstanding) {}

    /** An accepted answer no longer passes its checks (a related answer changed, ADR-027). */
    public record AcceptedAnswerInconsistent(
            UUID organizationId,
            UUID workId,
            UUID requirementId,
            String requirementTitle,
            UUID itemId,
            java.util.List<String> problems) {}

    /** A request link expired with required items still missing. */
    public record RequestExpiredIncomplete(
            UUID organizationId, UUID workId, UUID requestLinkId, String recipient, long missing) {}
}
