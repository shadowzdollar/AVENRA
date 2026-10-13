package com.avenra.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;

class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy(Set.of("correcthorsebatterystaple"));
    private final EmailAddress email = EmailAddress.of("Ana.Smith@Example.com");

    @Test
    void acceptsALongUnusualPassword() {
        assertThat(policy.problem("plum-orbit-violin-42", email)).isEmpty();
    }

    @Test
    void enforcesLengthInCharactersNotBytes() {
        assertThat(policy.problem("short-pass1", email)).hasValue("must be at least 12 characters");
        assertThat(policy.problem("é".repeat(12), email)).isEmpty();
        assertThat(policy.problem("x".repeat(129), email)).hasValue("must be at most 128 characters");
    }

    @Test
    void rejectsCommonPasswordsCaseInsensitively() {
        assertThat(policy.problem("CorrectHorseBatteryStaple", email)).isPresent();
    }

    @Test
    void rejectsTheEmailAddressOrItsLocalPart() {
        assertThat(policy.problem("ana.smith@example.com", email)).hasValue("must not be your email address");
        var longLocalPart = EmailAddress.of("VeryLongName12@example.com");
        assertThat(policy.problem("verylongname12", longLocalPart)).hasValue("must not be your email address");
    }

    @Test
    void imposesNoCompositionRules() {
        assertThat(policy.problem("all lower case words here", email)).isEmpty();
    }
}
