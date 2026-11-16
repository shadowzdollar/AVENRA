package com.avenra.platform.security;

import com.avenra.platform.web.ErrorResponse;
import com.avenra.platform.web.PlatformErrorCode;
import com.avenra.platform.web.RequestIds;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.cors.DefaultCorsProcessor;
import tools.jackson.databind.json.JsonMapper;

/**
 * Standard CORS processing, but a rejected origin is answered in the platform error format
 * (Guidelines §34) instead of the default plain-text body.
 */
class ErrorFormatCorsProcessor extends DefaultCorsProcessor {

    private final JsonMapper json;

    ErrorFormatCorsProcessor(JsonMapper json) {
        this.json = json;
    }

    @Override
    protected void rejectRequest(ServerHttpResponse response) throws IOException {
        var code = PlatformErrorCode.ORIGIN_NOT_ALLOWED;
        String requestId = MDC.get(RequestIds.MDC_KEY);
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl("no-store");
        byte[] body = json.writeValueAsString(new ErrorResponse(
                        code.name(),
                        code.message(),
                        requestId != null ? requestId : UUID.randomUUID().toString(),
                        List.of()))
                .getBytes(StandardCharsets.UTF_8);
        response.getBody().write(body);
        response.flush();
    }
}
