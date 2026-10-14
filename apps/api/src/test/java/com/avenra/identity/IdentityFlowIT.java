package com.avenra.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.PostgresTestDatabase;
import com.avenra.TestOutbox;
import com.avenra.identity.domain.Totp;
import java.io.ByteArrayOutputStream;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * End-to-end identity behaviour over real HTTP, as a browser would see it (Phase 2 criteria 2.3,
 * 2.4, 2.5, 2.6, 2.7, 2.13, 2.14).
 */
@IntegrationTest
class IdentityFlowIT extends IntegrationTestBase {

    private static final String PASSWORD = "plum-orbit-violin-42";

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private BrowserClient browser() {
        return new BrowserClient(port);
    }

    private static String newEmail() {
        return "user-" + UUID.randomUUID() + "@example.test";
    }

    /** Signs up, verifies by the emailed link, signs in; returns the signed-in browser. */
    private BrowserClient signedInUser(String email) {
        var browser = browser();
        assertThat(browser.post("/api/v1/auth/sign-up", signUp(email)).status()).isEqualTo(202);
        String token = outbox.latestToken(email, "email-verification").orElseThrow();
        assertThat(browser.post("/api/v1/auth/email-verification", Map.of("token", token))
                        .status())
                .isEqualTo(204);
        assertThat(browser.post("/api/v1/auth/sign-in", credentials(email, PASSWORD))
                        .status())
                .isEqualTo(200);
        return browser;
    }

    private static Map<String, Object> signUp(String email) {
        return Map.of("email", email, "password", PASSWORD, "displayName", "Test User");
    }

    private static Map<String, Object> credentials(String email, String password) {
        return Map.of("email", email, "password", password);
    }

    @Nested
    class AccountsAndVerification {

        @Test
        void signUpVerifySignInAndDescribeTheSession() {
            String email = newEmail();
            var browser = signedInUser(email);

            var me = browser.get("/api/v1/auth/session");
            assertThat(me.status()).isEqualTo(200);
            assertThat(me.body().get("email").asString()).isEqualTo(email);
            assertThat(me.body().get("mfaEnabled").asBoolean()).isFalse();
            assertThat(me.body().get("organizations")).isEmpty();
        }

        @Test
        void signInIsRefusedUntilTheEmailIsVerified() {
            String email = newEmail();
            browser().post("/api/v1/auth/sign-up", signUp(email));

            var response = browser().post("/api/v1/auth/sign-in", credentials(email, PASSWORD));
            assertThat(response.status()).isEqualTo(403);
            assertThat(response.code()).isEqualTo("EMAIL_NOT_VERIFIED");
        }

        @Test
        void verificationTokensWorkOnceAndOnlyTheLatestCounts() {
            String email = newEmail();
            var browser = browser();
            browser.post("/api/v1/auth/sign-up", signUp(email));
            String first = outbox.latestToken(email, "email-verification").orElseThrow();
            browser.post("/api/v1/auth/email-verification/resend", Map.of("email", email));
            // Email is delivered by a job: wait for the second message before taking the latest token.
            outbox.await(message -> message.to().equals(email)
                    && message.category().equals("email-verification")
                    && !message.body().contains(first));
            String second = outbox.latestToken(email, "email-verification").orElseThrow();

            assertThat(browser.post("/api/v1/auth/email-verification", Map.of("token", first))
                            .code())
                    .isEqualTo("INVALID_TOKEN");
            assertThat(browser.post("/api/v1/auth/email-verification", Map.of("token", second))
                            .status())
                    .isEqualTo(204);
            assertThat(browser.post("/api/v1/auth/email-verification", Map.of("token", second))
                            .code())
                    .isEqualTo("INVALID_TOKEN");
        }

        @Test
        void weakPasswordsAreRejectedWithFieldDetails() {
            var response = browser()
                    .post(
                            "/api/v1/auth/sign-up",
                            Map.of("email", newEmail(), "password", "password1234", "displayName", "X"));
            assertThat(response.status()).isEqualTo(400);
            assertThat(response.code()).isEqualTo("VALIDATION_FAILED");
            assertThat(response.body().get("details").get(0).get("field").asString())
                    .isEqualTo("password");
        }

        @Test
        void passwordsAreStoredOnlyAsArgon2idHashes() throws SQLException {
            String email = newEmail();
            signedInUser(email);
            try (var owner = DriverManager.getConnection(
                            PostgresTestDatabase.jdbcUrl(),
                            PostgresTestDatabase.OWNER_USER,
                            PostgresTestDatabase.OWNER_PASSWORD);
                    var statement = owner.prepareStatement("select password_hash from users where email = ?")) {
                statement.setString(1, email);
                var rows = statement.executeQuery();
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).startsWith("{argon2id}$argon2id$").doesNotContain(PASSWORD);
            }
        }
    }

    @Nested
    class EnumerationResistance {

        @Test
        void signUpWithARegisteredEmailLooksLikeAnyOtherSignUp() {
            String email = newEmail();
            signedInUser(email);

            var again = browser().post("/api/v1/auth/sign-up", signUp(email));
            assertThat(again.status()).isEqualTo(202);
            assertThat(again.raw().body()).isEmpty();
            assertThat(outbox.await(message ->
                            message.to().equals(email) && message.category().equals("already-registered")))
                    .isNotEmpty();
        }

        @Test
        void unknownEmailAndWrongPasswordFailIdentically() {
            String email = newEmail();
            signedInUser(email);

            var unknown = browser().post("/api/v1/auth/sign-in", credentials(newEmail(), PASSWORD));
            var wrong = browser().post("/api/v1/auth/sign-in", credentials(email, "not-the-password-1"));

            assertThat(unknown.status()).isEqualTo(401).isEqualTo(wrong.status());
            assertThat(unknown.code()).isEqualTo("INVALID_CREDENTIALS").isEqualTo(wrong.code());
            assertThat(unknown.body().get("message")).isEqualTo(wrong.body().get("message"));
        }

        @Test
        void resetAndResendDoNotRevealWhetherAnAccountExists() {
            String email = newEmail();
            signedInUser(email);
            for (String path : List.of("/api/v1/auth/password-reset", "/api/v1/auth/email-verification/resend")) {
                var known = browser().post(path, Map.of("email", email));
                var unknown = browser().post(path, Map.of("email", newEmail()));
                assertThat(known.status()).isEqualTo(202).isEqualTo(unknown.status());
                assertThat(known.raw().body()).isEqualTo(unknown.raw().body());
            }
        }
    }

    @Nested
    class Sessions {

        @Test
        void theSessionCookieIsHostOnlyHttpOnlySecureAndLax() {
            String email = newEmail();
            var browser = browser();
            browser.post("/api/v1/auth/sign-up", signUp(email));
            browser.post(
                    "/api/v1/auth/email-verification",
                    Map.of(
                            "token",
                            outbox.latestToken(email, "email-verification").orElseThrow()));

            var signIn = browser.post("/api/v1/auth/sign-in", credentials(email, PASSWORD));
            String cookie = signIn.setCookies().stream()
                    .filter(header -> header.startsWith("__Host-avenra_session="))
                    .findFirst()
                    .orElseThrow();
            assertThat(cookie)
                    .contains("HttpOnly", "Secure", "SameSite=Lax", "Path=/")
                    .doesNotContain("Domain");
        }

        @Test
        void signOutEndsTheSession() {
            var browser = signedInUser(newEmail());
            String token = browser.cookie("__Host-avenra_session");

            assertThat(browser.post("/api/v1/auth/sign-out", null).status()).isEqualTo(204);
            assertThat(browser.hasCookie("__Host-avenra_session")).isFalse();

            browser.setCookie("__Host-avenra_session", token);
            assertThat(browser.get("/api/v1/auth/session").status()).isEqualTo(401);
        }

        @Test
        void signingOutEverywhereElseEndsOtherSessionsOnly() {
            String email = newEmail();
            var laptop = signedInUser(email);
            var phone = browser();
            phone.post("/api/v1/auth/sign-in", credentials(email, PASSWORD));
            assertThat(laptop.get("/api/v1/auth/sessions").body()).hasSize(2);

            assertThat(laptop.delete("/api/v1/auth/sessions").status()).isEqualTo(204);

            assertThat(laptop.get("/api/v1/auth/session").status()).isEqualTo(200);
            assertThat(phone.get("/api/v1/auth/session").status()).isEqualTo(401);
        }

        @Test
        void anIdleExpiredSessionNoLongerAuthenticates() throws SQLException {
            String email = newEmail();
            var browser = signedInUser(email);
            try (var owner = DriverManager.getConnection(
                            PostgresTestDatabase.jdbcUrl(),
                            PostgresTestDatabase.OWNER_USER,
                            PostgresTestDatabase.OWNER_PASSWORD);
                    var statement = owner.prepareStatement("update sessions set idle_expires_at = now() - interval '1"
                            + " second' where user_id = (select id from users where email = ?)")) {
                statement.setString(1, email);
                statement.executeUpdate();
            }
            assertThat(browser.get("/api/v1/auth/session").status()).isEqualTo(401);
        }

        @Test
        void changingThePasswordSignsOutOtherSessions() {
            String email = newEmail();
            var laptop = signedInUser(email);
            var phone = browser();
            phone.post("/api/v1/auth/sign-in", credentials(email, PASSWORD));

            var change = laptop.put(
                    "/api/v1/auth/password",
                    Map.of("currentPassword", PASSWORD, "newPassword", "lantern-quartz-meadow-7"));
            assertThat(change.status()).isEqualTo(204);

            assertThat(laptop.get("/api/v1/auth/session").status()).isEqualTo(200);
            assertThat(phone.get("/api/v1/auth/session").status()).isEqualTo(401);
            assertThat(browser()
                            .post("/api/v1/auth/sign-in", credentials(email, PASSWORD))
                            .status())
                    .isEqualTo(401);
        }

        @Test
        void passwordResetWorksOnceAndSignsOutEverywhere() {
            String email = newEmail();
            var browser = signedInUser(email);
            browser().post("/api/v1/auth/password-reset", Map.of("email", email));
            String token = outbox.latestToken(email, "password-reset").orElseThrow();
            var reset = Map.of("token", token, "newPassword", "harbor-tangent-pixel-9");

            assertThat(browser()
                            .post("/api/v1/auth/password-reset/confirm", reset)
                            .status())
                    .isEqualTo(204);
            assertThat(browser()
                            .post("/api/v1/auth/password-reset/confirm", reset)
                            .code())
                    .isEqualTo("INVALID_TOKEN");
            assertThat(browser.get("/api/v1/auth/session").status()).isEqualTo(401);
            assertThat(browser()
                            .post("/api/v1/auth/sign-in", credentials(email, "harbor-tangent-pixel-9"))
                            .status())
                    .isEqualTo(200);
        }
    }

    @Nested
    class MultiFactor {

        @Test
        void enrolActivateAndSignInWithASecondFactor() {
            String email = newEmail();
            var browser = signedInUser(email);

            var enrollment = browser.post("/api/v1/auth/mfa/totp", null);
            assertThat(enrollment.status()).isEqualTo(200);
            byte[] secret = base32(enrollment.body().get("secret").asString());
            assertThat(enrollment.body().get("otpauthUri").asString()).startsWith("otpauth://totp/Avenra:");

            var activation = browser.post("/api/v1/auth/mfa/totp/activation", Map.of("code", code(secret, 0)));
            assertThat(activation.status()).isEqualTo(200);
            assertThat(activation.body().get("codes")).hasSize(10);
            assertThat(browser.get("/api/v1/auth/session")
                            .body()
                            .get("mfaEnabled")
                            .asBoolean())
                    .isTrue();

            var second = browser();
            var signIn = second.post("/api/v1/auth/sign-in", credentials(email, PASSWORD));
            assertThat(signIn.body().get("status").asString()).isEqualTo("MFA_REQUIRED");
            assertThat(second.hasCookie("__Host-avenra_session")).isFalse();
            String challenge = signIn.body().get("mfaChallengeId").asString();

            assertThat(second.post("/api/v1/auth/sign-in/mfa", Map.of("mfaChallengeId", challenge, "code", "000000"))
                            .code())
                    .isEqualTo("INVALID_MFA_CODE");
            var done = second.post(
                    "/api/v1/auth/sign-in/mfa", Map.of("mfaChallengeId", challenge, "code", code(secret, 1)));
            assertThat(done.status()).isEqualTo(200);
            assertThat(done.body().get("status").asString()).isEqualTo("SIGNED_IN");
            assertThat(second.get("/api/v1/auth/session").status()).isEqualTo(200);
        }

        @Test
        void aCodeCannotBeReplayedAndRecoveryCodesWorkOnce() {
            String email = newEmail();
            var browser = signedInUser(email);
            byte[] secret = base32(browser.post("/api/v1/auth/mfa/totp", null)
                    .body()
                    .get("secret")
                    .asString());
            String used = code(secret, 0);
            var recovery = browser.post("/api/v1/auth/mfa/totp/activation", Map.of("code", used))
                    .body()
                    .get("codes")
                    .get(0)
                    .asString();

            String challenge = browser()
                    .post("/api/v1/auth/sign-in", credentials(email, PASSWORD))
                    .body()
                    .get("mfaChallengeId")
                    .asString();
            assertThat(browser()
                            .post("/api/v1/auth/sign-in/mfa", Map.of("mfaChallengeId", challenge, "code", used))
                            .code())
                    .as("the activation code cannot be reused")
                    .isEqualTo("INVALID_MFA_CODE");
            assertThat(browser()
                            .post("/api/v1/auth/sign-in/mfa", Map.of("mfaChallengeId", challenge, "code", recovery))
                            .status())
                    .isEqualTo(200);

            String next = browser()
                    .post("/api/v1/auth/sign-in", credentials(email, PASSWORD))
                    .body()
                    .get("mfaChallengeId")
                    .asString();
            assertThat(browser()
                            .post("/api/v1/auth/sign-in/mfa", Map.of("mfaChallengeId", next, "code", recovery))
                            .code())
                    .as("a recovery code works once")
                    .isEqualTo("INVALID_MFA_CODE");
        }

        /**
         * The code for the current step plus {@code offset}. Offsets 0 and 1 stay inside the accepted
         * window even if the 30-second step changes during the test (the server accepts one step of
         * drift either way); each code is single-use, so later uses take the next offset.
         */
        private static String code(byte[] secret, int offset) {
            return Totp.code(secret, Totp.step(Instant.now()) + offset);
        }

        private static byte[] base32(String text) {
            String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            var out = new ByteArrayOutputStream();
            int buffer = 0;
            int bits = 0;
            for (char c : text.toCharArray()) {
                buffer = (buffer << 5) | alphabet.indexOf(c);
                bits += 5;
                if (bits >= 8) {
                    out.write((buffer >> (bits - 8)) & 0xff);
                    bits -= 8;
                }
            }
            return out.toByteArray();
        }
    }

    @Nested
    class Auditing {

        @Test
        void signInSuccessAndFailureAreAudited() throws SQLException {
            String email = newEmail();
            signedInUser(email);
            browser().post("/api/v1/auth/sign-in", credentials(email, "not-the-password-1"));

            try (var owner = DriverManager.getConnection(
                            PostgresTestDatabase.jdbcUrl(),
                            PostgresTestDatabase.OWNER_USER,
                            PostgresTestDatabase.OWNER_PASSWORD);
                    var statement = owner.prepareStatement("""
                            select action, details::text from audit_events
                            where actor_user_id = (select id from users where email = ?) order by occurred_at
                            """)) {
                statement.setString(1, email);
                var rows = statement.executeQuery();
                var actions = new java.util.ArrayList<String>();
                var details = new java.util.ArrayList<String>();
                while (rows.next()) {
                    actions.add(rows.getString(1));
                    details.add(rows.getString(2));
                }
                assertThat(actions)
                        .contains(
                                "identity.sign_up",
                                "identity.email_verified",
                                "identity.sign_in.succeeded",
                                "identity.sign_in.failed");
                assertThat(String.join(" ", details)).doesNotContain(PASSWORD, "not-the-password-1");
            }
        }
    }
}
