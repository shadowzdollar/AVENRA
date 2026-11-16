package com.avenra.integration.application;

import com.avenra.integration.infrastructure.IntegrationRepository.ConnectionRow;
import com.avenra.platform.crypto.SecretBox;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * Connection secrets (ADR-034, §55): sealed with the platform key, bound to the connection by the
 * associated data, never logged, and returned only when Avenra generated them.
 */
@Component
class Credentials {

    /** Storage keys as they are sealed. */
    record StorageKeys(String accessKey, String secretKey) {}

    /**
     * @param shownOnce the secret to show the person once, or {@code null} when they supplied it
     */
    record Created(
            SecretBox.Sealed sealed, String hint, @Nullable String shownOnce) {}

    private static final SecureRandom RANDOM = new SecureRandom();

    private final SecretBox box;
    private final JsonMapper json;

    Credentials(SecretBox box, JsonMapper json) {
        this.box = box;
        this.json = json;
    }

    Created newSigningSecret(UUID connectionId) {
        byte[] random = new byte[32];
        RANDOM.nextBytes(random);
        String secret = "whsec_" + HexFormat.of().formatHex(random);
        return new Created(box.seal(secret.getBytes(StandardCharsets.UTF_8), context(connectionId)), "whsec_…", secret);
    }

    Created storageKeys(UUID connectionId, String accessKey, String secretKey) {
        byte[] plain = json.writeValueAsBytes(new StorageKeys(accessKey, secretKey));
        String hint = "…" + accessKey.substring(Math.max(0, accessKey.length() - 4));
        return new Created(box.seal(plain, context(connectionId)), hint, null);
    }

    String signingSecret(ConnectionRow row) {
        return new String(open(row), StandardCharsets.UTF_8);
    }

    StorageKeys storageKeys(ConnectionRow row) {
        return json.readValue(open(row), StorageKeys.class);
    }

    private byte[] open(ConnectionRow row) {
        if (row.credentialKeyId() == null || row.credentialCiphertext() == null) {
            throw new IllegalStateException("the connection has no credentials");
        }
        return box.open(new SecretBox.Sealed(row.credentialKeyId(), row.credentialCiphertext()), context(row.id()));
    }

    private static String context(UUID connectionId) {
        return "integration-connection:" + connectionId;
    }
}
