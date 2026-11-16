package com.avenra.platform.crypto;

import com.avenra.platform.AvenraProperties;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.stream.Collectors;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Application-level encryption for particularly sensitive values (Guidelines §69), such as TOTP
 * secrets (ADR-017). AES-256-GCM with a random 96-bit nonce; the key id is stored with each
 * ciphertext so keys can be rotated: new data uses the active key, old data stays readable while
 * its key is configured.
 */
@Component
public class SecretBox {

    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Map<String, SecretKeySpec> keys;
    private final String activeKeyId;

    public SecretBox(AvenraProperties properties) {
        var crypto = properties.crypto();
        this.keys = crypto.keys().entrySet().stream()
                .collect(Collectors.toUnmodifiableMap(
                        Map.Entry::getKey, entry -> key(entry.getKey(), entry.getValue())));
        this.activeKeyId = crypto.activeKeyId();
        if (!keys.containsKey(activeKeyId)) {
            throw new IllegalStateException("avenra.crypto.active-key-id '" + activeKeyId + "' is not configured");
        }
    }

    /** An encrypted value and the id of the key that encrypted it. */
    public record Sealed(String keyId, byte[] ciphertext) {}

    public Sealed seal(byte[] plaintext, String associatedData) {
        byte[] nonce = new byte[NONCE_BYTES];
        RANDOM.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, keys.get(activeKeyId), new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(associatedData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] encrypted = cipher.doFinal(plaintext);
            return new Sealed(
                    activeKeyId,
                    ByteBuffer.allocate(nonce.length + encrypted.length)
                            .put(nonce)
                            .put(encrypted)
                            .array());
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Encryption failed", exception);
        }
    }

    /**
     * Decrypts a value. The associated data must match what was used to seal it, which binds the
     * ciphertext to its owner (for example a user id), so ciphertexts cannot be swapped between rows.
     */
    public byte[] open(Sealed sealed, String associatedData) {
        SecretKeySpec key = keys.get(sealed.keyId());
        if (key == null) {
            throw new IllegalStateException("Encryption key '" + sealed.keyId() + "' is not configured");
        }
        ByteBuffer buffer = ByteBuffer.wrap(sealed.ciphertext());
        byte[] nonce = new byte[NONCE_BYTES];
        buffer.get(nonce);
        byte[] encrypted = new byte[buffer.remaining()];
        buffer.get(encrypted);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(associatedData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return cipher.doFinal(encrypted);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Decryption failed (wrong key, tampered data or wrong owner)", exception);
        }
    }

    private static SecretKeySpec key(String id, String base64) {
        byte[] bytes = Base64.getDecoder().decode(base64);
        if (bytes.length != 32) {
            throw new IllegalStateException(
                    "Encryption key '" + id + "' must be 32 bytes (base64), was " + bytes.length);
        }
        return new SecretKeySpec(bytes, "AES");
    }
}
