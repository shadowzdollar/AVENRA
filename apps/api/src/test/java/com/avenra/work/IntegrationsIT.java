package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import com.avenra.TestServices;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Integrations through the API (Phase 8 criteria 8.2–8.9): signed webhooks from domain facts,
 * retries and pausing, address checks, credentials shown once, rotation and revocation, and the
 * export of completed work to an S3-compatible bucket, verified.
 */
@IntegrationTest
class IntegrationsIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(20);
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    /** A webhook receiver on loopback that records requests and answers with a scripted status. */
    private record Received(Map<String, String> headers, String body) {}

    private HttpServer receiver;
    private final List<Received> received = new CopyOnWriteArrayList<>();
    private final AtomicInteger answer = new AtomicInteger(200);

    private String receiver() throws IOException {
        receiver = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        receiver.createContext("/hook", exchange -> {
            try (exchange) {
                var headers = Map.of(
                        "id", String.valueOf(exchange.getRequestHeaders().getFirst("Avenra-Event-Id")),
                        "type", String.valueOf(exchange.getRequestHeaders().getFirst("Avenra-Event-Type")),
                        "signature", String.valueOf(exchange.getRequestHeaders().getFirst("Avenra-Signature")));
                received.add(new Received(
                        headers, new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
                exchange.sendResponseHeaders(answer.get(), -1);
            }
        });
        receiver.start();
        return "http://127.0.0.1:" + receiver.getAddress().getPort() + "/hook";
    }

    @AfterEach
    void stopReceiver() {
        if (receiver != null) {
            receiver.stop(0);
        }
    }

    private record Setup(BrowserClient owner, UUID organization, UUID work) {

        String integrations() {
            return org(organization) + "/integrations";
        }

        String workPath() {
            return org(organization) + "/work/" + work;
        }
    }

    private Setup setup() {
        var owner = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Connected Ltd");
        UUID work = createWork(owner, organization, "Onboarding");
        ok(transition(owner, organization, work, "DRAFT", "READY", null));
        ok(transition(owner, organization, work, "READY", "RUNNING", null));
        return new Setup(owner, organization, work);
    }

    private JsonNode webhook(Setup s, String url, List<String> events) {
        return created(s.owner()
                        .post(
                                s.integrations(),
                                Map.of(
                                        "provider",
                                        "WEBHOOK",
                                        "name",
                                        "Our CRM",
                                        "events",
                                        events,
                                        "settings",
                                        Map.of("url", url)),
                                key()))
                .body();
    }

    private static String hmac(String secret, String message) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
    }

    private JsonNode deliveries(Setup s, String connection) {
        return ok(s.owner().get(s.integrations() + "/" + connection + "/deliveries"))
                .body();
    }

    @Test
    void domainFactsBecomeSignedWebhooksWithoutAnswerValues() throws Exception {
        var s = setup();
        var created = webhook(s, receiver(), List.of("information.answer_received", "work.completed"));
        String secret = created.get("signingSecret").asString();
        String connection = created.get("connection").get("id").asString();
        assertThat(secret).startsWith("whsec_").hasSize(70);
        assertThat(created.get("connection").get("capabilities").toString()).contains("events.deliver");

        var listed = ok(s.owner().get(s.integrations())).body();
        assertThat(listed.toString()).doesNotContain(secret.substring(6));
        assertThat(ownerQuery(
                                "select credential_ciphertext from integration_connections where id = ?",
                                UUID.fromString(connection))
                        .getFirst()
                        .getFirst()
                        .toString())
                .doesNotContain(secret);

        UUID name = requirement(s.owner(), s.organization(), s.work(), "Legal name", "TEXT", true);
        created(s.owner()
                .post(s.workPath() + "/requirements/" + name + "/value", Map.of("value", "Secret Answer Ltd")));
        await().atMost(WAIT).until(() -> !received.isEmpty());
        var hook = received.getFirst();
        assertThat(hook.headers().get("type")).isEqualTo("information.answer_received");
        var event = JSON.readTree(hook.body());
        assertThat(event.get("id").asString()).isEqualTo(hook.headers().get("id"));
        assertThat(event.get("version").asInt()).isEqualTo(1);
        assertThat(event.get("organizationId").asString())
                .isEqualTo(s.organization().toString());
        assertThat(event.get("data").get("requirementTitle").asString()).isEqualTo("Legal name");
        assertThat(hook.body()).as("answer values never leave in webhooks").doesNotContain("Secret Answer Ltd");

        // The receiver can verify the signature and the timestamp.
        String signature = hook.headers().get("signature");
        String timestamp = signature.substring(2, signature.indexOf(','));
        assertThat(signature).endsWith(",v1=" + hmac(secret, timestamp + "." + hook.body()));
        assertThat(Math.abs(System.currentTimeMillis() / 1000 - Long.parseLong(timestamp)))
                .isLessThan(60);

        var history = await().atMost(WAIT)
                .until(
                        () -> deliveries(s, connection),
                        list -> list.size() == 1
                                && list.get(0).get("status").asString().equals("DELIVERED"));
        assertThat(history.get(0).get("lastStatusCode").asInt()).isEqualTo(200);
        assertThat(auditActions(s.organization())).contains("integration.connection.created");
    }

    @Test
    void failingDeliveriesAreRetriedThenTheConnectionIsPausedAndCanBeResumed() throws Exception {
        var s = setup();
        String connection = webhook(s, receiver(), List.of("information.answer_received"))
                .get("connection")
                .get("id")
                .asString();
        answer.set(503);
        UUID name = requirement(s.owner(), s.organization(), s.work(), "Legal name", "TEXT", true);
        UUID number = requirement(s.owner(), s.organization(), s.work(), "Company number", "TEXT", true);
        created(s.owner().post(s.workPath() + "/requirements/" + name + "/value", Map.of("value", "A")));
        created(s.owner().post(s.workPath() + "/requirements/" + number + "/value", Map.of("value", "B")));
        var paused = await().atMost(WAIT)
                .until(
                        () -> ok(s.owner().get(s.integrations())).body().get(0),
                        node -> node.get("status").asString().equals("PAUSED"));
        assertThat(paused.get("consecutiveFailures").asInt()).isEqualTo(2);
        var failed = deliveries(s, connection);
        assertThat(failed).extracting(node -> node.get("status").asString()).containsOnly("FAILED");
        assertThat(failed).extracting(node -> node.get("attempts").asInt()).containsOnly(3);
        assertThat(auditActions(s.organization())).contains("integration.connection.paused");

        // Resumed and redelivered once the receiver works again.
        answer.set(204);
        ok(s.owner().patch(s.integrations() + "/" + connection, Map.of("status", "ACTIVE")));
        ok(s.owner()
                .post(
                        s.integrations() + "/" + connection + "/deliveries/"
                                + failed.get(0).get("id").asString() + "/redelivery",
                        Map.of()));
        await().atMost(WAIT).until(() -> deliveries(s, connection).toString().contains("DELIVERED"));
        assertThat(ok(s.owner().get(s.integrations()))
                        .body()
                        .get(0)
                        .get("consecutiveFailures")
                        .asInt())
                .isZero();
    }

    @Test
    void aRefusedEventIsNotRetried() throws Exception {
        var s = setup();
        String connection = webhook(s, receiver(), List.of("information.answer_received"))
                .get("connection")
                .get("id")
                .asString();
        answer.set(400);
        var test = ok(s.owner().post(s.integrations() + "/" + connection + "/test", Map.of()))
                .body();
        assertThat(test.get("eventType").asString()).isEqualTo("integration.test");
        var failed = await().atMost(WAIT)
                .until(
                        () -> deliveries(s, connection).get(0),
                        node -> node.get("status").asString().equals("FAILED"));
        assertThat(failed.get("attempts").asInt()).isEqualTo(1);
        assertThat(failed.get("lastStatusCode").asInt()).isEqualTo(400);
    }

    @Test
    void connectionsOnlyReachPublicHttpsAddresses() {
        var s = setup();
        for (String url : List.of(
                "https://169.254.169.254/latest/meta-data",
                "https://10.0.0.8/hook",
                "https://192.168.1.5/hook",
                "http://203.0.113.10/hook",
                "https://user:pass@203.0.113.10/hook")) {
            var refused = s.owner()
                    .post(
                            s.integrations(),
                            Map.of(
                                    "provider",
                                    "WEBHOOK",
                                    "name",
                                    "x",
                                    "events",
                                    List.of("work.completed"),
                                    "settings",
                                    Map.of("url", url)),
                            key());
            assertThat(refused.status()).as(url).isEqualTo(400);
        }
        var bucketless = s.owner()
                .post(
                        s.integrations(),
                        Map.of(
                                "provider",
                                "S3_EXPORT",
                                "name",
                                "x",
                                "settings",
                                Map.of("endpoint", "https://10.1.1.1")),
                        key());
        assertThat(bucketless.status()).isEqualTo(400);
    }

    @Test
    void onlyManagersOfIntegrationsChangeThemAndSecretsRotateAndRevoke() throws Exception {
        var s = setup();
        String url = receiver();
        var created = webhook(s, url, List.of("information.answer_received"));
        String connection = created.get("connection").get("id").asString();
        String first = created.get("signingSecret").asString();

        String email = TestAccounts.newEmail();
        created(s.owner()
                .post(
                        org(s.organization()) + "/invitations",
                        Map.of("email", email, "role", "MANAGER"),
                        Map.of("Idempotency-Key", BrowserClient.key())));
        var manager = TestAccounts.signedIn(port, outbox, email);
        ok(manager.post(
                "/api/v1/invitations/acceptance",
                Map.of("token", outbox.latestToken(email, "invitation").orElseThrow())));
        assertThat(manager.get(s.integrations()).status())
                .as("integration.read")
                .isEqualTo(200);
        assertThat(manager.post(
                                s.integrations(),
                                Map.of(
                                        "provider",
                                        "WEBHOOK",
                                        "name",
                                        "x",
                                        "events",
                                        List.of("work.completed"),
                                        "settings",
                                        Map.of("url", url)),
                                key())
                        .status())
                .isEqualTo(403);
        assertThat(manager.delete(s.integrations() + "/" + connection).status()).isEqualTo(403);

        String second = ok(s.owner().post(s.integrations() + "/" + connection + "/rotation", Map.of()))
                .body()
                .get("signingSecret")
                .asString();
        assertThat(second).isNotEqualTo(first);
        ok(s.owner().post(s.integrations() + "/" + connection + "/test", Map.of()));
        await().atMost(WAIT).until(() -> !received.isEmpty());
        var hook = received.getFirst();
        String signature = hook.headers().get("signature");
        String timestamp = signature.substring(2, signature.indexOf(','));
        assertThat(signature).endsWith(",v1=" + hmac(second, timestamp + "." + hook.body()));

        assertThat(s.owner().delete(s.integrations() + "/" + connection).status())
                .isEqualTo(204);
        assertThat(ownerQuery(
                                "select status, credential_ciphertext is null from integration_connections where id = ?",
                                UUID.fromString(connection))
                        .getFirst())
                .containsExactly("REVOKED", true);
        assertThat(ok(s.owner().get(s.integrations())).body()).isEmpty();
        assertThat(auditActions(s.organization()))
                .contains("integration.credentials.rotated", "integration.connection.revoked");

        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(stranger.get(s.integrations()).status()).isEqualTo(404);
    }

    @Test
    void completedWorkIsExportedToTheBucketAndVerified() throws Exception {
        var s = setup();
        String bucket = "export-" + UUID.randomUUID().toString().substring(0, 8);
        try (var s3 = TestServices.s3Client()) {
            s3.createBucket(request -> request.bucket(bucket));
        }
        var created = created(s.owner()
                        .post(
                                s.integrations(),
                                Map.of(
                                        "provider",
                                        "S3_EXPORT",
                                        "name",
                                        "Records",
                                        "settings",
                                        Map.of(
                                                "endpoint",
                                                TestServices.s3Endpoint().toString(),
                                                "bucket",
                                                bucket,
                                                "prefix",
                                                "clients/",
                                                "pathStyle",
                                                true),
                                        "credentials",
                                        Map.of(
                                                "accessKey", TestServices.s3AccessKey(),
                                                "secretKey", TestServices.s3SecretKey())),
                                key()))
                .body();
        assertThat(created.has("signingSecret") && !created.get("signingSecret").isNull())
                .isFalse();
        var connection = created.get("connection");
        assertThat(connection.get("credentialHint").asString())
                .endsWith(TestServices.s3AccessKey()
                        .substring(TestServices.s3AccessKey().length() - 4));
        assertThat(connection.toString()).doesNotContain(TestServices.s3SecretKey());

        UUID certificate = requirement(s.owner(), s.organization(), s.work(), "Certificate", "DOCUMENT", true);
        byte[] pdf = pdf("certificate");
        created(s.owner().upload(s.workPath() + "/requirements/" + certificate + "/file", "cert.pdf", pdf, Map.of()));
        String item = requirementOf(work(s.owner(), s.organization(), s.work()), certificate)
                .get("currentItem")
                .get("id")
                .asString();
        ok(s.owner()
                .post(
                        s.workPath() + "/requirements/" + certificate + "/review",
                        Map.of("itemId", item, "decision", "ACCEPT")));
        await().atMost(WAIT)
                .until(() -> work(s.owner(), s.organization(), s.work())
                                .get("progress")
                                .get("openTasks")
                                .asInt()
                        == 0);
        ok(transition(s.owner(), s.organization(), s.work(), "RUNNING", "COMPLETED", null));

        String id = connection.get("id").asString();
        var exported = await().atMost(WAIT)
                .until(
                        () -> deliveries(s, id),
                        list -> !list.isEmpty()
                                && !list.get(0).get("status").asString().equals("PENDING"));
        assertThat(exported.get(0).get("status").asString())
                .as(exported.toString())
                .isEqualTo("DELIVERED");
        var completion = ok(s.owner().get(s.workPath() + "/completion")).body();
        try (var s3 = TestServices.s3Client()) {
            String manifest = s3.getObjectAsBytes(
                            get -> get.bucket(bucket).key("clients/" + s.work() + "/manifest.json"))
                    .asUtf8String();
            assertThat(manifest).isEqualTo(completion.get("manifest").asString());
            var keys = s3.listObjectsV2(list -> list.bucket(bucket).prefix("clients/" + s.work() + "/documents/"))
                    .contents();
            assertThat(keys)
                    .singleElement()
                    .satisfies(object -> assertThat(object.key()).endsWith("cert.pdf"));
            byte[] stored = s3.getObjectAsBytes(
                            get -> get.bucket(bucket).key(keys.getFirst().key()))
                    .asByteArray();
            assertThat(HexFormat.of()
                            .formatHex(MessageDigest.getInstance("SHA-256").digest(stored)))
                    .isEqualTo(HexFormat.of()
                            .formatHex(MessageDigest.getInstance("SHA-256").digest(pdf)));
        }
    }
}
