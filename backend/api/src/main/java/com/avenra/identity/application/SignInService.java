package com.avenra.identity.application;

import com.avenra.audit.AuditLog;
import com.avenra.identity.domain.EmailAddress;
import com.avenra.identity.infrastructure.MfaRepository;
import com.avenra.identity.infrastructure.UserRepository;
import com.avenra.platform.ratelimit.RateLimiter;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Signing in (Guidelines §35, ADR-013, ADR-017). Every failure answers {@code INVALID_CREDENTIALS}
 * after the same password-hashing effort, whether or not the account exists. Only a correct
 * password reveals that the email still needs verifying.
 */
@Service
public class SignInService {

    private final UserRepository users;
    private final MfaRepository mfa;
    private final MfaService mfaService;
    private final SessionService sessions;
    private final Passwords passwords;
    private final AuditLog audit;
    private final RateLimiter limiter;
    private final TenantTransactions transactions;
    private final IdentityProperties properties;
    private final Clock clock;

    SignInService(
            UserRepository users,
            MfaRepository mfa,
            MfaService mfaService,
            SessionService sessions,
            Passwords passwords,
            AuditLog audit,
            RateLimiter limiter,
            TenantTransactions transactions,
            IdentityProperties properties,
            Clock clock) {
        this.users = users;
        this.mfa = mfa;
        this.mfaService = mfaService;
        this.sessions = sessions;
        this.passwords = passwords;
        this.audit = audit;
        this.limiter = limiter;
        this.transactions = transactions;
        this.properties = properties;
        this.clock = clock;
    }

    /** Either a new session, or the id of the MFA challenge to complete. */
    public record Result(
            SessionService.@Nullable NewSession session,
            @Nullable UUID mfaChallengeId) {}

    public Result signIn(String rawEmail, String password, @Nullable String userAgent) {
        EmailAddress email = EmailAddress.of(rawEmail);
        limiter.consume("sign-in-account", AccountService.accountSubject(email));
        var user = transactions.run(TenantScope.NONE, () -> users.findByEmail(email.normalized()));
        if (user.isEmpty()) {
            passwords.burnTime(password);
            failed(null, "unknown_account");
        }
        var account = user.orElseThrow();
        if (!passwords.matches(password, account.passwordHash())) {
            failed(account.id(), "wrong_password");
        }
        if (!account.emailVerified()) {
            throw new ApiException(
                    "EMAIL_NOT_VERIFIED",
                    HttpStatus.FORBIDDEN,
                    "Confirm your email address first. We can send the confirmation email again.");
        }
        return transactions.run(TenantScope.user(account.id()), () -> {
            if (account.mfaEnabled()) {
                UUID challenge = UUID.randomUUID();
                mfa.createChallenge(
                        challenge, account.id(), now(), now().plus(properties.mfaChallengeValidity()), userAgent);
                audit.record(AuditLog.Event.of("identity.sign_in.mfa_required", null, account.id()));
                return new Result(null, challenge);
            }
            var session = sessions.create(account.id(), userAgent);
            audit.record(AuditLog.Event.of("identity.sign_in.succeeded", null, account.id())
                    .resource("session", session.id()));
            return new Result(session, null);
        });
    }

    public SessionService.NewSession completeMfa(UUID challengeId, String code) {
        limiter.consume("mfa", "challenge:" + challengeId);
        // A wrong code still commits its failure count and audit event; the rejection follows after.
        Optional<SessionService.NewSession> session = transactions.run(TenantScope.NONE, () -> {
            var challenge = mfa.findOpenForUpdate(challengeId, now()).orElseThrow(MfaService::invalidCode);
            var user = users.findByIdForUpdate(challenge.userId()).orElseThrow(MfaService::invalidCode);
            if (!mfaService.checkSecondFactor(user, code)) {
                mfa.recordFailure(challengeId);
                audit.record(AuditLog.Event.of("identity.sign_in.mfa_failed", null, user.id()));
                return Optional.empty();
            }
            mfa.complete(challengeId, now());
            var created = sessions.create(user.id(), challenge.userAgent());
            audit.record(AuditLog.Event.of("identity.sign_in.succeeded", null, user.id())
                    .resource("session", created.id())
                    .detail("mfa", true));
            return Optional.of(created);
        });
        return session.orElseThrow(MfaService::invalidCode);
    }

    public void signOut(UUID userId, UUID sessionId) {
        transactions.runWithoutResult(TenantScope.user(userId), () -> {
            sessions.revoke(userId, sessionId);
            audit.record(AuditLog.Event.of("identity.sign_out", null, userId).resource("session", sessionId));
        });
    }

    /** Records the failure in its own transaction, then rejects; the message is always the same. */
    private void failed(@Nullable UUID userId, String reason) {
        transactions.runWithoutResult(
                TenantScope.NONE,
                () -> audit.record(AuditLog.Event.of("identity.sign_in.failed", null, userId)
                        .detail("reason", reason)));
        throw new ApiException(
                "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, "The email address or password is not correct.");
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(clock);
    }
}
