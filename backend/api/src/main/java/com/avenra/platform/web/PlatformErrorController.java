package com.avenra.platform.web;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Replaces Spring Boot's default error page for errors raised by the servlet container outside
 * Spring MVC, so those responses use the same {@link ErrorResponse} format and never include
 * exception details.
 */
@RestController
class PlatformErrorController implements ErrorController {

    @RequestMapping("${server.error.path:/error}")
    ResponseEntity<ErrorResponse> error(HttpServletRequest request) {
        PlatformErrorCode code = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE) instanceof Integer status
                ? PlatformErrorCode.forStatus(status)
                : PlatformErrorCode.NOT_FOUND;
        return ResponseEntity.status(code.status())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(ErrorResponseWriter.body(request, code, List.of()));
    }
}
