package com.avenra.platform.security;

import com.avenra.platform.AvenraProperties;
import com.avenra.platform.web.ErrorResponseWriter;
import com.avenra.platform.web.PlatformErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.HashSet;
import java.util.Set;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Second CSRF layer (ADR-013): a state-changing request that carries an {@code Origin} header must
 * come from Avenra's own public origin or an explicitly allowed origin. Requests without the header
 * (non-browser clients) rely on the CSRF token alone.
 */
class OriginCheckFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final Set<String> allowedOrigins;
    private final ErrorResponseWriter errorWriter;

    OriginCheckFilter(AvenraProperties properties, ErrorResponseWriter errorWriter) {
        var allowed = new HashSet<String>(properties.web().allowedOrigins());
        allowed.add(origin(properties.web().publicBaseUrl()));
        this.allowedOrigins = Set.copyOf(allowed);
        this.errorWriter = errorWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (origin != null && !SAFE_METHODS.contains(request.getMethod()) && !allowedOrigins.contains(origin)) {
            errorWriter.write(request, response, PlatformErrorCode.ORIGIN_NOT_ALLOWED);
            return;
        }
        chain.doFilter(request, response);
    }

    private static String origin(URI uri) {
        int port = uri.getPort();
        return uri.getScheme() + "://" + uri.getHost() + (port == -1 ? "" : ":" + port);
    }
}
