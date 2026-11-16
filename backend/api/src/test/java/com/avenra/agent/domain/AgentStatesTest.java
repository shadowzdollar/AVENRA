package com.avenra.agent.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AgentStatesTest {

    private static final OffsetDateTime NOW = OffsetDateTime.of(2026, 10, 20, 9, 0, 0, 0, ZoneOffset.UTC);

    @Test
    void runsMoveOnlyAlongTheirStateMachine() {
        assertThat(RunStatus.PLANNING.moveTo(RunStatus.AWAITING_APPROVAL)).isEqualTo(RunStatus.AWAITING_APPROVAL);
        assertThat(RunStatus.RUNNING.next()).contains(RunStatus.AWAITING_APPROVAL, RunStatus.STOPPED);
        assertThatThrownBy(() -> RunStatus.PLANNING.moveTo(RunStatus.RUNNING))
                .as("nothing runs without passing through approval")
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> RunStatus.RUNNING.moveTo(RunStatus.RUNNING)).isInstanceOf(IllegalStateException.class);
        for (RunStatus finished :
                new RunStatus[] {RunStatus.COMPLETED, RunStatus.REJECTED, RunStatus.STOPPED, RunStatus.FAILED}) {
            assertThat(finished.finished()).isTrue();
            assertThat(finished.next()).isEmpty();
        }
    }

    @Test
    void stepsRunOnlyAfterApproval() {
        assertThatThrownBy(() -> StepStatus.PROPOSED.moveTo(StepStatus.RUNNING))
                .isInstanceOf(IllegalStateException.class);
        assertThat(StepStatus.APPROVED.moveTo(StepStatus.RUNNING).moveTo(StepStatus.SUCCEEDED))
                .isEqualTo(StepStatus.SUCCEEDED);
        assertThat(StepStatus.RUNNING.moveTo(StepStatus.APPROVED))
                .as("a retried attempt")
                .isEqualTo(StepStatus.APPROVED);
        assertThatThrownBy(() -> StepStatus.SUCCEEDED.moveTo(StepStatus.RUNNING))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void onlyHighRiskStepsNeedTheirOwnApproval() {
        assertThat(Risk.LOW.needsOwnApproval()).isFalse();
        assertThat(Risk.MEDIUM.needsOwnApproval()).isFalse();
        assertThat(Risk.HIGH.needsOwnApproval()).isTrue();
        assertThat(Risk.CRITICAL.needsOwnApproval()).isTrue();
    }

    @Test
    void budgetsStopRunsThatOverspendOrOverrun() {
        Budget fresh = Budget.defaults(NOW);
        assertThat(fresh.exceeded(NOW)).isEmpty();
        assertThat(fresh.allowsModelCall()).isTrue();
        Budget planned = fresh.withModelCall(540);
        assertThat(planned.allowsModelCall()).as("one plan per run").isFalse();
        assertThat(planned.withModelCall(0).exceeded(NOW))
                .contains("The run made more model calls than its budget allows.");
        assertThat(fresh.withModelCall(250_000).exceeded(NOW)).contains("The run cost more than its budget allows.");
        Budget sent = planned.withToolCall(true);
        assertThat(sent.allowsToolCall(true)).as("one external effect per run").isFalse();
        assertThat(sent.allowsToolCall(false)).isTrue();
        assertThat(fresh.exceeded(NOW.plus(Budget.DURATION))).contains("The run reached its deadline.");
        Budget busy = fresh;
        for (int i = 0; i < Budget.TOOL_CALLS; i++) {
            busy = busy.withToolCall(false);
        }
        assertThat(busy.allowsToolCall(false)).isFalse();
        assertThat(busy.withToolCall(false).exceeded(NOW)).isPresent();
    }
}
