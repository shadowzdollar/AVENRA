package com.avenra.verification.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.verification.domain.Answer.Kind;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Rules are checked when defined (ADR-027): they fit the answer and have exactly their parameters. */
class RuleValidationTest {

    private static final UUID SELF = UUID.randomUUID();
    private static final UUID TEXT_SIBLING = UUID.randomUUID();
    private static final UUID DATE_SIBLING = UUID.randomUUID();
    private static final Map<UUID, Kind> SIBLINGS = Map.of(TEXT_SIBLING, Kind.TEXT, DATE_SIBLING, Kind.DATE);

    private static List<String> problems(Kind kind, Rule... rules) {
        return RuleValidation.problems(List.of(rules), kind, SELF, SIBLINGS, 25 * 1024 * 1024);
    }

    @Test
    void validRulesPass() {
        assertThat(problems(
                        Kind.TEXT,
                        Rules.pattern("[0-9]{8}"),
                        Rules.length(1, 10),
                        Rules.oneOf("a"),
                        Rules.equalsOther(TEXT_SIBLING, Rule.Severity.ADVISORY)))
                .isEmpty();
        assertThat(problems(Kind.DATE, Rules.notExpiringWithin(30), Rules.dateOrder(DATE_SIBLING, Rule.Order.AFTER)))
                .isEmpty();
        assertThat(problems(Kind.DOCUMENT, Rules.fileType("application/pdf"), Rules.fileSize(1_000)))
                .isEmpty();
    }

    @Test
    void rulesMustFitTheKindOfAnswer() {
        assertThat(problems(Kind.NUMBER, Rules.pattern("x")))
                .singleElement()
                .asString()
                .contains("does not apply");
        assertThat(problems(Kind.TEXT, Rules.fileType("application/pdf"))).hasSize(1);
        assertThat(problems(Kind.BOOLEAN, Rules.range("0", "1", Rule.Severity.BLOCKING)))
                .hasSize(1);
    }

    @Test
    void parametersMustBeCompleteConsistentAndTheirOwn() {
        assertThat(problems(Kind.TEXT, Rules.pattern("[unclosed")))
                .singleElement()
                .asString()
                .contains("not a valid");
        assertThat(problems(Kind.TEXT, Rules.pattern("x".repeat(201)))).hasSize(1);
        assertThat(problems(Kind.TEXT, Rules.length(10, 5)))
                .singleElement()
                .asString()
                .contains("greater");
        assertThat(problems(Kind.NUMBER, Rules.range("5", "1", Rule.Severity.BLOCKING)))
                .hasSize(1);
        assertThat(problems(Kind.DATE, Rules.between(LocalDate.of(2027, 1, 1), LocalDate.of(2026, 1, 1))))
                .hasSize(1);
        assertThat(problems(Kind.DOCUMENT, Rules.fileType("application/x-msdownload")))
                .hasSize(1);
        assertThat(problems(Kind.DOCUMENT, Rules.fileSize(26L * 1024 * 1024)))
                .singleElement()
                .asString()
                .contains("limit");
        var mixed = Rules.pattern("[0-9]+");
        var withValues = new Rule(
                null,
                mixed.type(),
                mixed.severity(),
                mixed.message(),
                mixed.pattern(),
                null,
                null,
                List.of("x"),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null);
        assertThat(problems(Kind.TEXT, withValues)).singleElement().asString().contains("does not belong");
    }

    @Test
    void consistencyRulesPointAtSiblingsOfTheSameKind() {
        assertThat(problems(Kind.TEXT, Rules.equalsOther(UUID.randomUUID(), Rule.Severity.BLOCKING)))
                .singleElement()
                .asString()
                .contains("same work");
        assertThat(problems(Kind.TEXT, Rules.equalsOther(SELF, Rule.Severity.BLOCKING)))
                .singleElement()
                .asString()
                .contains("its own");
        assertThat(problems(Kind.TEXT, Rules.equalsOther(DATE_SIBLING, Rule.Severity.BLOCKING)))
                .singleElement()
                .asString()
                .contains("same kind");
        assertThat(problems(Kind.DATE, Rules.dateOrder(DATE_SIBLING, null))).hasSize(1);
    }
}
