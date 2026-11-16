package com.avenra.work.domain;

import static com.avenra.work.domain.WorkStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** The lifecycle exactly as recorded in ADR-018. */
class WorkStatusTest {

    private static final Map<WorkStatus, Set<WorkStatus>> ADR_018 = Map.of(
            DRAFT, EnumSet.of(READY, CANCELLED),
            READY, EnumSet.of(DRAFT, RUNNING, CANCELLED),
            RUNNING, EnumSet.of(WAITING_FOR_INFORMATION, WAITING_FOR_APPROVAL, BLOCKED, COMPLETED, FAILED, CANCELLED),
            WAITING_FOR_INFORMATION, EnumSet.of(RUNNING, WAITING_FOR_APPROVAL, BLOCKED, CANCELLED),
            WAITING_FOR_APPROVAL, EnumSet.of(RUNNING, WAITING_FOR_INFORMATION, BLOCKED, CANCELLED),
            BLOCKED, EnumSet.of(RUNNING, WAITING_FOR_INFORMATION, WAITING_FOR_APPROVAL, CANCELLED),
            FAILED, EnumSet.noneOf(WorkStatus.class),
            COMPLETED, EnumSet.noneOf(WorkStatus.class),
            CANCELLED, EnumSet.noneOf(WorkStatus.class));

    @Test
    void everyPairIsAllowedExactlyWhenTheAdrAllowsIt() {
        for (WorkStatus from : values()) {
            for (WorkStatus to : values()) {
                assertThat(from.canMoveTo(to))
                        .as(from + " -> " + to)
                        .isEqualTo(ADR_018.get(from).contains(to));
            }
        }
    }

    @Test
    void finalStatusesCannotBeLeftAndNoStatusMovesToItself() {
        assertThat(EnumSet.allOf(WorkStatus.class).stream().filter(WorkStatus::isFinal))
                .containsExactlyInAnyOrder(FAILED, COMPLETED, CANCELLED);
        for (WorkStatus status : values()) {
            assertThat(status.canMoveTo(status)).isFalse();
        }
        assertThat(COMPLETED.next()).isEmpty();
    }

    @Test
    void completionIsReachableOnlyFromRunning() {
        for (WorkStatus status : values()) {
            assertThat(status.canMoveTo(COMPLETED)).isEqualTo(status == RUNNING);
        }
    }

    @Test
    void stoppingNeedsAReason() {
        assertThat(EnumSet.allOf(WorkStatus.class).stream().filter(WorkStatus::needsReason))
                .containsExactlyInAnyOrder(BLOCKED, FAILED, CANCELLED);
    }
}
