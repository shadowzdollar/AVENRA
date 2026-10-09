package com.avenra.platform.web;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Translates every exception that reaches Spring MVC into the platform {@link ErrorResponse}.
 * Exception messages are never sent to clients (Guidelines §34): unexpected errors are logged with
 * their stack trace on the server and answered with a generic message and the request id.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> invalidBody(MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<ErrorResponse.FieldProblem> details = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ErrorResponse.FieldProblem(error.getField(), problem(error.getDefaultMessage())))
                .sorted(Comparator.comparing(ErrorResponse.FieldProblem::field))
                .toList();
        return respond(request, PlatformErrorCode.VALIDATION_FAILED, details);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ErrorResponse> invalidParameters(
            HandlerMethodValidationException exception, HttpServletRequest request) {
        List<ErrorResponse.FieldProblem> details = exception.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> new ErrorResponse.FieldProblem(
                                result.getMethodParameter().getParameterName(), problem(error.getDefaultMessage()))))
                .sorted(Comparator.comparing(ErrorResponse.FieldProblem::field))
                .toList();
        return respond(request, PlatformErrorCode.VALIDATION_FAILED, details);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> unreadable(Exception exception, HttpServletRequest request) {
        if (causedByOversizedBody(exception)) {
            return respond(request, PlatformErrorCode.PAYLOAD_TOO_LARGE, List.of());
        }
        return respond(request, PlatformErrorCode.MALFORMED_REQUEST, List.of());
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> badParameter(HttpServletRequest request) {
        return respond(request, PlatformErrorCode.MALFORMED_REQUEST, List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErrorResponse> notFound(HttpServletRequest request) {
        return respond(request, PlatformErrorCode.NOT_FOUND, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> methodNotAllowed(
            HttpRequestMethodNotSupportedException exception, HttpServletRequest request) {
        var response = respond(request, PlatformErrorCode.METHOD_NOT_ALLOWED, List.of());
        return ResponseEntity.status(response.getStatusCode())
                .headers(headers -> headers.addAll(response.getHeaders()))
                .header(HttpHeaders.ALLOW, String.join(", ", exception.getSupportedMethods()))
                .body(response.getBody());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorResponse> unsupportedMediaType(HttpServletRequest request) {
        return respond(request, PlatformErrorCode.UNSUPPORTED_MEDIA_TYPE, List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    ResponseEntity<ErrorResponse> notAcceptable(HttpServletRequest request) {
        return respond(request, PlatformErrorCode.NOT_ACCEPTABLE, List.of());
    }

    @ExceptionHandler(ErrorResponseException.class)
    ResponseEntity<ErrorResponse> statusException(ErrorResponseException exception, HttpServletRequest request) {
        return respond(
                request, PlatformErrorCode.forStatus(exception.getStatusCode().value()), List.of());
    }

    /** Security exceptions are re-thrown so the security layer answers them consistently. */
    @ExceptionHandler({AccessDeniedException.class, AuthenticationException.class})
    void security(RuntimeException exception) {
        throw exception;
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> unexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception", exception);
        return respond(request, PlatformErrorCode.INTERNAL_ERROR, List.of());
    }

    private static ResponseEntity<ErrorResponse> respond(
            HttpServletRequest request, PlatformErrorCode code, List<ErrorResponse.FieldProblem> details) {
        return ResponseEntity.status(code.status())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(ErrorResponseWriter.body(request, code, details));
    }

    private static String problem(String message) {
        return message == null ? "is invalid" : message;
    }

    private static boolean causedByOversizedBody(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof RequestBodySizeLimitFilter.PayloadTooLargeException) {
                return true;
            }
        }
        return false;
    }
}
