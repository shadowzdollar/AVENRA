package com.avenra.billing.application;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Provider event signatures: {@code t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">}
 * (ADR-037). Old timestamps are refused so a captured event cannot be replayed later.
 */
public final class WebhookSignature {

    public static final Duration TOLERANCE = Duration.ofMinutes(5);

    private WebhookSignature() {}

    public static String sign(String secret, long timestamp, byte[] body) {
        return "t=" + timestamp + ",v1=" + HexFormat.of().formatHex(mac(secret, timestamp, body));
    }

    public static boolean valid(String secret, String header, byte[] body, Instant now) {
        if (secret.isEmpty()) {
            return false;
        }
        Long timestamp = null;
        byte[] given = null;
        for (String part : header.split(",")) {
            String[] pair = part.strip().split("=", 2);
            if (pair.length != 2) {
                continue;
            }
            try {
                if (pair[0].equals("t")) {
                    timestamp = Long.parseLong(pair[1]);
                } else if (pair[0].equals("v1")) {
                    given = HexFormat.of().parseHex(pair[1]);
                }
            } catch (IllegalArgumentException malformed) {
                return false;
            }
        }
        if (timestamp == null || given == null) {
            return false;
        }
        Duration age = Duration.between(Instant.ofEpochSecond(timestamp), now).abs();
        return age.compareTo(TOLERANCE) <= 0 && MessageDigest.isEqual(given, mac(secret, timestamp, body));
    }

    private static byte[] mac(String secret, long timestamp, byte[] body) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
            return mac.doFinal(body);
        } catch (GeneralSecurityException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
