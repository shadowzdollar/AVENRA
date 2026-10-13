package com.avenra.platform.idempotency;

import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Idempotency keys for operations marked {@code key-required} (Guidelines §30). The first request
 * with a key runs and its result is stored in the same transaction; repeats return the stored
 * result without running again. Reusing a key for a different request is rejected.
 */
@Component
public class Idempotency {

    private final JdbcClient jdbc;
    private final JsonMapper json;
    private final Clock clock;

    Idempotency(JdbcClient jdbc, JsonMapper json, Clock clock) {
        this.jdbc = jdbc;
        this.json = json;
        this.clock = clock;
    }

    /**
     * Runs {@code work} once per (user, operation, key). Must be called inside the caller's
     * transaction with {@code app.user_id} set, so the stored result commits with the work.
     *
     * @param requestFingerprint a canonical description of the request body
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public <T> T once(
            UUID userId, String operation, String key, String requestFingerprint, Class<T> type, Supplier<T> work) {
        byte[] requestHash = SecureTokens.hash(requestFingerprint);
        var previous = jdbc.sql("""
                        select request_hash, response_body::text from idempotency_records
                        where user_id = :user and operation = :operation and idempotency_key = :key
                        """)
                .param("user", userId)
                .param("operation", operation)
                .param("key", key)
                .query((rs, row) -> new Stored(rs.getBytes(1), rs.getString(2)))
                .optional();
        if (previous.isPresent()) {
            if (!Arrays.equals(previous.get().requestHash(), requestHash)) {
                throw ApiException.conflict(
                        "IDEMPOTENCY_KEY_REUSED", "This Idempotency-Key was already used for a different request.");
            }
            return json.readValue(previous.get().body(), type);
        }
        T result = work.get();
        try {
            jdbc.sql("""
                            insert into idempotency_records (user_id, idempotency_key, operation, request_hash,
                                                             response_status, response_body, created_at)
                            values (:user, :key, :operation, :hash, 200, cast(:body as jsonb), :now)
                            """)
                    .param("user", userId)
                    .param("key", key)
                    .param("operation", operation)
                    .param("hash", requestHash)
                    .param("body", json.writeValueAsString(result))
                    .param("now", OffsetDateTime.now(clock))
                    .update();
        } catch (DuplicateKeyException concurrent) {
            // A concurrent request with the same key won; this transaction rolls back.
            throw ApiException.conflict(
                    "IDEMPOTENCY_KEY_IN_USE", "A request with this Idempotency-Key is already being processed.");
        }
        return result;
    }

    private record Stored(byte[] requestHash, String body) {}
}
