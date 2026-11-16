package com.avenra.platform.web;

import io.micrometer.common.KeyValue;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.filter.ServerHttpObservationFilter;

/**
 * Assigns the request id before the application and the security layer run, so every log line,
 * response header and error body for the request carries it. Logs one line per completed request.
 * The query string is never logged because it can carry sensitive values.
 *
 * <p>Runs just inside Spring's HTTP observation filter ({@code HIGHEST_PRECEDENCE + 1}), so the
 * request log line carries the trace id and the request id is recorded on the trace.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
class RequestIdFilter extends OncePerRequestFilter {

    /** Span attribute holding the request id, so a trace can be found from a request id. */
    static final String SPAN_ATTRIBUTE = "avenra.request_id";

    private static final Logger log = LoggerFactory.getLogger(RequestIdFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = RequestIds.resolve(request.getHeader(RequestIds.HEADER));
        request.setAttribute(RequestIds.ATTRIBUTE, requestId);
        response.setHeader(RequestIds.HEADER, requestId);
        MDC.put(RequestIds.MDC_KEY, requestId);
        ServerHttpObservationFilter.findObservationContext(request)
                .ifPresent(context -> context.addHighCardinalityKeyValue(KeyValue.of(SPAN_ATTRIBUTE, requestId)));
        long started = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            log.atInfo()
                    .addKeyValue("http.request.method", request.getMethod())
                    .addKeyValue("url.path", request.getRequestURI())
                    .addKeyValue("http.response.status_code", response.getStatus())
                    .addKeyValue("event.duration_ms", TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started))
                    .log("Request completed");
            MDC.remove(RequestIds.MDC_KEY);
        }
    }
}
