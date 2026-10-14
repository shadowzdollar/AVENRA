package com.avenra.document.infrastructure;

import com.avenra.document.application.DocumentProperties;
import com.avenra.document.application.MalwareScanner;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Scans files with ClamAV's {@code clamd} over TCP using the {@code INSTREAM} command (ADR-021).
 * Any failure to obtain a clear verdict is reported as {@link ScannerUnavailableException}, so
 * callers fail closed.
 */
@Component
class ClamdScanner implements MalwareScanner {

    private static final Logger log = LoggerFactory.getLogger(ClamdScanner.class);
    private static final int CHUNK = 64 * 1024;
    private static final int MAX_REPLY = 1024;

    private final DocumentProperties.Scanner settings;

    ClamdScanner(DocumentProperties properties) {
        this.settings = properties.scanner();
    }

    @Override
    public Verdict scan(Path file) {
        try (var socket = connect();
                InputStream content = Files.newInputStream(file)) {
            var out = new DataOutputStream(socket.getOutputStream());
            out.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));
            byte[] buffer = new byte[CHUNK];
            int read;
            while ((read = content.read(buffer)) > 0) {
                out.writeInt(read);
                out.write(buffer, 0, read);
            }
            out.writeInt(0);
            out.flush();
            return interpret(readReply(socket.getInputStream()));
        } catch (IOException failure) {
            log.warn("Malware scanner unreachable: {}", failure.getClass().getSimpleName());
            throw new ScannerUnavailableException();
        }
    }

    @Override
    public boolean isAvailable() {
        try (var socket = connect()) {
            socket.getOutputStream().write("zPING\0".getBytes(StandardCharsets.US_ASCII));
            return "PONG".equals(readReply(socket.getInputStream()));
        } catch (IOException failure) {
            return false;
        }
    }

    static Verdict interpret(String reply) {
        // "stream: OK" or "stream: <signature> FOUND"; anything else is not a verdict.
        if (reply.equals("stream: OK")) {
            return Verdict.clean();
        }
        if (reply.startsWith("stream: ") && reply.endsWith(" FOUND")) {
            String signature = reply.substring("stream: ".length(), reply.length() - " FOUND".length())
                    .strip();
            return Verdict.infected(signature.isEmpty() ? "unknown" : signature);
        }
        log.warn("Malware scanner returned no verdict");
        throw new ScannerUnavailableException();
    }

    /**
     * clamd speaks plain TCP only; ADR-021 requires it on a private network next to the API (the
     * same host, pod or private subnet), never across an untrusted network.
     */
    private Socket connect() throws IOException {
        // nosemgrep: java.lang.security.audit.crypto.unencrypted-socket.unencrypted-socket
        var socket = new Socket();
        socket.connect(new InetSocketAddress(settings.host(), settings.port()), (int)
                settings.connectTimeout().toMillis());
        socket.setSoTimeout((int) settings.scanTimeout().toMillis());
        return socket;
    }

    private static String readReply(InputStream in) throws IOException {
        var reply = new ByteArrayOutputStream();
        int b;
        while ((b = in.read()) > 0 && reply.size() < MAX_REPLY) {
            reply.write(b);
        }
        return reply.toString(StandardCharsets.US_ASCII).strip();
    }
}
