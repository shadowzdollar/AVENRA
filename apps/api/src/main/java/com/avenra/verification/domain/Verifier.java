package com.avenra.verification.domain;

import com.avenra.verification.domain.Answer.Kind;
import com.avenra.verification.domain.Result.Check;
import com.avenra.verification.domain.Result.Outcome;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.jspecify.annotations.Nullable;

/**
 * Evaluates rules against an answer (ADR-027). Deterministic: the same rules, answer, related
 * answers and day always give the same result. No I/O.
 */
public final class Verifier {

    /** Longest a pattern may take on one value; a pattern that takes longer fails its check. */
    static final Duration PATTERN_BUDGET = Duration.ofMillis(50);

    private Verifier() {}

    /**
     * @param related current answers of other requirements, by requirement; a requirement that is
     *     absent is unknown here (not visible or not answered), and its checks are skipped
     */
    public static Result verify(List<Rule> rules, Answer answer, Map<UUID, Optional<Answer>> related, LocalDate today) {
        var checks = new ArrayList<Check>();
        for (Rule rule : rules) {
            checks.add(check(rule, answer, related, today));
        }
        return new Result(status(checks), confidence(checks), checks);
    }

    private static Result.Status status(List<Check> checks) {
        boolean blockingFailed = checks.stream()
                .anyMatch(check -> check.outcome() == Outcome.FAILED && check.severity() == Rule.Severity.BLOCKING);
        if (blockingFailed) {
            return Result.Status.FAILED;
        }
        boolean open = checks.stream().anyMatch(check -> check.outcome() != Outcome.PASSED);
        return open ? Result.Status.NEEDS_REVIEW : Result.Status.PASSED;
    }

    /** Share of passed weight; blocking checks weigh 2, advisory 1; unset without rules. */
    static @Nullable BigDecimal confidence(List<Check> checks) {
        if (checks.isEmpty()) {
            return null;
        }
        int total = 0;
        int passed = 0;
        for (Check check : checks) {
            total += check.severity().weight();
            if (check.outcome() == Outcome.PASSED) {
                passed += check.severity().weight();
            }
        }
        return BigDecimal.valueOf(passed).divide(BigDecimal.valueOf(total), 3, RoundingMode.DOWN);
    }

    private static Check check(Rule rule, Answer answer, Map<UUID, Optional<Answer>> related, LocalDate today) {
        try {
            return switch (rule.type()) {
                case PATTERN -> outcome(rule, matches(rule.pattern(), text(answer)), null);
                case LENGTH -> length(rule, text(answer));
                case ONE_OF -> outcome(rule, oneOf(rule, answer), null);
                case RANGE -> range(rule, new BigDecimal(text(answer)));
                case DATE_RANGE -> dateRange(rule, LocalDate.parse(text(answer)), today);
                case EQUALS_REQUIREMENT -> related(rule, related, other -> equal(answer, other));
                case DATE_ORDER -> related(rule, related, other -> ordered(rule, answer, other));
                case FILE_TYPE ->
                    outcome(
                            rule,
                            rule.contentTypes().contains(facts(answer).contentType()),
                            "detected " + facts(answer).contentType());
                case FILE_SIZE ->
                    outcome(
                            rule,
                            facts(answer).sizeBytes() <= rule.maxBytes(),
                            facts(answer).sizeBytes() + " bytes");
            };
        } catch (PatternTooSlow slow) {
            return new Check(
                    rule.id(),
                    rule.type(),
                    Outcome.FAILED,
                    rule.severity(),
                    rule.message(),
                    "the pattern took too long to evaluate");
        } catch (RuntimeException notComparable) {
            // An answer of the wrong shape for this rule cannot pass it.
            return new Check(
                    rule.id(),
                    rule.type(),
                    Outcome.FAILED,
                    rule.severity(),
                    rule.message(),
                    "the answer cannot be checked by this rule");
        }
    }

    private static Check outcome(Rule rule, boolean passed, @Nullable String detail) {
        return new Check(
                rule.id(),
                rule.type(),
                passed ? Outcome.PASSED : Outcome.FAILED,
                rule.severity(),
                rule.message(),
                detail);
    }

    private static Check length(Rule rule, String value) {
        int length = value.codePointCount(0, value.length());
        boolean passed = (rule.minLength() == null || length >= rule.minLength())
                && (rule.maxLength() == null || length <= rule.maxLength());
        return outcome(rule, passed, length + " characters");
    }

    private static boolean oneOf(Rule rule, Answer answer) {
        String value = text(answer);
        if (answer.kind() == Kind.NUMBER) {
            BigDecimal number = new BigDecimal(value);
            return rule.values().stream().anyMatch(allowed -> {
                try {
                    return new BigDecimal(allowed).compareTo(number) == 0;
                } catch (NumberFormatException notANumber) {
                    return false;
                }
            });
        }
        return rule.values().stream().anyMatch(allowed -> allowed.strip().equalsIgnoreCase(value.strip()));
    }

    private static Check range(Rule rule, BigDecimal value) {
        boolean passed = (rule.min() == null || value.compareTo(rule.min()) >= 0)
                && (rule.max() == null || value.compareTo(rule.max()) <= 0);
        return outcome(rule, passed, null);
    }

    private static Check dateRange(Rule rule, LocalDate date, LocalDate today) {
        boolean passed = (rule.notBefore() == null || !date.isBefore(rule.notBefore()))
                && (rule.notAfter() == null || !date.isAfter(rule.notAfter()))
                && (rule.minDaysFromToday() == null || !date.isBefore(today.plusDays(rule.minDaysFromToday())))
                && (rule.maxDaysFromToday() == null || !date.isAfter(today.plusDays(rule.maxDaysFromToday())));
        return outcome(rule, passed, null);
    }

    private static Check related(
            Rule rule, Map<UUID, Optional<Answer>> related, java.util.function.Predicate<Answer> test) {
        Optional<Answer> other = related.get(rule.otherRequirementId());
        if (other == null || other.isEmpty()) {
            return new Check(
                    rule.id(),
                    rule.type(),
                    Outcome.SKIPPED,
                    rule.severity(),
                    rule.message(),
                    "waiting for the related answer");
        }
        return outcome(rule, test.test(other.get()), null);
    }

    private static boolean equal(Answer answer, Answer other) {
        if (answer.kind() == Kind.NUMBER) {
            return new BigDecimal(text(answer)).compareTo(new BigDecimal(text(other))) == 0;
        }
        if (answer.kind() == Kind.TEXT) {
            return normalize(text(answer)).equals(normalize(text(other)));
        }
        return text(answer).equals(text(other));
    }

    private static boolean ordered(Rule rule, Answer answer, Answer other) {
        LocalDate date = LocalDate.parse(text(answer));
        LocalDate otherDate = LocalDate.parse(text(other));
        return rule.order() == Rule.Order.BEFORE ? date.isBefore(otherDate) : date.isAfter(otherDate);
    }

    /** Text compares ignoring case and runs of whitespace. */
    private static String normalize(String value) {
        return value.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static String text(Answer answer) {
        if (answer.value() == null) {
            throw new IllegalArgumentException("no value");
        }
        return answer.value();
    }

    private static Answer.DocumentFacts facts(Answer answer) {
        if (answer.document() == null) {
            throw new IllegalArgumentException("no document");
        }
        return answer.document();
    }

    /** Whole-value match within {@link #PATTERN_BUDGET}, so a catastrophic pattern cannot hang a request. */
    static boolean matches(@Nullable String pattern, String value) {
        long deadline = System.nanoTime() + PATTERN_BUDGET.toNanos();
        return Pattern.compile(pattern).matcher(new Deadline(value, deadline)).matches();
    }

    private static final class PatternTooSlow extends RuntimeException {
        private static final long serialVersionUID = 1L;

        PatternTooSlow() {
            super("pattern too slow", null, false, false);
        }
    }

    /** A character sequence that stops a regular expression once its time is up. */
    private record Deadline(CharSequence inner, long deadlineNanos) implements CharSequence {

        @Override
        public char charAt(int index) {
            if (System.nanoTime() > deadlineNanos) {
                throw new PatternTooSlow();
            }
            return inner.charAt(index);
        }

        @Override
        public int length() {
            return inner.length();
        }

        @Override
        public CharSequence subSequence(int start, int end) {
            return new Deadline(inner.subSequence(start, end), deadlineNanos);
        }

        @Override
        public String toString() {
            return inner.toString();
        }
    }
}
