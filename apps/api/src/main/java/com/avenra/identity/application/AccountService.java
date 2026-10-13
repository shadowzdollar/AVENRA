package com.avenra.identity.application;

import com.avenra.audit.AuditLog;
import com.avenra.identity.domain.EmailAddress;
import com.avenra.identity.infrastructure.AuthTokenRepository;
import com.avenra.identity.infrastructure.AuthTokenRepository.Purpose;
import com.avenra.identity.infrastructure.UserRepository;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.email.OutgoingEmail;
import com.avenra.platform.ratelimit.RateLimiter;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Account lifecycle: sign-up, email verification, password reset and change (Guidelines §35).
 * Responses never reveal whether an email address has an account; differences are confined to the
 * email that is (or is not) sent to the address itself.
 */
@Service
public class AccountService {

    private final UserRepository users;
    private final AuthTokenRepository tokens;
    private final SessionService sessions;
    private final Passwords passwords;
    private final IdentityEmails emails;
    private final OutgoingEmail outgoing;
    private final AuditLog audit;
    private final RateLimiter limiter;
    private final TenantTransactions transactions;
    private final IdentityProperties properties;
    private final Clock clock;

    AccountService(
            UserRepository users,
            AuthTokenRepository tokens,
            SessionService sessions,
            Passwords passwords,
            IdentityEmails emails,
            OutgoingEmail outgoing,
            AuditLog audit,
            RateLimiter limiter,
            TenantTransactions transactions,
            IdentityProperties properties,
            Clock clock) {
        this.users = users;
        this.tokens = tokens;
        this.sessions = sessions;
        this.passwords = passwords;
        this.emails = emails;
        this.outgoing = outgoing;
        this.audit = audit;
        this.limiter = limiter;
        this.transactions = transactions;
        this.properties = properties;
        this.clock = clock;
    }

    public void signUp(String rawEmail, String password, String displayName) {
        EmailAddress email = EmailAddress.of(rawEmail);
        passwords.requireAcceptable("password", password, email);
        limiter.consume("email-send", accountSubject(email));
        String name = displayName.strip();
        if (name.isEmpty()) {
            throw ApiException.invalid("displayName", "must not be blank");
        }
        String hash = passwords.hash(password);
        transactions.runWithoutResult(TenantScope.NONE, () -> {
            var existing = users.findByEmail(email.normalized());
            if (existing.isPresent()) {
                var user = existing.get();
                if (user.emailVerified()) {
                    outgoing.sendAfterCommit(emails.alreadyRegistered(user.email(), user.displayName()));
                } else {
                    sendVerification(user.id(), user.email(), user.displayName());
                }
                audit.record(AuditLog.Event.of("identity.sign_up.existing_email", null, user.id()));
                return;
            }
            UUID id = UUID.randomUUID();
            users.insert(id, email.display(), email.normalized(), name, hash, OffsetDateTime.now(clock));
            sendVerification(id, email.display(), name);
            audit.record(AuditLog.Event.of("identity.sign_up", null, id));
        });
    }

    public void resendVerification(String rawEmail) {
        EmailAddress email = EmailAddress.of(rawEmail);
        limiter.consume("email-send", accountSubject(email));
        transactions.runWithoutResult(
                TenantScope.NONE,
                () -> users.findByEmail(email.normalized())
                        .filter(user -> !user.emailVerified())
                        .ifPresent(user -> sendVerification(user.id(), user.email(), user.displayName())));
    }

    public void verifyEmail(String token) {
        transactions.runWithoutResult(TenantScope.NONE, () -> {
            UUID userId = tokens.consume(Purpose.EMAIL_VERIFICATION, SecureTokens.hash(token), now())
                    .orElseThrow(AccountService::invalidToken);
            users.markEmailVerified(userId, now());
            audit.record(AuditLog.Event.of("identity.email_verified", null, userId));
        });
    }

    public void requestPasswordReset(String rawEmail) {
        EmailAddress email = EmailAddress.of(rawEmail);
        limiter.consume("email-send", accountSubject(email));
        transactions.runWithoutResult(
                TenantScope.NONE,
                () -> users.findByEmail(email.normalized())
                        .filter(user -> user.emailVerified())
                        .ifPresent(user -> {
                            String token = SecureTokens.generate();
                            tokens.issue(
                                    user.id(),
                                    Purpose.PASSWORD_RESET,
                                    SecureTokens.hash(token),
                                    now(),
                                    now().plus(properties.passwordResetValidity()));
                            outgoing.sendAfterCommit(emails.passwordReset(
                                    user.email(), user.displayName(), token, properties.passwordResetValidity()));
                            audit.record(AuditLog.Event.of("identity.password_reset.requested", null, user.id()));
                        }));
    }

    public void confirmPasswordReset(String token, String newPassword) {
        transactions.runWithoutResult(TenantScope.NONE, () -> {
            UUID userId = tokens.consume(Purpose.PASSWORD_RESET, SecureTokens.hash(token), now())
                    .orElseThrow(AccountService::invalidToken);
            var user = users.findByIdForUpdate(userId).orElseThrow(AccountService::invalidToken);
            passwords.requireAcceptable("newPassword", newPassword, EmailAddress.of(user.email()));
            users.updatePasswordHash(userId, passwords.hash(newPassword), now());
            sessions.revokeAllExcept(userId, null);
            outgoing.sendAfterCommit(emails.passwordChanged(user.email(), user.displayName()));
            audit.record(AuditLog.Event.of("identity.password_reset.completed", null, userId));
        });
    }

    /** Changes the password and signs out every other session of the user. */
    public void changePassword(UUID userId, UUID currentSession, String currentPassword, String newPassword) {
        limiter.consume("sign-in-account", "user:" + userId);
        transactions.runWithoutResult(TenantScope.user(userId), () -> {
            var user = users.findByIdForUpdate(userId).orElseThrow(ApiException::notFound);
            if (!passwords.matches(currentPassword, user.passwordHash())) {
                throw ApiException.invalid("currentPassword", "is not correct");
            }
            passwords.requireAcceptable("newPassword", newPassword, EmailAddress.of(user.email()));
            users.updatePasswordHash(userId, passwords.hash(newPassword), now());
            sessions.revokeAllExcept(userId, currentSession);
            outgoing.sendAfterCommit(emails.passwordChanged(user.email(), user.displayName()));
            audit.record(AuditLog.Event.of("identity.password.changed", null, userId));
        });
    }

    private void sendVerification(UUID userId, String email, String name) {
        String token = SecureTokens.generate();
        tokens.issue(
                userId,
                Purpose.EMAIL_VERIFICATION,
                SecureTokens.hash(token),
                now(),
                now().plus(properties.emailVerificationValidity()));
        outgoing.sendAfterCommit(emails.verification(email, name, token, properties.emailVerificationValidity()));
    }

    /** Rate-limit subject for an email address, hashed so addresses never appear in Redis. */
    static String accountSubject(EmailAddress email) {
        return "account:" + HexFormat.of().formatHex(SecureTokens.hash(email.normalized()));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(clock);
    }

    private static ApiException invalidToken() {
        return new ApiException(
                "INVALID_TOKEN", HttpStatus.BAD_REQUEST, "This link is invalid or has expired. Request a new one.");
    }
}
