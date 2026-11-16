package com.avenra.platform.crypto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Random bearer tokens (session cookies, email links, invitation links). Only the SHA-256 hash of a
 * token is ever stored (ADR-013): a leaked database does not yield usable tokens. Tokens carry 256
 * bits of entropy, so an unsalted fast hash is sufficient.
 */
public final class SecureTokens {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private SecureTokens() {}

    /** A new 256-bit token, URL-safe. */
    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return ENCODER.encodeToString(bytes);
    }

    public static byte[] hash(String token) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by every Java runtime", exception);
        }
    }

    /** Constant-time comparison, so comparisons do not leak timing information. */
    public static boolean equal(byte[] a, byte[] b) {
        return MessageDigest.isEqual(a, b);
    }
}
