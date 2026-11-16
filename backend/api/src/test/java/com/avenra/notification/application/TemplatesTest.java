package com.avenra.notification.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.notification.domain.Category;
import org.junit.jupiter.api.Test;

class TemplatesTest {

    @Test
    void textsArePlainShortAndNameOnlyTitles() {
        var text = Templates.exception("Acme\nAdvisory", "Onboarding\r\nJane", "HIGH", "Late.\u0007");
        assertThat(text.title())
                .doesNotContainPattern("\\p{Cntrl}")
                .contains("Onboarding")
                .contains("Acme");
        assertThat(text.body()).startsWith("High exception: ").doesNotContainPattern("\\p{Cntrl}");
        var long_ = Templates.answer("A", "W", "x".repeat(500));
        assertThat(long_.title()).hasSize(200).endsWith("…");
        assertThat(Templates.requestExpired("A", "W", 1).title()).isEqualTo("A request expired with 1 item missing");
        assertThat(Templates.approval("A", "W", true).title()).contains("email the client");
    }

    @Test
    void emailDefaultsFollowTheDecision() {
        assertThat(Category.ANSWER.emailByDefault()).isFalse();
        for (Category category : new Category[] {
            Category.EXCEPTION, Category.REQUEST, Category.APPROVAL, Category.INTEGRATION, Category.ESCALATION
        }) {
            assertThat(category.emailByDefault()).as(category.code()).isTrue();
        }
        assertThat(Category.of("escalation")).contains(Category.ESCALATION);
        assertThat(Category.of("nope")).isEmpty();
    }
}
