package com.avenra.verification.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.verification.domain.Answer.Kind;
import com.avenra.verification.domain.Result.Outcome;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class VerifierTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 14);

    private static Result verify(List<Rule> rules, Answer answer) {
        return Verifier.verify(rules, answer, Map.of(), TODAY);
    }

    @Test
    void passingEveryCheckIsPassedWithFullConfidence() {
        var result =
                verify(List.of(Rules.pattern("[0-9]{8}"), Rules.length(8, 8)), Answer.value(Kind.TEXT, "12345678"));
        assertThat(result.status()).isEqualTo(Result.Status.PASSED);
        assertThat(result.confidence()).isEqualByComparingTo("1");
        assertThat(result.checks()).extracting(Result.Check::outcome).containsOnly(Outcome.PASSED);
    }

    @Test
    void aFailedBlockingCheckFailsWithItsMessage() {
        var result = verify(List.of(Rules.pattern("[0-9]{8}"), Rules.length(1, 100)), Answer.value(Kind.TEXT, "1234"));
        assertThat(result.status()).isEqualTo(Result.Status.FAILED);
        assertThat(result.blockingProblems()).containsExactly("Use 8 digits");
        // Blocking weighs 2, advisory 1: one advisory pass of 3 total.
        assertThat(result.confidence()).isEqualByComparingTo("0.333");
    }

    @Test
    void aFailedAdvisoryCheckNeedsReview() {
        var result = verify(List.of(Rules.length(10, null)), Answer.value(Kind.TEXT, "short"));
        assertThat(result.status()).isEqualTo(Result.Status.NEEDS_REVIEW);
        assertThat(result.blockingProblems()).isEmpty();
    }

    @Test
    void withoutRulesNothingIsClaimed() {
        var result = verify(List.of(), Answer.value(Kind.TEXT, "anything"));
        assertThat(result.status()).isEqualTo(Result.Status.PASSED);
        assertThat(result.confidence()).isNull();
    }

    @Test
    void numbersDatesAndValues() {
        assertThat(verify(List.of(Rules.range("0", "100", Rule.Severity.BLOCKING)), Answer.value(Kind.NUMBER, "100"))
                        .status())
                .isEqualTo(Result.Status.PASSED);
        assertThat(verify(List.of(Rules.range("0", "100", Rule.Severity.BLOCKING)), Answer.value(Kind.NUMBER, "100.5"))
                        .status())
                .isEqualTo(Result.Status.FAILED);
        assertThat(verify(List.of(Rules.oneOf("Ltd", "PLC")), Answer.value(Kind.TEXT, " plc "))
                        .status())
                .isEqualTo(Result.Status.PASSED);
        assertThat(verify(List.of(Rules.oneOf("1", "2.50")), Answer.value(Kind.NUMBER, "2.5"))
                        .status())
                .isEqualTo(Result.Status.PASSED);
        assertThat(verify(List.of(Rules.notExpiringWithin(30)), Answer.value(Kind.DATE, "2026-11-12"))
                        .status())
                .as("29 days away")
                .isEqualTo(Result.Status.FAILED);
        assertThat(verify(List.of(Rules.notExpiringWithin(30)), Answer.value(Kind.DATE, "2026-11-13"))
                        .status())
                .isEqualTo(Result.Status.PASSED);
        assertThat(verify(
                                List.of(Rules.between(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31))),
                                Answer.value(Kind.DATE, "2027-01-01"))
                        .status())
                .isEqualTo(Result.Status.FAILED);
    }

    @Test
    void consistencyChecksCompareWithTheRelatedAnswerOrWaitForIt() {
        UUID other = UUID.randomUUID();
        var rules = List.of(Rules.equalsOther(other, Rule.Severity.BLOCKING));
        var answer = Answer.value(Kind.TEXT, "Acme  Ltd");
        assertThat(Verifier.verify(
                                rules, answer, Map.of(other, Optional.of(Answer.value(Kind.TEXT, "acme ltd"))), TODAY)
                        .status())
                .isEqualTo(Result.Status.PASSED);
        assertThat(Verifier.verify(
                                rules, answer, Map.of(other, Optional.of(Answer.value(Kind.TEXT, "Acme PLC"))), TODAY)
                        .status())
                .isEqualTo(Result.Status.FAILED);
        var waiting = Verifier.verify(rules, answer, Map.of(other, Optional.empty()), TODAY);
        assertThat(waiting.status()).isEqualTo(Result.Status.NEEDS_REVIEW);
        assertThat(waiting.anySkipped()).isTrue();
        assertThat(waiting.blockingProblems()).isEmpty();
        assertThat(Verifier.verify(rules, answer, Map.of(), TODAY).anySkipped())
                .as("not visible")
                .isTrue();

        var order = List.of(Rules.dateOrder(other, Rule.Order.BEFORE));
        assertThat(Verifier.verify(
                                order,
                                Answer.value(Kind.DATE, "2026-01-01"),
                                Map.of(other, Optional.of(Answer.value(Kind.DATE, "2026-02-01"))),
                                TODAY)
                        .status())
                .isEqualTo(Result.Status.PASSED);
    }

    @Test
    void documentsAreCheckedByTheirDetectedFacts() {
        var pdf = Answer.document(new Answer.DocumentFacts("application/pdf", 2_000, "a".repeat(64)));
        var png = Answer.document(new Answer.DocumentFacts("image/png", 2_000, "a".repeat(64)));
        assertThat(verify(List.of(Rules.fileType("application/pdf"), Rules.fileSize(5_000)), pdf)
                        .status())
                .isEqualTo(Result.Status.PASSED);
        assertThat(verify(List.of(Rules.fileType("application/pdf")), png).blockingProblems())
                .containsExactly("Send a PDF");
        assertThat(verify(List.of(Rules.fileSize(1_000)), pdf).status()).isEqualTo(Result.Status.FAILED);
    }

    @Test
    void aCatastrophicPatternFailsWithinItsBudgetInsteadOfHanging() {
        // Takes about 35 seconds on Java 25 without the budget (measured), so it proves the guard.
        var evil = Rules.pattern("(a*)*\\1b");
        long started = System.nanoTime();
        var result = verify(List.of(evil), Answer.value(Kind.TEXT, "a".repeat(30)));
        Duration took = Duration.ofNanos(System.nanoTime() - started);
        assertThat(result.status()).isEqualTo(Result.Status.FAILED);
        assertThat(result.checks().getFirst().detail()).isEqualTo("the pattern took too long to evaluate");
        assertThat(took).isLessThan(Duration.ofSeconds(1));
    }

    @Test
    void theSameInputAlwaysGivesTheSameResult() {
        var rules = List.of(Rules.pattern("[A-Z]{2}[0-9]{6}"), Rules.length(8, 8));
        var answer = Answer.value(Kind.TEXT, "AB123456");
        assertThat(verify(rules, answer)).isEqualTo(verify(rules, answer));
        assertThat(Verifier.confidence(List.of())).isNull();
        assertThat(BigDecimal.ONE).isEqualByComparingTo(verify(rules, answer).confidence());
    }
}
