package com.avenra.platform.web;

import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * A business error with a stable code, raised by any module and answered in the platform error
 * format (Guidelines §34). The message is shown to users, so it must never contain internals.
 */
public class ApiException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String code;
    private final HttpStatus status;
    private final transient List<ErrorResponse.FieldProblem> details;

    public ApiException(String code, HttpStatus status, String message) {
        this(code, status, message, List.of());
    }

    public ApiException(String code, HttpStatus status, String message, List<ErrorResponse.FieldProblem> details) {
        super(message, null, false, false);
        this.code = code;
        this.status = status;
        this.details = List.copyOf(details);
    }

    public String code() {
        return code;
    }

    public HttpStatus status() {
        return status;
    }

    public List<ErrorResponse.FieldProblem> details() {
        return details;
    }

    public static ApiException notFound() {
        return new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND, "The requested resource does not exist.");
    }

    public static ApiException accessDenied() {
        return new ApiException(
                "ACCESS_DENIED", HttpStatus.FORBIDDEN, "You do not have permission to perform this action.");
    }

    public static ApiException conflict(String code, String message) {
        return new ApiException(code, HttpStatus.CONFLICT, message);
    }

    public static ApiException invalid(String field, String problem) {
        return new ApiException(
                "VALIDATION_FAILED",
                HttpStatus.BAD_REQUEST,
                "The request contains invalid values.",
                List.of(new ErrorResponse.FieldProblem(field, problem)));
    }
}
