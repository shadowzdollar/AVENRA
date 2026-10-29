package com.avenra.billing.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

/** Keeps the raw body of provider events, whose signature covers the exact bytes (ADR-037). */
@Component
class RawBodyFilter extends OncePerRequestFilter {

    /** Provider events are small; the platform's body limit applies first anyway. */
    private static final int LIMIT = 64 * 1024;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !(request.getMethod().equals("POST")
                && request.getRequestURI().startsWith("/api/v1/billing/providers/")
                && request.getRequestURI().endsWith("/events"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        chain.doFilter(new ContentCachingRequestWrapper(request, LIMIT), response);
    }
}
