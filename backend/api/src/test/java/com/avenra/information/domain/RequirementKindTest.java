package com.avenra.information.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RequirementKindTest {

    @Test
    void valuesAreStoredInCanonicalForm() {
        assertThat(RequirementKind.TEXT.canonicalValue("  Acme Ltd ")).contains("Acme Ltd");
        assertThat(RequirementKind.NUMBER.canonicalValue("1250.500")).contains("1250.5");
        assertThat(RequirementKind.NUMBER.canonicalValue("100")).contains("100");
        assertThat(RequirementKind.NUMBER.canonicalValue("-0.0")).contains("0");
        assertThat(RequirementKind.DATE.canonicalValue("2026-02-01")).contains("2026-02-01");
        assertThat(RequirementKind.BOOLEAN.canonicalValue("TRUE")).contains("true");
    }

    @Test
    void invalidValuesAreRejected() {
        assertThat(RequirementKind.TEXT.canonicalValue("   ")).isEmpty();
        assertThat(RequirementKind.TEXT.canonicalValue("x".repeat(4001))).isEmpty();
        assertThat(RequirementKind.NUMBER.canonicalValue("1e9")).isEmpty();
        assertThat(RequirementKind.NUMBER.canonicalValue("1,000")).isEmpty();
        assertThat(RequirementKind.NUMBER.canonicalValue("NaN")).isEmpty();
        assertThat(RequirementKind.NUMBER.canonicalValue("1".repeat(41))).isEmpty();
        assertThat(RequirementKind.DATE.canonicalValue("2026-02-30")).isEmpty();
        assertThat(RequirementKind.DATE.canonicalValue("01/02/2026")).isEmpty();
        assertThat(RequirementKind.DATE.canonicalValue("9999-01-01")).isEmpty();
        assertThat(RequirementKind.BOOLEAN.canonicalValue("yes")).isEmpty();
        assertThat(RequirementKind.DOCUMENT.canonicalValue("anything")).isEmpty();
        assertThat(RequirementKind.TEXT.canonicalValue(null)).isEmpty();
    }
}
