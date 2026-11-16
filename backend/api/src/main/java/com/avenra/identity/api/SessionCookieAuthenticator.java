package com.avenra.identity.api;

import com.avenra.identity.application.SessionService;
import com.avenra.platform.security.CurrentUser;
import com.avenra.platform.security.RequestAuthenticator;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** Authenticates requests by their session cookie (ADR-013), for the platform's security filter. */
@Component
class SessionCookieAuthenticator implements RequestAuthenticator {

    private final SessionService sessions;

    SessionCookieAuthenticator(SessionService sessions) {
        this.sessions = sessions;
    }

    @Override
    public Optional<CurrentUser> authenticate(HttpServletRequest request) {
        return SessionCookies.read(request).flatMap(sessions::authenticate);
    }
}
