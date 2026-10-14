package com.avenra.information.domain;

import static com.avenra.information.domain.Completeness.RequirementState.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.information.domain.Completeness.Entry;
import com.avenra.information.domain.Completeness.VerificationState;
import java.util.List;
import org.junit.jupiter.api.Test;

class CompletenessTest {

    @Test
    void onlyRequiredRequirementsCount() {
        var completeness = Completeness.of(List.of(
                new Entry(true, ACCEPTED),
                new Entry(true, SUBMITTED),
                new Entry(true, MISSING),
                new Entry(true, REJECTED),
                new Entry(false, MISSING)));
        assertThat(completeness).isEqualTo(new Completeness(4, 1, 1, 1, 1));
        assertThat(completeness.complete()).isFalse();
    }

    @Test
    void workWithOnlyAcceptedOrOptionalRequirementsIsComplete() {
        assertThat(Completeness.of(List.of()).complete()).isTrue();
        assertThat(Completeness.of(List.of(new Entry(true, ACCEPTED), new Entry(false, REJECTED)))
                        .complete())
                .isTrue();
    }

    @Test
    void theStateFollowsTheCurrentItem() {
        assertThat(Completeness.RequirementState.of(null)).isEqualTo(MISSING);
        assertThat(Completeness.RequirementState.of(VerificationState.PENDING)).isEqualTo(SUBMITTED);
        assertThat(Completeness.RequirementState.of(VerificationState.ACCEPTED)).isEqualTo(ACCEPTED);
        assertThat(Completeness.RequirementState.of(VerificationState.REJECTED)).isEqualTo(REJECTED);
    }
}
