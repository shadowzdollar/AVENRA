package com.avenra.identity.api;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.ResponseCookie;

/**
 * The session cookie (ADR-013): {@code __Host-} prefix (Secure, Path=/, no Domain, so it cannot be
 * set or read by other subdomains), HttpOnly so scripts cannot read it, SameSite=Lax.
 */
final class SessionCookies {

    static final String NAME = "__Host-avenra_session";

    private SessionCookies() {}

    static String issue(String token, Duration maxAge) {
        return ResponseCookie.from(NAME, token)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build()
                .toString();
    }

    static String clear() {
        return ResponseCookie.from(NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build()
                .toString();
    }

    static Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(cookie -> NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> !value.isBlank() && value.length() <= 100)
                .findFirst();
    }
}
