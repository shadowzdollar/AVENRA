package com.avenra.platform.analytics;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/** The shared arithmetic of analytics (ADR-038). */
class AnalyticsContributorTest {

    @Test
    void aPercentOfNothingIsNotMeasuredRatherThanZero() {
        assertThat(AnalyticsContributor.percent(1, 3)).isEqualTo(33.3);
        assertThat(AnalyticsContributor.percent(2, 2)).isEqualTo(100.0);
        assertThat(AnalyticsContributor.percent(0, 0)).isNull();
    }

    @Test
    void sqlNumbersBecomeDoublesAndNullStaysNull() {
        assertThat(AnalyticsContributor.number(new BigDecimal("7200.0"))).isEqualTo(7200.0);
        assertThat(AnalyticsContributor.number(null)).isNull();
    }
}
