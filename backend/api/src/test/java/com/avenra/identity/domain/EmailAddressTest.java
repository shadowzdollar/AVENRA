package com.avenra.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EmailAddressTest {

    @Test
    void normalizesCaseAndWhitespaceButKeepsTheDisplayForm() {
        var email = EmailAddress.of("  Ana.Smith@Example.COM ");
        assertThat(email.display()).isEqualTo("Ana.Smith@Example.COM");
        assertThat(email.normalized()).isEqualTo("ana.smith@example.com");
    }

    @Test
    void normalizesUnicodeSoVisuallyIdenticalAddressesMatch() {
        String composed = "josé@example.com";
        String decomposed = "josé@example.com";
        assertThat(EmailAddress.of(decomposed).normalized())
                .isEqualTo(EmailAddress.of(composed).normalized());
    }

    @Test
    void doesNotFoldDotsOrPlusTags() {
        assertThat(EmailAddress.of("a.b+tag@example.com").normalized()).isEqualTo("a.b+tag@example.com");
    }
}
