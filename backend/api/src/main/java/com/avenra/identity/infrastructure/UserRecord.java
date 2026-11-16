package com.avenra.identity.infrastructure;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** A row of {@code users}. */
public record UserRecord(
        UUID id,
        String email,
        String emailNormalized,
        String displayName,
        String passwordHash,
        @Nullable OffsetDateTime emailVerifiedAt,
        byte @Nullable [] totpSecretCiphertext,
        @Nullable String totpKeyId,
        @Nullable OffsetDateTime totpEnabledAt,
        @Nullable Long totpLastUsedStep) {

    public boolean emailVerified() {
        return emailVerifiedAt != null;
    }

    public boolean mfaEnabled() {
        return totpEnabledAt != null;
    }
}
