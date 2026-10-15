package com.avenra.work.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.information.domain.Completeness;
import org.junit.jupiter.api.Test;

/** What the work page tells people (Guidelines §107). */
class ProgressTest {

    private static final Completeness TWO_MISSING = new Completeness(2, 0, 0, 2, 0);
    private static final Completeness ONE_TO_REVIEW = new Completeness(2, 1, 1, 0, 0);
    private static final Completeness DONE = new Completeness(2, 2, 0, 0, 0);

    @Test
    void theNextActionFollowsTheState() {
        assertThat(Progress.of(WorkStatus.DRAFT, TWO_MISSING, 0, 0, null).nextAction())
                .contains("Add what is required");
        assertThat(Progress.of(WorkStatus.WAITING_FOR_INFORMATION, TWO_MISSING, 0, 0, null)
                        .nextAction())
                .contains("client still has to provide 2 items");
        assertThat(Progress.of(WorkStatus.RUNNING, ONE_TO_REVIEW, 0, 0, null).nextAction())
                .isEqualTo("Review 1 answer.");
        assertThat(Progress.of(WorkStatus.RUNNING, DONE, 2, 0, null).nextAction())
                .isEqualTo("Finish 2 open tasks.");
        assertThat(Progress.of(WorkStatus.RUNNING, DONE, 0, 0, null).nextAction())
                .isEqualTo("Complete the work.");
    }

    @Test
    void blockedWorkSaysWhyAndExceptionsAreMentioned() {
        var blocked = Progress.of(WorkStatus.BLOCKED, TWO_MISSING, 0, 1, "Waiting for the bank");
        assertThat(blocked.blockedReason()).isEqualTo("Waiting for the bank");
        assertThat(blocked.nextAction()).contains("1 exception needs attention");
        assertThat(Progress.of(WorkStatus.RUNNING, TWO_MISSING, 0, 0, "old reason")
                        .blockedReason())
                .isNull();
        assertThat(Progress.of(WorkStatus.COMPLETED, DONE, 0, 3, null).nextAction())
                .isEqualTo("Nothing; the work is finished.");
    }
}
