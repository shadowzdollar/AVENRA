package com.avenra.work.domain;

import static com.avenra.work.domain.ExceptionStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** The exception lifecycle as recorded in ADR-024. */
class ExceptionStatusTest {

    @Test
    void openExceptionsCanBeWorkedOnAndClosed() {
        assertThat(OPEN.next()).containsExactlyInAnyOrder(IN_PROGRESS, WAITING, RESOLVED, DISMISSED);
        assertThat(IN_PROGRESS.next()).containsExactlyInAnyOrder(WAITING, RESOLVED, DISMISSED);
        assertThat(WAITING.next()).containsExactlyInAnyOrder(IN_PROGRESS, RESOLVED, DISMISSED);
    }

    @Test
    void closedExceptionsStayClosedAndNeedAResolution() {
        for (ExceptionStatus closed : new ExceptionStatus[] {RESOLVED, DISMISSED}) {
            assertThat(closed.next()).isEmpty();
            assertThat(closed.needsResolution()).isTrue();
        }
        assertThat(IN_PROGRESS.needsResolution()).isFalse();
        assertThat(IN_PROGRESS.canMoveTo(OPEN)).isFalse();
    }
}
