package com.avenra.identity.infrastructure;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final String COLUMNS = "id, email, email_normalized, display_name, password_hash,"
            + " email_verified_at, totp_secret_ciphertext, totp_key_id, totp_enabled_at, totp_last_used_step";

    private final JdbcClient jdbc;

    UserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(
            UUID id,
            String email,
            String emailNormalized,
            String displayName,
            String passwordHash,
            OffsetDateTime now) {
        jdbc.sql("""
                        insert into users (id, email, email_normalized, display_name, password_hash, created_at, updated_at)
                        values (:id, :email, :normalized, :name, :hash, :now, :now)
                        """)
                .param("id", id)
                .param("email", email)
                .param("normalized", emailNormalized)
                .param("name", displayName)
                .param("hash", passwordHash)
                .param("now", now)
                .update();
    }

    public Optional<UserRecord> findById(UUID id) {
        return jdbc.sql("select " + COLUMNS + " from users where id = :id")
                .param("id", id)
                .query(UserRepository::map)
                .optional();
    }

    /** Locks the row for the rest of the transaction, so concurrent changes serialize. */
    public Optional<UserRecord> findByIdForUpdate(UUID id) {
        return jdbc.sql("select " + COLUMNS + " from users where id = :id for update")
                .param("id", id)
                .query(UserRepository::map)
                .optional();
    }

    public Optional<UserRecord> findByEmail(String emailNormalized) {
        return jdbc.sql("select " + COLUMNS + " from users where email_normalized = :email")
                .param("email", emailNormalized)
                .query(UserRepository::map)
                .optional();
    }

    public List<UserRecord> findAll(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("select " + COLUMNS + " from users where id in (:ids)")
                .param("ids", ids)
                .query(UserRepository::map)
                .list();
    }

    public void markEmailVerified(UUID id, OffsetDateTime now) {
        jdbc.sql(
                        "update users set email_verified_at = coalesce(email_verified_at, :now), updated_at = :now where id = :id")
                .param("id", id)
                .param("now", now)
                .update();
    }

    public void updatePasswordHash(UUID id, String hash, OffsetDateTime now) {
        jdbc.sql("update users set password_hash = :hash, updated_at = :now where id = :id")
                .param("id", id)
                .param("hash", hash)
                .param("now", now)
                .update();
    }

    /** Stores a pending TOTP secret; MFA stays off until {@link #enableTotp}. */
    public void storePendingTotp(UUID id, byte[] ciphertext, String keyId, OffsetDateTime now) {
        jdbc.sql("""
                        update users set totp_secret_ciphertext = :secret, totp_key_id = :key, totp_enabled_at = null,
                                         totp_last_used_step = null, updated_at = :now
                        where id = :id
                        """)
                .param("id", id)
                .param("secret", ciphertext)
                .param("key", keyId)
                .param("now", now)
                .update();
    }

    public void enableTotp(UUID id, long usedStep, OffsetDateTime now) {
        jdbc.sql(
                        "update users set totp_enabled_at = :now, totp_last_used_step = :step, updated_at = :now where id = :id")
                .param("id", id)
                .param("step", usedStep)
                .param("now", now)
                .update();
    }

    public void recordTotpStep(UUID id, long usedStep) {
        jdbc.sql("update users set totp_last_used_step = :step where id = :id")
                .param("id", id)
                .param("step", usedStep)
                .update();
    }

    public void disableTotp(UUID id, OffsetDateTime now) {
        jdbc.sql("""
                        update users set totp_secret_ciphertext = null, totp_key_id = null, totp_enabled_at = null,
                                         totp_last_used_step = null, updated_at = :now
                        where id = :id
                        """).param("id", id).param("now", now).update();
    }

    private static UserRecord map(ResultSet rs, int row) throws SQLException {
        long step = rs.getLong("totp_last_used_step");
        @Nullable Long lastStep = rs.wasNull() ? null : step;
        return new UserRecord(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("email_normalized"),
                rs.getString("display_name"),
                rs.getString("password_hash"),
                rs.getObject("email_verified_at", OffsetDateTime.class),
                rs.getBytes("totp_secret_ciphertext"),
                rs.getString("totp_key_id"),
                rs.getObject("totp_enabled_at", OffsetDateTime.class),
                lastStep);
    }
}
