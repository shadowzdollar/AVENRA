package com.avenra.identity.domain;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.OptionalLong;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Time-based one-time passwords (RFC 6238 over RFC 4226), as used by authenticator apps (ADR-017):
 * HMAC-SHA1, 30-second steps, 6 digits. Verified against the RFC 6238 test vectors.
 */
public final class Totp {

    public static final int DIGITS = 6;
    public static final long STEP_SECONDS = 30;
    private static final int SECRET_BYTES = 20;
    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    private Totp() {}

    public static byte[] newSecret() {
        byte[] secret = new byte[SECRET_BYTES];
        RANDOM.nextBytes(secret);
        return secret;
    }

    public static long step(Instant time) {
        return Math.floorDiv(time.getEpochSecond(), STEP_SECONDS);
    }

    /** The code for one time step, zero-padded to {@value #DIGITS} digits. */
    public static String code(byte[] secret, long step) {
        return code(secret, step, DIGITS, "HmacSHA1");
    }

    static String code(byte[] secret, long step, int digits, String algorithm) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            mac.init(new SecretKeySpec(secret, algorithm));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            int modulus = (int) Math.pow(10, digits);
            return String.format("%0" + digits + "d", binary % modulus);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(algorithm + " is required by every Java runtime", exception);
        }
    }

    /**
     * Checks a code against the current step and one step either side (clock drift). Returns the
     * matching step, which the caller must store and reject next time (a code is single-use), or
     * empty if the code does not match or was already used.
     */
    public static OptionalLong verify(byte[] secret, String code, Instant now, long lastUsedStep) {
        if (code == null || !code.matches("\\d{" + DIGITS + "}")) {
            return OptionalLong.empty();
        }
        long current = step(now);
        for (long step = current - 1; step <= current + 1; step++) {
            if (step > lastUsedStep
                    && java.security.MessageDigest.isEqual(code(secret, step).getBytes(), code.getBytes())) {
                return OptionalLong.of(step);
            }
        }
        return OptionalLong.empty();
    }

    public static String base32(byte[] bytes) {
        var out = new StringBuilder();
        int buffer = 0;
        int bits = 0;
        for (byte b : bytes) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                out.append(BASE32.charAt((buffer >> (bits - 5)) & 0x1f));
                bits -= 5;
            }
        }
        if (bits > 0) {
            out.append(BASE32.charAt((buffer << (5 - bits)) & 0x1f));
        }
        return out.toString();
    }

    /** The {@code otpauth://} URI that authenticator apps read from a QR code. */
    public static String uri(String issuer, String account, byte[] secret) {
        String label = encode(issuer) + ":" + encode(account);
        return "otpauth://totp/" + label + "?secret=" + base32(secret) + "&issuer=" + encode(issuer)
                + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + STEP_SECONDS;
    }

    private static String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
                .replace("+", "%20");
    }
}
