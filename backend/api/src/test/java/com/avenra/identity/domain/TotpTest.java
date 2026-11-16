package com.avenra.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class TotpTest {

    private static final byte[] RFC_SECRET = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);

    /** RFC 6238 Appendix B, SHA-1 column (8 digits). */
    @ParameterizedTest(name = "T={0}s -> {1}")
    @CsvSource({
        "59, 94287082",
        "1111111109, 07081804",
        "1111111111, 14050471",
        "1234567890, 89005924",
        "2000000000, 69279037",
        "20000000000, 65353130"
    })
    void matchesTheRfc6238TestVectors(long epochSeconds, String expected) {
        long step = Totp.step(Instant.ofEpochSecond(epochSeconds));
        assertThat(Totp.code(RFC_SECRET, step, 8, "HmacSHA1")).isEqualTo(expected);
    }

    @Test
    void acceptsTheCurrentAndAdjacentStepsOnly() {
        Instant now = Instant.ofEpochSecond(1_700_000_000L);
        long step = Totp.step(now);
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step), now, -1))
                .hasValue(step);
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step - 1), now, -1))
                .hasValue(step - 1);
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step + 1), now, -1))
                .hasValue(step + 1);
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step - 2), now, -1))
                .isEmpty();
    }

    @Test
    void aCodeCannotBeUsedTwice() {
        Instant now = Instant.ofEpochSecond(1_700_000_000L);
        long step = Totp.step(now);
        String code = Totp.code(RFC_SECRET, step);
        assertThat(Totp.verify(RFC_SECRET, code, now, step)).isEmpty();
    }

    @Test
    void rejectsMalformedCodes() {
        Instant now = Instant.now();
        assertThat(Totp.verify(RFC_SECRET, "12345", now, -1)).isEmpty();
        assertThat(Totp.verify(RFC_SECRET, "abcdef", now, -1)).isEmpty();
        assertThat(Totp.verify(RFC_SECRET, null, now, -1)).isEmpty();
    }

    @Test
    void encodesBase32AsInRfc4648() {
        assertThat(Totp.base32("foobar".getBytes(StandardCharsets.US_ASCII))).isEqualTo("MZXW6YTBOI");
    }

    @Test
    void buildsAnOtpauthUri() {
        assertThat(Totp.uri("Avenra", "ana@example.com", "foobar".getBytes(StandardCharsets.US_ASCII)))
                .isEqualTo("otpauth://totp/Avenra:ana%40example.com?secret=MZXW6YTBOI&issuer=Avenra"
                        + "&algorithm=SHA1&digits=6&period=30");
    }
}
