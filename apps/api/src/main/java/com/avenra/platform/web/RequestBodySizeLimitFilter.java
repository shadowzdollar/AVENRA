package com.avenra.platform.web;

import com.avenra.platform.AvenraProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rejects request bodies larger than {@code avenra.web.max-request-body-size} (Guidelines §71).
 * A declared {@code Content-Length} over the limit is rejected immediately; bodies without one
 * (chunked) are counted while being read and fail once they pass the limit.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
class RequestBodySizeLimitFilter extends OncePerRequestFilter {

    private final long maxBytes;
    private final ErrorResponseWriter errorWriter;

    RequestBodySizeLimitFilter(AvenraProperties properties, ErrorResponseWriter errorWriter) {
        this.maxBytes = properties.web().maxRequestBodySize().toBytes();
        this.errorWriter = errorWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > maxBytes) {
            errorWriter.write(request, response, PlatformErrorCode.PAYLOAD_TOO_LARGE);
            return;
        }
        chain.doFilter(new LimitedRequest(request, maxBytes), response);
    }

    /** Thrown while reading a streamed body that exceeds the limit. */
    static final class PayloadTooLargeException extends IOException {

        private static final long serialVersionUID = 1L;

        PayloadTooLargeException(long maxBytes) {
            super("Request body exceeds " + maxBytes + " bytes");
        }
    }

    private static final class LimitedRequest extends HttpServletRequestWrapper {

        private final long maxBytes;
        private ServletInputStream stream;

        LimitedRequest(HttpServletRequest request, long maxBytes) {
            super(request);
            this.maxBytes = maxBytes;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            if (stream == null) {
                stream = new LimitedInputStream(super.getInputStream(), maxBytes);
            }
            return stream;
        }
    }

    private static final class LimitedInputStream extends ServletInputStream {

        private final ServletInputStream delegate;
        private final long maxBytes;
        private long read;

        LimitedInputStream(ServletInputStream delegate, long maxBytes) {
            this.delegate = delegate;
            this.maxBytes = maxBytes;
        }

        @Override
        public int read() throws IOException {
            int value = delegate.read();
            if (value != -1) {
                count(1);
            }
            return value;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            int count = delegate.read(buffer, offset, length);
            if (count > 0) {
                count(count);
            }
            return count;
        }

        private void count(int bytes) throws PayloadTooLargeException {
            read += bytes;
            if (read > maxBytes) {
                throw new PayloadTooLargeException(maxBytes);
            }
        }

        @Override
        public boolean isFinished() {
            return delegate.isFinished();
        }

        @Override
        public boolean isReady() {
            return delegate.isReady();
        }

        @Override
        public void setReadListener(ReadListener listener) {
            delegate.setReadListener(listener);
        }
    }
}
