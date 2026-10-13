package com.avenra;

import java.util.Map;
import java.util.UUID;

/** Creates verified, signed-in users through the real API, as a person would. */
public final class TestAccounts {

    public static final String PASSWORD = "plum-orbit-violin-42";

    private TestAccounts() {}

    public static String newEmail() {
        return "user-" + UUID.randomUUID() + "@example.test";
    }

    public static BrowserClient signedIn(int port, TestOutbox outbox, String email) {
        var browser = new BrowserClient(port);
        require(
                browser.post(
                        "/api/v1/auth/sign-up",
                        Map.of("email", email, "password", PASSWORD, "displayName", "Person " + email.substring(5, 9))),
                202);
        String token = outbox.latestToken(email, "email-verification").orElseThrow();
        require(browser.post("/api/v1/auth/email-verification", Map.of("token", token)), 204);
        require(browser.post("/api/v1/auth/sign-in", Map.of("email", email, "password", PASSWORD)), 200);
        return browser;
    }

    private static void require(BrowserClient.Response response, int status) {
        if (response.status() != status) {
            throw new IllegalStateException("expected " + status + " but got " + response.status() + ": "
                    + response.raw().body());
        }
    }
}
