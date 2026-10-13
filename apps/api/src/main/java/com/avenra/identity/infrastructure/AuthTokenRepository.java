package com.avenra.identity.infrastructure;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Single-use, expiring tokens sent by email; stored as hashes. */
@Repository
public class AuthTokenRepository {

    public enum Purpose {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    private final JdbcClient jdbc;

    AuthTokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Stores a new token and invalidates earlier unused tokens of the same purpose. */
    public void issue(UUID userId, Purpose purpose, byte[] tokenHash, OffsetDateTime now, OffsetDateTime expiresAt) {
        jdbc.sql(
                        "update auth_tokens set used_at = :now where user_id = :user and purpose = :purpose and used_at is null")
                .param("user", userId)
                .param("purpose", purpose.name())
                .param("now", now)
                .update();
        jdbc.sql("""
                        insert into auth_tokens (id, user_id, purpose, token_hash, created_at, expires_at)
                        values (:id, :user, :purpose, :hash, :now, :expires)
                        """)
                .param("id", UUID.randomUUID())
                .param("user", userId)
                .param("purpose", purpose.name())
                .param("hash", tokenHash)
                .param("now", now)
                .param("expires", expiresAt)
                .update();
    }

    /**
     * Marks a valid token as used and returns its user. Atomic: of two concurrent uses only one
     * succeeds, so a token works exactly once.
     */
    public Optional<UUID> consume(Purpose purpose, byte[] tokenHash, OffsetDateTime now) {
        return jdbc.sql("""
                        update auth_tokens set used_at = :now
                        where token_hash = :hash and purpose = :purpose and used_at is null and expires_at > :now
                        returning user_id
                        """)
                .param("hash", tokenHash)
                .param("purpose", purpose.name())
                .param("now", now)
                .query(UUID.class)
                .optional();
    }
}
