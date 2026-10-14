package com.avenra.work.domain;

import org.jspecify.annotations.Nullable;

/**
 * What a person needs to know about work without reading logs (Guidelines §107): where it stands,
 * what happens next, and why it is blocked.
 */
public record Progress(
        String currentStep, String nextAction, @Nullable String blockedReason) {

    public static Progress of(
            WorkStatus status,
            Completeness completeness,
            long openTasks,
            long openExceptions,
            @Nullable String lastReason) {
        String step = switch (status) {
            case DRAFT -> "Being prepared";
            case READY -> "Ready to start";
            case RUNNING -> completeness.complete() ? "Everything required is accepted" : "Collecting and reviewing";
            case WAITING_FOR_INFORMATION -> "Waiting for the client";
            case WAITING_FOR_APPROVAL -> "Waiting for approval";
            case BLOCKED -> "Blocked";
            case FAILED -> "Failed";
            case COMPLETED -> "Completed";
            case CANCELLED -> "Cancelled";
        };
        String next = switch (status) {
            case DRAFT -> "Add what is required, then mark the work ready.";
            case READY -> "Start the work.";
            case RUNNING -> running(completeness, openTasks);
            case WAITING_FOR_INFORMATION ->
                "The client still has to provide " + items(completeness.missing() + completeness.rejected())
                        + ". Reminders are sent automatically.";
            case WAITING_FOR_APPROVAL -> "An approver has to decide.";
            case BLOCKED -> "Resolve the blocker, then resume the work.";
            case FAILED, COMPLETED, CANCELLED -> "Nothing; the work is finished.";
        };
        if (openExceptions > 0 && !status.isFinal()) {
            next = next + " " + openExceptions + (openExceptions == 1 ? " exception needs" : " exceptions need")
                    + " attention.";
        }
        return new Progress(step, next, status == WorkStatus.BLOCKED ? lastReason : null);
    }

    private static String running(Completeness completeness, long openTasks) {
        if (completeness.awaitingReview() > 0) {
            return "Review " + answers(completeness.awaitingReview()) + ".";
        }
        if (completeness.missing() + completeness.rejected() > 0) {
            return "Ask the client for " + items(completeness.missing() + completeness.rejected()) + ".";
        }
        if (openTasks > 0) {
            return "Finish " + openTasks + (openTasks == 1 ? " open task." : " open tasks.");
        }
        return "Complete the work.";
    }

    private static String items(int count) {
        return count + (count == 1 ? " item" : " items");
    }

    private static String answers(int count) {
        return count + (count == 1 ? " answer" : " answers");
    }
}
