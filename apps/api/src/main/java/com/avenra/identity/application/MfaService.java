package com.avenra.identity.application;

import com.avenra.audit.AuditLog;
import com.avenra.identity.domain.RecoveryCodes;
import com.avenra.identity.domain.Totp;
import com.avenra.identity.infrastructure.MfaRepository;
import com.avenra.identity.infrastructure.UserRecord;
import com.avenra.identity.infrastructure.UserRepository;
import com.avenra.platform.crypto.SecretBox;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Optional TOTP multi-factor authentication (ADR-017). The secret is encrypted with {@link
 * SecretBox}, bound to the user id; codes are single-use; recovery codes are stored hashed.
 */
@Service
public class MfaService {

    private final UserRepository users;
    private final MfaRepository mfa;
    private final SecretBox secrets;
    private final AuditLog audit;
    private final TenantTransactions transactions;
    private final IdentityProperties properties;
    private final Clock clock;

    MfaService(
            UserRepository users,
            MfaRepository mfa,
            SecretBox secrets,
            AuditLog audit,
            TenantTransactions transactions,
            IdentityProperties properties,
            Clock clock) {
        this.users = users;
        this.mfa = mfa;
        this.secrets = secrets;
        this.audit = audit;
        this.transactions = transactions;
        this.properties = properties;
        this.clock = clock;
    }

    public boolean isEnabled(UUID userId) {
        return transactions.run(
                TenantScope.user(userId),
                () -> users.findById(userId).map(UserRecord::mfaEnabled).orElse(false));
    }

    /** The secret to show the user; MFA is not active until {@link #activate} succeeds. */
    public record Enrollment(String secret, String otpauthUri) {}

    public Enrollment startEnrollment(UUID userId) {
        return transactions.run(TenantScope.user(userId), () -> {
            UserRecord user = users.findByIdForUpdate(userId).orElseThrow(ApiException::notFound);
            if (user.mfaEnabled()) {
                throw ApiException.conflict("MFA_ALREADY_ENABLED", "Authenticator-app MFA is already on.");
            }
            byte[] secret = Totp.newSecret();
            var sealed = secrets.seal(secret, binding(userId));
            users.storePendingTotp(userId, sealed.ciphertext(), sealed.keyId(), now());
            return new Enrollment(Totp.base32(secret), Totp.uri(properties.totpIssuer(), user.email(), secret));
        });
    }

    /** Turns MFA on after a correct code; returns recovery codes, shown once. */
    public List<String> activate(UUID userId, String code) {
        return transactions.run(TenantScope.user(userId), () -> {
            UserRecord user = users.findByIdForUpdate(userId).orElseThrow(ApiException::notFound);
            if (user.mfaEnabled()) {
                throw ApiException.conflict("MFA_ALREADY_ENABLED", "Authenticator-app MFA is already on.");
            }
            if (user.totpSecretCiphertext() == null || user.totpKeyId() == null) {
                throw ApiException.conflict("MFA_NOT_STARTED", "Start setting up the authenticator app first.");
            }
            long step = Totp.verify(secret(user), code, clock.instant(), -1).orElseThrow(MfaService::invalidCode);
            users.enableTotp(userId, step, now());
            List<String> codes = RecoveryCodes.generate();
            mfa.replaceRecoveryCodes(
                    userId, codes.stream().map(MfaService::hashRecoveryCode).toList(), now());
            audit.record(AuditLog.Event.of("identity.mfa.enabled", null, userId));
            return codes;
        });
    }

    public void disable(UUID userId, String code) {
        transactions.runWithoutResult(TenantScope.user(userId), () -> {
            UserRecord user = users.findByIdForUpdate(userId).orElseThrow(ApiException::notFound);
            if (!user.mfaEnabled()) {
                return;
            }
            if (!checkSecondFactor(user, code)) {
                throw invalidCode();
            }
            users.disableTotp(userId, now());
            mfa.deleteRecoveryCodes(userId);
            audit.record(AuditLog.Event.of("identity.mfa.disabled", null, userId));
        });
    }

    /**
     * Verifies an authenticator or recovery code inside the caller's transaction, consuming it so it
     * cannot be replayed. The user row must already be locked by the caller.
     */
    boolean checkSecondFactor(UserRecord user, String code) {
        if (RecoveryCodes.looksLikeRecoveryCode(code)) {
            boolean used = mfa.consumeRecoveryCode(user.id(), hashRecoveryCode(code), now());
            if (used) {
                audit.record(AuditLog.Event.of("identity.mfa.recovery_code_used", null, user.id()));
            }
            return used;
        }
        long lastStep = user.totpLastUsedStep() == null ? -1 : user.totpLastUsedStep();
        var step = Totp.verify(secret(user), code, clock.instant(), lastStep);
        step.ifPresent(used -> users.recordTotpStep(user.id(), used));
        return step.isPresent();
    }

    private byte[] secret(UserRecord user) {
        return secrets.open(new SecretBox.Sealed(user.totpKeyId(), user.totpSecretCiphertext()), binding(user.id()));
    }

    /** Binds a ciphertext to its owner, so secrets cannot be moved between accounts. */
    private static String binding(UUID userId) {
        return "totp:" + userId;
    }

    private static byte[] hashRecoveryCode(String code) {
        return SecureTokens.hash(RecoveryCodes.normalize(code));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(clock);
    }

    static ApiException invalidCode() {
        return new ApiException("INVALID_MFA_CODE", HttpStatus.UNAUTHORIZED, "The code is not valid. Try again.");
    }
}
