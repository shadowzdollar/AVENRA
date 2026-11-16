package com.avenra.platform.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * The single error body returned by the API (Guidelines §34). It never contains exception
 * messages, class names or stack traces.
 *
 * @param code stable, machine-readable error code
 * @param message human-readable explanation, safe to show to users
 * @param requestId correlation id, also returned in the {@code X-Request-Id} header
 * @param details per-field problems, for validation errors only
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ErrorResponse(String code, String message, String requestId, List<FieldProblem> details) {

    public ErrorResponse {
        details = details == null ? List.of() : List.copyOf(details);
    }

    /**
     * @param field the request field, as named in the API contract
     * @param problem what is wrong with it
     */
    public record FieldProblem(String field, String problem) {}
}
