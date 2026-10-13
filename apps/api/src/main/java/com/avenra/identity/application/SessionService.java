package com.avenra.identity.application;

import com.avenra.audit.AuditLog;
import com.avenra.identity.infrastructure.SessionRepository;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.security.CurrentUser;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;

/**
 * Server-side sessions (ADR-013): opaque 256-bit tokens in a cookie, stored as hashes, with idle
 * and absolute expiry, revocable at any time.
 */
@Service
@EnableConfigurationProperties(IdentityProperties.class)
public class SessionService {

    /** Activity is recorded at most this often, to avoid a database write on every request. */
    private static final Duration TOUCH_INTERVAL = Duration.ofMinutes(1);

    private static final int MAX_USER_AGENT = 300;

    private final SessionRepository sessions;
    private final TenantTransactions transactions;
    private final IdentityProperties properties;
    private final AuditLog audit;
    private final Clock clock;

    SessionService(
            SessionRepository sessions,
            TenantTransactions transactions,
            IdentityProperties properties,
            AuditLog audit,
            Clock clock) {
        this.sessions = sessions;
        this.transactions = transactions;
        this.properties = properties;
        this.audit = audit;
        this.clock = clock;
    }

    /** A newly created session and the token for its cookie (returned once, never stored). */
    public record NewSession(UUID id, String token, Duration maxAge) {}

    /** Creates a session; must run inside the caller's transaction. */
    public NewSession create(UUID userId, @Nullable String userAgent) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        String token = SecureTokens.generate();
        UUID id = UUID.randomUUID();
        sessions.insert(
                id,
                userId,
                SecureTokens.hash(token),
                now,
                now.plus(properties.sessionIdleTimeout()),
                now.plus(properties.sessionAbsoluteLifetime()),
                truncate(userAgent));
        return new NewSession(id, token, properties.sessionAbsoluteLifetime());
    }

    /** The user behind a session token, if the session is live; extends its idle timeout. */
    public Optional<CurrentUser> authenticate(String token) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return transactions.run(
                TenantScope.NONE,
                () -> sessions.findActive(SecureTokens.hash(token), now).map(session -> {
                    if (session.lastSeenAt().plus(TOUCH_INTERVAL).isBefore(now)) {
                        sessions.touch(session.id(), now, now.plus(properties.sessionIdleTimeout()));
                    }
                    return new CurrentUser(session.userId(), session.id());
                }));
    }

    public List<SessionRepository.SessionRecord> active(UUID userId) {
        return transactions.run(
                TenantScope.user(userId), () -> sessions.findActiveForUser(userId, OffsetDateTime.now(clock)));
    }

    /** The user revokes one of their own sessions; false if it is not theirs or already ended. */
    public boolean revokeOwn(UUID userId, UUID sessionId) {
        return transactions.run(TenantScope.user(userId), () -> {
            boolean revoked = revoke(userId, sessionId);
            if (revoked) {
                audit.record(AuditLog.Event.of("identity.session.revoked", null, userId)
                        .resource("session", sessionId));
            }
            return revoked;
        });
    }

    /** "Sign out everywhere else". */
    public void revokeOthers(UUID userId, UUID currentSession) {
        transactions.runWithoutResult(TenantScope.user(userId), () -> {
            int count = revokeAllExcept(userId, currentSession);
            audit.record(AuditLog.Event.of("identity.session.revoked_others", null, userId)
                    .detail("count", count));
        });
    }

    /** Revokes one session of the user; must run inside the caller's transaction. */
    public boolean revoke(UUID userId, UUID sessionId) {
        return sessions.revoke(userId, sessionId, OffsetDateTime.now(clock));
    }

    /** Revokes all the user's sessions except {@code keep}; must run inside the caller's transaction. */
    public int revokeAllExcept(UUID userId, @Nullable UUID keep) {
        return sessions.revokeAllExcept(userId, keep, OffsetDateTime.now(clock));
    }

    private static @Nullable String truncate(@Nullable String userAgent) {
        return userAgent == null || userAgent.length() <= MAX_USER_AGENT
                ? userAgent
                : userAgent.substring(0, MAX_USER_AGENT);
    }
}
