package com.avenra.work.domain;

import static com.avenra.work.domain.ExecutionStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** The execution state machine exactly as recorded in ADR-023 (Guidelines §29). */
class ExecutionStatusTest {

    private static final Map<ExecutionStatus, Set<ExecutionStatus>> ADR_023 = Map.ofEntries(
            Map.entry(PLANNED, EnumSet.of(AUTHORIZED, CANCELLED)),
            Map.entry(AUTHORIZED, EnumSet.of(READY, CANCELLED)),
            Map.entry(READY, EnumSet.of(RUNNING, CANCELLED)),
            Map.entry(RUNNING, EnumSet.of(WAITING, REQUIRES_APPROVAL, FAILED, SUCCEEDED)),
            Map.entry(WAITING, EnumSet.of(RUNNING, FAILED, CANCELLED)),
            Map.entry(REQUIRES_APPROVAL, EnumSet.of(RUNNING, CANCELLED)),
            Map.entry(SUCCEEDED, EnumSet.of(VERIFIED, FAILED)),
            Map.entry(VERIFIED, EnumSet.of(COMPLETED)),
            Map.entry(FAILED, EnumSet.noneOf(ExecutionStatus.class)),
            Map.entry(COMPLETED, EnumSet.noneOf(ExecutionStatus.class)),
            Map.entry(CANCELLED, EnumSet.noneOf(ExecutionStatus.class)));

    @Test
    void everyPairIsAllowedExactlyWhenTheAdrAllowsIt() {
        for (ExecutionStatus from : values()) {
            for (ExecutionStatus to : values()) {
                assertThat(from.canMoveTo(to))
                        .as(from + " -> " + to)
                        .isEqualTo(ADR_023.get(from).contains(to));
            }
        }
    }

    @Test
    void successIsNeverCompleteWithoutVerification() {
        assertThat(SUCCEEDED.canMoveTo(COMPLETED)).isFalse();
        assertThat(RUNNING.canMoveTo(VERIFIED)).isFalse();
        assertThat(EnumSet.allOf(ExecutionStatus.class).stream().filter(ExecutionStatus::isFinal))
                .containsExactlyInAnyOrder(FAILED, COMPLETED, CANCELLED);
    }
}
