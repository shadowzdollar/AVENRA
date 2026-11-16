package com.avenra.work.domain;

import com.avenra.information.domain.Completeness;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** What completing work requires (ADR-028), computed by the server from the current state. */
public final class CompletionCriteria {

    private CompletionCriteria() {}

    public enum Name {
        REQUIREMENTS_ACCEPTED,
        CHECKS_PASSED,
        NO_HIGH_EXCEPTIONS,
        TASKS_CLOSED
    }

    public record Criterion(
            Name name,
            boolean met,
            String description,
            @Nullable String detail) {}

    public static List<Criterion> of(
            Completeness completeness, long failedWithoutOverride, long openHighExceptions, long openTasks) {
        return List.of(
                new Criterion(
                        Name.REQUIREMENTS_ACCEPTED,
                        completeness.complete(),
                        "Every required item is accepted",
                        completeness.complete()
                                ? null
                                : (completeness.required() - completeness.accepted()) + " of " + completeness.required()
                                        + " still to accept"),
                new Criterion(
                        Name.CHECKS_PASSED,
                        failedWithoutOverride == 0,
                        "No accepted answer fails its checks without an override",
                        failedWithoutOverride == 0
                                ? null
                                : failedWithoutOverride + " accepted answers fail their checks"),
                new Criterion(
                        Name.NO_HIGH_EXCEPTIONS,
                        openHighExceptions == 0,
                        "No high-severity exception is open",
                        openHighExceptions == 0 ? null : openHighExceptions + " open"),
                new Criterion(
                        Name.TASKS_CLOSED,
                        openTasks == 0,
                        "Every task is done or cancelled",
                        openTasks == 0 ? null : openTasks + " open"));
    }

    public static boolean allMet(List<Criterion> criteria) {
        return criteria.stream().allMatch(Criterion::met);
    }
}
