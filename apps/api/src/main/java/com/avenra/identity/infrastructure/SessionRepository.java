package com.avenra.identity.infrastructure;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Server-side sessions (ADR-013). Only token hashes are stored. */
@Repository
public class SessionRepository {

    public record SessionRecord(
            UUID id,
            UUID userId,
            OffsetDateTime createdAt,
            OffsetDateTime lastSeenAt,
            OffsetDateTime idleExpiresAt,
            OffsetDateTime absoluteExpiresAt,
            @Nullable String userAgent) {}

    private static final String COLUMNS =
            "id, user_id, created_at, last_seen_at, idle_expires_at, absolute_expires_at, user_agent";

    private final JdbcClient jdbc;

    SessionRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(
            UUID id,
            UUID userId,
            byte[] tokenHash,
            OffsetDateTime now,
            OffsetDateTime idleExpiresAt,
            OffsetDateTime absoluteExpiresAt,
            @Nullable String userAgent) {
        jdbc.sql("""
                        insert into sessions (id, user_id, token_hash, created_at, last_seen_at, idle_expires_at,
                                              absolute_expires_at, user_agent)
                        values (:id, :user, :hash, :now, :now, :idle, :absolute, :agent)
                        """)
                .param("id", id)
                .param("user", userId)
                .param("hash", tokenHash)
                .param("now", now)
                .param("idle", idleExpiresAt)
                .param("absolute", absoluteExpiresAt)
                .param("agent", userAgent)
                .update();
    }

    /** The live session for a token hash: not revoked, not idle-expired, not past its absolute end. */
    public Optional<SessionRecord> findActive(byte[] tokenHash, OffsetDateTime now) {
        return jdbc.sql("select " + COLUMNS + """
                         from sessions
                        where token_hash = :hash and revoked_at is null
                          and idle_expires_at > :now and absolute_expires_at > :now
                        """)
                .param("hash", tokenHash)
                .param("now", now)
                .query(SessionRecord.class)
                .optional();
    }

    /** Extends the idle timeout, never past the absolute lifetime. */
    public void touch(UUID id, OffsetDateTime now, OffsetDateTime idleExpiresAt) {
        jdbc.sql("""
                        update sessions set last_seen_at = :now,
                               idle_expires_at = least(:idle, absolute_expires_at)
                        where id = :id and revoked_at is null
                        """)
                .param("id", id)
                .param("now", now)
                .param("idle", idleExpiresAt)
                .update();
    }

    public List<SessionRecord> findActiveForUser(UUID userId, OffsetDateTime now) {
        return jdbc.sql("select " + COLUMNS + """
                         from sessions
                        where user_id = :user and revoked_at is null
                          and idle_expires_at > :now and absolute_expires_at > :now
                        order by last_seen_at desc
                        """)
                .param("user", userId)
                .param("now", now)
                .query(SessionRecord.class)
                .list();
    }

    /** Revokes one of the user's sessions; returns whether one was revoked. */
    public boolean revoke(UUID userId, UUID sessionId, OffsetDateTime now) {
        return jdbc.sql(
                                "update sessions set revoked_at = :now where id = :id and user_id = :user and revoked_at is null")
                        .param("id", sessionId)
                        .param("user", userId)
                        .param("now", now)
                        .update()
                > 0;
    }

    /** Revokes every session of the user except {@code keep} (which may be null to revoke all). */
    public int revokeAllExcept(UUID userId, @Nullable UUID keep, OffsetDateTime now) {
        return jdbc.sql("""
                        update sessions set revoked_at = :now
                        where user_id = :user and revoked_at is null and (cast(:keep as uuid) is null or id <> :keep)
                        """)
                .param("user", userId)
                .param("keep", keep)
                .param("now", now)
                .update();
    }
}
