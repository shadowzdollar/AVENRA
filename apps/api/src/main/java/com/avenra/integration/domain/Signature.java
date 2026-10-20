package com.avenra.integration.domain;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Webhook signatures (ADR-034, §66): {@code t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." +
 * body)>}. The timestamp lets receivers refuse replays.
 */
public final class Signature {

    private Signature() {}

    public static String header(String secret, long unixSeconds, String body) {
        return "t=" + unixSeconds + ",v1=" + hmac(secret, unixSeconds + "." + body);
    }

    static String hmac(String secret, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
