package com.avenra.identity.api;

import com.avenra.contract.v1.api.AuthenticationApi;
import com.avenra.contract.v1.model.ChangePasswordRequest;
import com.avenra.contract.v1.model.CurrentUser;
import com.avenra.contract.v1.model.EmailRequest;
import com.avenra.contract.v1.model.MfaSignInRequest;
import com.avenra.contract.v1.model.PasswordResetConfirmation;
import com.avenra.contract.v1.model.RecoveryCodes;
import com.avenra.contract.v1.model.SessionSummary;
import com.avenra.contract.v1.model.SignInRequest;
import com.avenra.contract.v1.model.SignInResult;
import com.avenra.contract.v1.model.SignUpRequest;
import com.avenra.contract.v1.model.TokenRequest;
import com.avenra.contract.v1.model.TotpCodeRequest;
import com.avenra.contract.v1.model.TotpEnrollment;
import com.avenra.identity.MembershipDirectory;
import com.avenra.identity.UserDirectory;
import com.avenra.identity.application.AccountService;
import com.avenra.identity.application.MfaService;
import com.avenra.identity.application.SessionService;
import com.avenra.identity.application.SignInService;
import com.avenra.platform.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's authentication operations (ADR-008, ADR-013). */
@RestController
class AuthenticationController implements AuthenticationApi {

    private final AccountService accounts;
    private final SignInService signIn;
    private final SessionService sessions;
    private final MfaService mfa;
    private final UserDirectory users;
    private final MembershipDirectory memberships;
    private final HttpServletRequest request;

    AuthenticationController(
            AccountService accounts,
            SignInService signIn,
            SessionService sessions,
            MfaService mfa,
            UserDirectory users,
            MembershipDirectory memberships,
            HttpServletRequest request) {
        this.accounts = accounts;
        this.signIn = signIn;
        this.sessions = sessions;
        this.mfa = mfa;
        this.users = users;
        this.memberships = memberships;
        this.request = request;
    }

    @Override
    public ResponseEntity<Void> getCsrfToken() {
        // Reading the token makes Spring Security write the XSRF-TOKEN cookie.
        if (request.getAttribute(CsrfToken.class.getName()) instanceof CsrfToken token) {
            token.getToken();
        }
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> signUp(SignUpRequest body) {
        accounts.signUp(body.getEmail(), body.getPassword(), body.getDisplayName());
        return ResponseEntity.accepted().build();
    }

    @Override
    public ResponseEntity<Void> verifyEmail(TokenRequest body) {
        accounts.verifyEmail(body.getToken());
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> resendVerificationEmail(EmailRequest body) {
        accounts.resendVerification(body.getEmail());
        return ResponseEntity.accepted().build();
    }

    @Override
    public ResponseEntity<SignInResult> signIn(SignInRequest body) {
        var result = signIn.signIn(body.getEmail(), body.getPassword(), request.getHeader(HttpHeaders.USER_AGENT));
        if (result.session() == null) {
            return ResponseEntity.ok(
                    new SignInResult(SignInResult.StatusEnum.MFA_REQUIRED).mfaChallengeId(result.mfaChallengeId()));
        }
        return signedIn(result.session());
    }

    @Override
    public ResponseEntity<SignInResult> completeMfaSignIn(MfaSignInRequest body) {
        return signedIn(signIn.completeMfa(body.getMfaChallengeId(), body.getCode()));
    }

    @Override
    public ResponseEntity<Void> signOut() {
        var user = com.avenra.platform.security.CurrentUser.require();
        signIn.signOut(user.userId(), user.sessionId());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, SessionCookies.clear())
                .build();
    }

    @Override
    public ResponseEntity<CurrentUser> getCurrentSession() {
        var current = com.avenra.platform.security.CurrentUser.require();
        var user = users.find(current.userId()).orElseThrow(ApiException::notFound);
        boolean mfaEnabled = mfa.isEnabled(current.userId());
        return ResponseEntity.ok(new CurrentUser(
                user.id(), user.email(), user.displayName(), mfaEnabled, memberships.membershipsOf(user.id())));
    }

    @Override
    public ResponseEntity<List<SessionSummary>> listSessions() {
        var current = com.avenra.platform.security.CurrentUser.require();
        return ResponseEntity.ok(sessions.active(current.userId()).stream()
                .map(session -> new SessionSummary(
                                session.id(),
                                session.id().equals(current.sessionId()),
                                session.createdAt().withOffsetSameInstant(ZoneOffset.UTC),
                                session.lastSeenAt().withOffsetSameInstant(ZoneOffset.UTC))
                        .userAgent(session.userAgent()))
                .toList());
    }

    @Override
    public ResponseEntity<Void> revokeSession(UUID sessionId) {
        var current = com.avenra.platform.security.CurrentUser.require();
        if (!sessions.revokeOwn(current.userId(), sessionId)) {
            throw ApiException.notFound();
        }
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> revokeOtherSessions() {
        var current = com.avenra.platform.security.CurrentUser.require();
        sessions.revokeOthers(current.userId(), current.sessionId());
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> changePassword(ChangePasswordRequest body) {
        var current = com.avenra.platform.security.CurrentUser.require();
        accounts.changePassword(
                current.userId(), current.sessionId(), body.getCurrentPassword(), body.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> requestPasswordReset(EmailRequest body) {
        accounts.requestPasswordReset(body.getEmail());
        return ResponseEntity.accepted().build();
    }

    @Override
    public ResponseEntity<Void> confirmPasswordReset(PasswordResetConfirmation body) {
        accounts.confirmPasswordReset(body.getToken(), body.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<TotpEnrollment> startTotpEnrollment() {
        var current = com.avenra.platform.security.CurrentUser.require();
        var enrollment = mfa.startEnrollment(current.userId());
        return ResponseEntity.ok(new TotpEnrollment(enrollment.secret(), enrollment.otpauthUri()));
    }

    @Override
    public ResponseEntity<RecoveryCodes> activateTotp(TotpCodeRequest body) {
        var current = com.avenra.platform.security.CurrentUser.require();
        return ResponseEntity.ok(new RecoveryCodes(mfa.activate(current.userId(), body.getCode())));
    }

    @Override
    public ResponseEntity<Void> disableTotp(TotpCodeRequest body) {
        var current = com.avenra.platform.security.CurrentUser.require();
        mfa.disable(current.userId(), body.getCode());
        return ResponseEntity.noContent().build();
    }

    private static ResponseEntity<SignInResult> signedIn(SessionService.NewSession session) {
        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.SET_COOKIE, SessionCookies.issue(session.token(), session.maxAge()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new SignInResult(SignInResult.StatusEnum.SIGNED_IN));
    }
}
