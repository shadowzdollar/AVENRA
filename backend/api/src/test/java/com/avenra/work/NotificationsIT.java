package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestAiService;
import com.avenra.TestOutbox;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

/**
 * Notifications through the API (Phase 9 criteria 9.2–9.9): the right people are told once, in the
 * app and by email as they chose; unattended high-severity exceptions are escalated to owners; a
 * person only ever sees their own notifications.
 */
@IntegrationTest
class NotificationsIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(20);

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(BrowserClient owner, String ownerEmail, UUID organization, UUID work) {}

    @AfterEach
    void resetStub() {
        TestAiService.reset();
    }

    private Setup setup() {
        String email = TestAccounts.newEmail();
        var owner = TestAccounts.signedIn(port, outbox, email);
        UUID organization = owner.createOrganization("Notified Ltd");
        UUID work = createWork(owner, organization, "Onboarding");
        ok(transition(owner, organization, work, "DRAFT", "READY", null));
        ok(transition(owner, organization, work, "READY", "RUNNING", null));
        return new Setup(owner, email, organization, work);
    }

    private BrowserClient member(Setup s, String role, String email) {
        created(s.owner()
                .post(
                        org(s.organization()) + "/invitations",
                        Map.of("email", email, "role", role),
                        Map.of("Idempotency-Key", BrowserClient.key())));
        var person = TestAccounts.signedIn(port, outbox, email);
        ok(person.post(
                "/api/v1/invitations/acceptance",
                Map.of("token", outbox.latestToken(email, "invitation").orElseThrow())));
        return person;
    }

    private static JsonNode notifications(BrowserClient person) {
        return ok(person.get("/api/v1/notifications")).body();
    }

    private static JsonNode awaitNotification(BrowserClient person, String category) {
        return await().atMost(WAIT)
                .until(
                        () -> notifications(person),
                        list -> list.get("notifications").toString().contains("\"category\":\"" + category + "\""));
    }

    private void makeOverdue(Setup s) {
        ownerUpdate("update work set due_at = now() - interval '1 day' where id = ?", s.work());
        ownerQuery("select sweep_overdue_work()");
    }

    @Test
    void anExceptionTellsTheWorksOwnerInTheAppAndByEmailOnce() {
        var s = setup();
        makeOverdue(s);
        var list = awaitNotification(s.owner(), "exception");
        var notice = list.get("notifications").get(0);
        assertThat(list.get("unread").asInt()).isEqualTo(1);
        assertThat(notice.get("title").asString()).contains("Onboarding").contains("Notified Ltd");
        assertThat(notice.get("link").asString())
                .isEqualTo(org(s.organization()).replace("/api/v1", "") + "/work/" + s.work());
        var emails = outbox.await(message ->
                message.to().equals(s.ownerEmail()) && message.category().equals("notification-exception"));
        assertThat(emails).hasSize(1);
        assertThat(emails.getFirst().body()).contains("/work/" + s.work());

        // Replaying the same fact tells nobody again.
        ownerUpdate(
                "insert into jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,"
                        + " created_at, updated_at) select gen_random_uuid(), organization_id, type, payload, 'QUEUED', 3,"
                        + " now(), 'replay:' || id, now(), now() from jobs where type = 'notification.notify'"
                        + " and organization_id = ?",
                s.organization());
        await().pollDelay(Duration.ofSeconds(2)).atMost(WAIT).until(() -> true);
        assertThat(notifications(s.owner()).get("notifications").size()).isEqualTo(1);
        assertThat(outbox.now(message -> message.to().equals(s.ownerEmail())
                        && message.category().equals("notification-exception")))
                .hasSize(1);
    }

    @Test
    void preferencesDecideOnEmailButNotOnTheInAppNotification() {
        var s = setup();
        var defaults = ok(s.owner().get("/api/v1/account/notification-preferences"))
                .body()
                .get("preferences");
        assertThat(defaults.toString())
                .contains("{\"category\":\"answer\",\"email\":false,\"inApp\":true}")
                .contains("{\"category\":\"exception\",\"email\":true,\"inApp\":true}");
        ok(s.owner()
                .put(
                        "/api/v1/account/notification-preferences",
                        Map.of("preferences", List.of(Map.of("category", "exception", "email", false)))));
        makeOverdue(s);
        awaitNotification(s.owner(), "exception");
        assertThat(outbox.now(message -> message.to().equals(s.ownerEmail())
                        && message.category().startsWith("notification-")))
                .isEmpty();
        assertThat(auditActions(s.organization())).isNotNull();
    }

    @Test
    void aClientsAnswerTellsTheOwnerInTheAppOnlyByDefault() {
        var s = setup();
        UUID name = requirement(s.owner(), s.organization(), s.work(), "Legal name", "TEXT", true);
        String client = "client-" + UUID.randomUUID() + "@notified.test";
        created(s.owner()
                .post(
                        org(s.organization()) + "/work/" + s.work() + "/request-links",
                        Map.of(
                                "recipientEmail",
                                client,
                                "requirementIds",
                                List.of(name.toString()),
                                "expiresInDays",
                                7),
                        key()));
        String token = linkToken(outbox, client);
        created(new BrowserClient(port)
                .post(
                        "/api/v1/client-requests/current/requirements/" + name + "/value",
                        Map.of("value", "Jane Doe Ltd"),
                        token(token)));
        var notice = awaitNotification(s.owner(), "answer").get("notifications").get(0);
        assertThat(notice.get("title").asString()).contains("Legal name");
        assertThat(notice.toString())
                .as("answer values are not copied into notifications")
                .doesNotContain("Jane Doe Ltd");
        assertThat(outbox.now(message -> message.to().equals(s.ownerEmail())
                        && message.category().equals("notification-answer")))
                .isEmpty();
    }

    @Test
    void peopleReadOnlyTheirOwnNotifications() {
        var s = setup();
        var colleague = member(s, "MEMBER", TestAccounts.newEmail());
        makeOverdue(s);
        String id = awaitNotification(s.owner(), "exception")
                .get("notifications")
                .get(0)
                .get("id")
                .asString();
        assertThat(notifications(colleague).get("notifications"))
                .as("the work's owner is told, not every member")
                .isEmpty();
        assertThat(colleague
                        .post("/api/v1/notifications/" + id + "/read", Map.of())
                        .status())
                .isEqualTo(404);
        assertThat(s.owner()
                        .post("/api/v1/notifications/" + id + "/read", Map.of())
                        .status())
                .isEqualTo(204);
        assertThat(notifications(s.owner()).get("unread").asInt()).isZero();
        assertThat(notifications(s.owner()).get("notifications").get(0).has("readAt"))
                .isTrue();
        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(notifications(stranger).get("notifications")).isEmpty();
        assertThat(s.owner().post("/api/v1/notifications/read", Map.of()).status())
                .isEqualTo(204);
    }

    @Test
    void anUnattendedHighSeverityExceptionIsEscalatedOnceToOwners() {
        var s = setup();
        makeOverdue(s);
        awaitNotification(s.owner(), "exception");
        ownerUpdate("update work_exceptions set created_at = now() - interval '25 hours' where work_id = ?", s.work());
        ownerQuery("select sweep_unattended_exceptions(86400)");
        var escalated = awaitNotification(s.owner(), "escalation");
        assertThat(escalated.get("notifications").get(0).get("title").asString())
                .startsWith("Unattended");
        ownerQuery("select sweep_unattended_exceptions(86400)");
        await().pollDelay(Duration.ofSeconds(2)).atMost(WAIT).until(() -> true);
        assertThat(notifications(s.owner()).get("notifications").toString().split("\"escalation\"", -1))
                .as("escalated once")
                .hasSize(2);
    }

    @Test
    void aPlanWaitingForApprovalTellsTheApprovers() {
        var s = setup();
        var viewer = member(s, "VIEWER", TestAccounts.newEmail());
        ok(s.owner()
                .put(org(s.organization()) + "/ai/settings", Map.of("documentReading", false, "workPlanning", true)));
        created(s.owner().post(org(s.organization()) + "/work/" + s.work() + "/agent-runs", Map.of(), key()));
        var notice =
                awaitNotification(s.owner(), "approval").get("notifications").get(0);
        assertThat(notice.get("title").asString()).isEqualTo("A plan waits for your decision");
        assertThat(notifications(viewer).get("notifications"))
                .as("viewers cannot approve")
                .isEmpty();
    }
}
