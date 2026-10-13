package com.avenra.platform.web;

import org.springframework.http.HttpStatus;

/** Error codes produced by the platform itself, independent of any business module. */
public enum PlatformErrorCode {
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST, "The request could not be read."),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "The request contains invalid values."),
    AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED, "Authentication is required."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "You do not have permission to perform this action."),
    CSRF_TOKEN_INVALID(HttpStatus.FORBIDDEN, "The request could not be verified. Reload the page and try again."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "The requested resource does not exist."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "This method is not supported for this resource."),
    NOT_ACCEPTABLE(HttpStatus.NOT_ACCEPTABLE, "The requested response format is not supported."),
    PAYLOAD_TOO_LARGE(HttpStatus.CONTENT_TOO_LARGE, "The request body is too large."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The request content type is not supported."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");

    private final HttpStatus status;
    private final String message;

    PlatformErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus status() {
        return status;
    }

    public String message() {
        return message;
    }

    /** Maps an HTTP status raised outside our handlers to the closest platform code. */
    static PlatformErrorCode forStatus(int status) {
        return switch (status) {
            case 400 -> MALFORMED_REQUEST;
            case 401 -> AUTHENTICATION_REQUIRED;
            case 403 -> ACCESS_DENIED;
            case 404 -> NOT_FOUND;
            case 405 -> METHOD_NOT_ALLOWED;
            case 406 -> NOT_ACCEPTABLE;
            case 413 -> PAYLOAD_TOO_LARGE;
            case 415 -> UNSUPPORTED_MEDIA_TYPE;
            default -> status >= 400 && status < 500 ? MALFORMED_REQUEST : INTERNAL_ERROR;
        };
    }
}
