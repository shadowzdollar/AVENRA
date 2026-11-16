package com.avenra.verification.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** The outcome of verifying one answer against its rules (Guidelines §25). */
public record Result(Status status, @Nullable BigDecimal confidence, List<Check> checks) {

    public Result {
        checks = List.copyOf(checks);
    }

    public enum Status {
        PASSED,
        FAILED,
        NEEDS_REVIEW
    }

    public enum Outcome {
        PASSED,
        FAILED,
        /** The check could not run yet, e.g. the other answer is missing or not visible. */
        SKIPPED
    }

    public record Check(
            @Nullable UUID ruleId,
            Rule.Type rule,
            Outcome outcome,
            Rule.Severity severity,
            String message,
            @Nullable String detail) {}

    /** The messages of failed blocking checks: what the client must correct. */
    public List<String> blockingProblems() {
        return checks.stream()
                .filter(check -> check.outcome() == Outcome.FAILED && check.severity() == Rule.Severity.BLOCKING)
                .map(Check::message)
                .toList();
    }

    public boolean anySkipped() {
        return checks.stream().anyMatch(check -> check.outcome() == Outcome.SKIPPED);
    }
}
