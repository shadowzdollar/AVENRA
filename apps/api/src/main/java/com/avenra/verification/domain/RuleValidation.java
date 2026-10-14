package com.avenra.verification.domain;

import com.avenra.verification.domain.Answer.Kind;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import org.jspecify.annotations.Nullable;

/**
 * Checks that a rule makes sense for the requirement it is attached to, before it is stored
 * (ADR-027): the rule fits the kind of answer, has exactly the parameters it needs, and points
 * only at requirements of the same work with a matching kind.
 */
public final class RuleValidation {

    /** The types a document can be detected as (ADR-019). */
    public static final Set<String> CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/csv",
            "text/plain");

    private static final int MAX_PATTERN = 200;

    private RuleValidation() {}

    /**
     * @param kind the kind of the requirement the rules belong to
     * @param self the requirement's own id (a rule may not refer to itself)
     * @param siblings the other requirements of the same work and their kinds
     * @param maxUploadBytes the largest file the platform accepts
     * @return the problems, one per invalid rule, as "rule N: problem"; empty when all are valid
     */
    public static List<String> problems(
            List<Rule> rules, Kind kind, UUID self, Map<UUID, Kind> siblings, long maxUploadBytes) {
        var problems = new ArrayList<String>();
        for (int i = 0; i < rules.size(); i++) {
            String problem = problem(rules.get(i), kind, self, siblings, maxUploadBytes);
            if (problem != null) {
                problems.add("rule " + (i + 1) + ": " + problem);
            }
        }
        return problems;
    }

    private static @Nullable String problem(
            Rule rule, Kind kind, UUID self, Map<UUID, Kind> siblings, long maxUploadBytes) {
        if (!appliesTo(rule.type(), kind)) {
            return rule.type() + " does not apply to " + kind.name().toLowerCase(java.util.Locale.ROOT) + " answers";
        }
        String extra = unexpectedParameters(rule);
        if (extra != null) {
            return extra;
        }
        return switch (rule.type()) {
            case PATTERN -> pattern(rule.pattern());
            case LENGTH ->
                rule.minLength() == null && rule.maxLength() == null
                        ? "needs minLength or maxLength"
                        : rule.minLength() != null && rule.maxLength() != null && rule.minLength() > rule.maxLength()
                                ? "minLength is greater than maxLength"
                                : null;
            case ONE_OF -> rule.values().isEmpty() ? "needs values" : null;
            case RANGE ->
                rule.min() == null && rule.max() == null
                        ? "needs min or max"
                        : rule.min() != null && rule.max() != null && rule.min().compareTo(rule.max()) > 0
                                ? "min is greater than max"
                                : null;
            case DATE_RANGE -> dateRange(rule);
            case EQUALS_REQUIREMENT -> other(rule, kind, self, siblings, false);
            case DATE_ORDER -> rule.order() == null ? "needs order" : other(rule, kind, self, siblings, true);
            case FILE_TYPE ->
                rule.contentTypes().isEmpty()
                        ? "needs contentTypes"
                        : rule.contentTypes().stream().allMatch(CONTENT_TYPES::contains)
                                ? null
                                : "contentTypes must be types Avenra accepts";
            case FILE_SIZE ->
                rule.maxBytes() == null
                        ? "needs maxBytes"
                        : rule.maxBytes() > maxUploadBytes ? "maxBytes is above the upload limit" : null;
        };
    }

    static boolean appliesTo(Rule.Type type, Kind kind) {
        return switch (type) {
            case PATTERN, LENGTH -> kind == Kind.TEXT;
            case ONE_OF -> kind == Kind.TEXT || kind == Kind.NUMBER;
            case RANGE -> kind == Kind.NUMBER;
            case DATE_RANGE, DATE_ORDER -> kind == Kind.DATE;
            case EQUALS_REQUIREMENT -> kind == Kind.TEXT || kind == Kind.NUMBER || kind == Kind.DATE;
            case FILE_TYPE, FILE_SIZE -> kind == Kind.DOCUMENT;
        };
    }

    /** Parameters of other rule types are refused rather than silently ignored. */
    private static @Nullable String unexpectedParameters(Rule rule) {
        var present = new ArrayList<String>();
        if (rule.pattern() != null) present.add("pattern");
        if (rule.minLength() != null || rule.maxLength() != null) present.add("length");
        if (!rule.values().isEmpty()) present.add("values");
        if (rule.min() != null || rule.max() != null) present.add("range");
        if (rule.notBefore() != null
                || rule.notAfter() != null
                || rule.minDaysFromToday() != null
                || rule.maxDaysFromToday() != null) {
            present.add("dates");
        }
        if (rule.otherRequirementId() != null || rule.order() != null) present.add("other");
        if (!rule.contentTypes().isEmpty()) present.add("contentTypes");
        if (rule.maxBytes() != null) present.add("maxBytes");
        Set<String> allowed = switch (rule.type()) {
            case PATTERN -> Set.of("pattern");
            case LENGTH -> Set.of("length");
            case ONE_OF -> Set.of("values");
            case RANGE -> Set.of("range");
            case DATE_RANGE -> Set.of("dates");
            case EQUALS_REQUIREMENT, DATE_ORDER -> Set.of("other");
            case FILE_TYPE -> Set.of("contentTypes");
            case FILE_SIZE -> Set.of("maxBytes");
        };
        return present.stream()
                .filter(name -> !allowed.contains(name))
                .findFirst()
                .map(name -> "parameter " + name + " does not belong to " + rule.type())
                .orElse(null);
    }

    private static @Nullable String pattern(@Nullable String pattern) {
        if (pattern == null || pattern.isBlank()) {
            return "needs a pattern";
        }
        if (pattern.length() > MAX_PATTERN) {
            return "pattern is longer than " + MAX_PATTERN + " characters";
        }
        try {
            Pattern.compile(pattern);
            return null;
        } catch (PatternSyntaxException invalid) {
            return "pattern is not a valid regular expression";
        }
    }

    private static @Nullable String dateRange(Rule rule) {
        boolean absolute = rule.notBefore() != null || rule.notAfter() != null;
        boolean relative = rule.minDaysFromToday() != null || rule.maxDaysFromToday() != null;
        if (!absolute && !relative) {
            return "needs notBefore, notAfter, minDaysFromToday or maxDaysFromToday";
        }
        if (rule.notBefore() != null
                && rule.notAfter() != null
                && rule.notBefore().isAfter(rule.notAfter())) {
            return "notBefore is after notAfter";
        }
        if (rule.minDaysFromToday() != null
                && rule.maxDaysFromToday() != null
                && rule.minDaysFromToday() > rule.maxDaysFromToday()) {
            return "minDaysFromToday is greater than maxDaysFromToday";
        }
        return null;
    }

    private static @Nullable String other(Rule rule, Kind kind, UUID self, Map<UUID, Kind> siblings, boolean dates) {
        UUID other = rule.otherRequirementId();
        if (other == null) {
            return "needs otherRequirementId";
        }
        if (other.equals(self)) {
            return "cannot refer to its own requirement";
        }
        Kind otherKind = siblings.get(other);
        if (otherKind == null) {
            return "otherRequirementId must be a requirement of the same work";
        }
        if (dates && otherKind != Kind.DATE) {
            return "the other requirement must be a date";
        }
        if (otherKind != kind) {
            return "the other requirement must be of the same kind";
        }
        return null;
    }
}
