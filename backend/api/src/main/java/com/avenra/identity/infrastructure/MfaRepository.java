package com.avenra.identity.infrastructure;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** MFA sign-in challenges and recovery codes (ADR-017). */
@Repository
public class MfaRepository {

    /** Wrong codes allowed per challenge before it is closed. */
    public static final int MAX_CHALLENGE_FAILURES = 5;

    public record Challenge(UUID id, UUID userId, @Nullable String userAgent) {}

    private final JdbcClient jdbc;

    MfaRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void createChallenge(
            UUID id, UUID userId, OffsetDateTime now, OffsetDateTime expiresAt, @Nullable String userAgent) {
        jdbc.sql("""
                        insert into mfa_challenges (id, user_id, created_at, expires_at, user_agent)
                        values (:id, :user, :now, :expires, :agent)
                        """)
                .param("id", id)
                .param("user", userId)
                .param("now", now)
                .param("expires", expiresAt)
                .param("agent", userAgent)
                .update();
    }

    /** An open challenge, locked for this transaction. */
    public Optional<Challenge> findOpenForUpdate(UUID id, OffsetDateTime now) {
        return jdbc.sql("""
                        select id, user_id, user_agent from mfa_challenges
                        where id = :id and completed_at is null and expires_at > :now and failed_attempts < :max
                        for update
                        """)
                .param("id", id)
                .param("now", now)
                .param("max", MAX_CHALLENGE_FAILURES)
                .query(Challenge.class)
                .optional();
    }

    public void complete(UUID id, OffsetDateTime now) {
        jdbc.sql("update mfa_challenges set completed_at = :now where id = :id")
                .param("id", id)
                .param("now", now)
                .update();
    }

    public void recordFailure(UUID id) {
        jdbc.sql("update mfa_challenges set failed_attempts = failed_attempts + 1 where id = :id")
                .param("id", id)
                .update();
    }

    public void replaceRecoveryCodes(UUID userId, Collection<byte[]> codeHashes, OffsetDateTime now) {
        jdbc.sql("delete from recovery_codes where user_id = :user")
                .param("user", userId)
                .update();
        for (byte[] hash : codeHashes) {
            jdbc.sql("insert into recovery_codes (id, user_id, code_hash, created_at) values (:id, :user, :hash, :now)")
                    .param("id", UUID.randomUUID())
                    .param("user", userId)
                    .param("hash", hash)
                    .param("now", now)
                    .update();
        }
    }

    /** Uses a recovery code once; returns whether it was valid and unused. */
    public boolean consumeRecoveryCode(UUID userId, byte[] codeHash, OffsetDateTime now) {
        return jdbc.sql("""
                                update recovery_codes set used_at = :now
                                where user_id = :user and code_hash = :hash and used_at is null
                                """)
                        .param("user", userId)
                        .param("hash", codeHash)
                        .param("now", now)
                        .update()
                > 0;
    }

    public void deleteRecoveryCodes(UUID userId) {
        jdbc.sql("delete from recovery_codes where user_id = :user")
                .param("user", userId)
                .update();
    }
}
