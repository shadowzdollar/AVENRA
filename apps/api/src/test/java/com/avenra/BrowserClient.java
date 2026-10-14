package com.avenra;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Behaves like the web app in a browser (ADR-013): keeps cookies (including Secure ones, which the
 * JDK cookie store refuses over plain HTTP), fetches the CSRF token and echoes it, sends JSON.
 */
public final class BrowserClient {

    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final String base;
    private final Map<String, String> cookies = new LinkedHashMap<>();

    public BrowserClient(int port) {
        this.base = "http://localhost:" + port;
    }

    /** A response with its parsed JSON body (or null) and raw Set-Cookie headers. */
    public record Response(int status, JsonNode body, List<String> setCookies, HttpResponse<String> raw) {

        public String code() {
            return body == null || !body.has("code") ? null : body.get("code").asString();
        }
    }

    public Response get(String path) {
        return send("GET", path, null, Map.of());
    }

    public Response post(String path, Object body) {
        return send("POST", path, body, Map.of());
    }

    public Response post(String path, Object body, Map<String, String> headers) {
        return send("POST", path, body, headers);
    }

    public Response put(String path, Object body) {
        return send("PUT", path, body, Map.of());
    }

    public Response patch(String path, Object body) {
        return send("PATCH", path, body, Map.of());
    }

    public Response delete(String path) {
        return send("DELETE", path, null, Map.of());
    }

    public Response delete(String path, Object body) {
        return send("DELETE", path, body, Map.of());
    }

    /** Creates an organization with a fresh idempotency key and returns its id. */
    public UUID createOrganization(String name) {
        var response = post("/api/v1/organizations", Map.of("name", name), Map.of("Idempotency-Key", key()));
        if (response.status() != 201) {
            throw new IllegalStateException(
                    "create organization failed: " + response.raw().body());
        }
        return UUID.fromString(response.body().get("id").asString());
    }

    public static String key() {
        return "key-" + UUID.randomUUID();
    }

    public boolean hasCookie(String name) {
        return cookies.containsKey(name);
    }

    public void forgetCookie(String name) {
        cookies.remove(name);
    }

    public void setCookie(String name, String value) {
        cookies.put(name, value);
    }

    public String cookie(String name) {
        return cookies.get(name);
    }

    public Response get(String path, Map<String, String> headers) {
        return send("GET", path, null, headers);
    }

    /** Uploads a file as {@code multipart/form-data} in the part named {@code file}, like a browser form. */
    public Response upload(String path, String fileName, byte[] content, Map<String, String> headers) {
        String boundary = "----avenra-test-" + UUID.randomUUID();
        var body = new java.io.ByteArrayOutputStream();
        body.writeBytes(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + fileName
                        + "\"\r\nContent-Type: application/octet-stream\r\n\r\n")
                .getBytes(java.nio.charset.StandardCharsets.UTF_8));
        body.writeBytes(content);
        body.writeBytes(("\r\n--" + boundary + "--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var response = exchange(
                "POST",
                path,
                HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()),
                "multipart/form-data; boundary=" + boundary,
                headers,
                HttpResponse.BodyHandlers.ofString());
        return parsed(response);
    }

    /** Downloads raw bytes, as a browser saving a file. */
    public HttpResponse<byte[]> download(String path) {
        return exchange(
                "GET",
                path,
                HttpRequest.BodyPublishers.noBody(),
                null,
                Map.of(),
                HttpResponse.BodyHandlers.ofByteArray());
    }

    private Response send(String method, String path, Object body, Map<String, String> headers) {
        var response = exchange(
                method,
                path,
                body == null
                        ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)),
                body == null ? null : "application/json",
                headers,
                HttpResponse.BodyHandlers.ofString());
        return parsed(response);
    }

    private Response parsed(HttpResponse<String> response) {
        String text = response.body();
        boolean json = response.headers()
                .firstValue("Content-Type")
                .map(type -> type.contains("json"))
                .orElse(false);
        JsonNode node = text.isBlank() || !json ? null : JSON.readTree(text);
        return new Response(response.statusCode(), node, response.headers().allValues("Set-Cookie"), response);
    }

    private <T> HttpResponse<T> exchange(
            String method,
            String path,
            HttpRequest.BodyPublisher publisher,
            String contentType,
            Map<String, String> headers,
            HttpResponse.BodyHandler<T> handler) {
        boolean stateChanging = !method.equals("GET");
        if (stateChanging && !cookies.containsKey("XSRF-TOKEN")) {
            send("GET", "/api/v1/auth/csrf", null, Map.of());
        }
        var request = HttpRequest.newBuilder(URI.create(base + path)).method(method, publisher);
        if (contentType != null) {
            request.header("Content-Type", contentType);
        }
        if (!cookies.isEmpty()) {
            request.header(
                    "Cookie",
                    cookies.entrySet().stream()
                            .map(entry -> entry.getKey() + "=" + entry.getValue())
                            .collect(Collectors.joining("; ")));
        }
        if (stateChanging && cookies.containsKey("XSRF-TOKEN")) {
            request.header("X-XSRF-TOKEN", cookies.get("XSRF-TOKEN"));
        }
        headers.forEach(request::header);
        try {
            HttpResponse<T> response = HTTP.send(request.build(), handler);
            response.headers().allValues("Set-Cookie").forEach(this::remember);
            return response;
        } catch (IOException exception) {
            throw new java.io.UncheckedIOException(exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private void remember(String setCookie) {
        String pair = setCookie.split(";", 2)[0];
        int equals = pair.indexOf('=');
        String name = pair.substring(0, equals).strip();
        String value = pair.substring(equals + 1).strip();
        boolean expired = setCookie.toLowerCase().contains("max-age=0");
        if (expired || value.isEmpty()) {
            cookies.remove(name);
        } else {
            cookies.put(name, value);
        }
    }
}
