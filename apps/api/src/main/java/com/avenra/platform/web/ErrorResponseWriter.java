package com.avenra.platform.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * Writes {@link ErrorResponse} bodies directly to the servlet response, for errors raised outside
 * Spring MVC (servlet filters and the security layer).
 */
@Component
public class ErrorResponseWriter {

    private final JsonMapper jsonMapper;

    ErrorResponseWriter(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public void write(HttpServletRequest request, HttpServletResponse response, PlatformErrorCode code)
            throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.resetBuffer();
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        jsonMapper.writeValue(response.getOutputStream(), body(request, code, List.of()));
    }

    static ErrorResponse body(
            HttpServletRequest request, PlatformErrorCode code, List<ErrorResponse.FieldProblem> details) {
        return new ErrorResponse(code.name(), code.message(), RequestIds.current(request), details);
    }
}
