package com.avenra.platform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Turns a valid session cookie into an authenticated security context. An invalid or missing
 * session leaves the request anonymous; protected endpoints then answer {@code 401}.
 */
class SessionAuthenticationFilter extends OncePerRequestFilter {

    static final String MDC_USER = "userId";

    private final RequestAuthenticator authenticator;

    SessionAuthenticationFilter(RequestAuthenticator authenticator) {
        this.authenticator = authenticator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var user = authenticator.authenticate(request);
        try {
            user.ifPresent(current -> {
                var context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                        current, null, List.of(new SimpleGrantedAuthority("USER"))));
                SecurityContextHolder.setContext(context);
                MDC.put(MDC_USER, current.userId().toString());
            });
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
            MDC.remove(MDC_USER);
        }
    }
}
