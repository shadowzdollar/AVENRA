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

    private Response send(String method, String path, Object body, Map<String, String> headers) {
        boolean stateChanging = !method.equals("GET");
        if (stateChanging && !cookies.containsKey("XSRF-TOKEN")) {
            send("GET", "/api/v1/auth/csrf", null, Map.of());
        }
        var request = HttpRequest.newBuilder(URI.create(base + path));
        try {
            request.method(
                    method,
                    body == null
                            ? HttpRequest.BodyPublishers.noBody()
                            : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
            if (body != null) {
                request.header("Content-Type", "application/json");
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
            HttpResponse<String> response = HTTP.send(request.build(), HttpResponse.BodyHandlers.ofString());
            List<String> setCookies = response.headers().allValues("Set-Cookie");
            setCookies.forEach(this::remember);
            JsonNode json = response.body().isBlank() ? null : JSON.readTree(response.body());
            return new Response(response.statusCode(), json, setCookies, response);
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
