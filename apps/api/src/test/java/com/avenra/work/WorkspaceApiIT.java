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
 * The organization-wide views of the workspace (ADR-039, criterion W.2): requests across all work,
 * a reminder on request, the approvals inbox, evidence across all work and work search. Each stays
 * inside the organization and behind the same permissions as the per-work operations.
 */
@IntegrationTest
class WorkspaceApiIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(20);

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(BrowserClient owner, UUID organization, UUID work, UUID requirement, String client) {}

    @AfterEach
    void resetStub() {
        TestAiService.reset();
    }

    private Setup setup(String title) {
        var owner = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Workspace Ltd");
        String client = "client-" + UUID.randomUUID() + "@workspace.test";
        UUID clientId = id(created(
                owner.post(org(organization) + "/clients", Map.of("name", "Jane Doe", "email", client), key())));
        UUID work = id(created(owner.post(
                org(organization) + "/work", Map.of("title", title, "clientId", clientId.toString()), key())));
        ok(transition(owner, organization, work, "DRAFT", "READY", null));
        ok(transition(owner, organization, work, "READY", "RUNNING", null));
        UUID requirement = requirement(owner, organization, work, "Legal name", "TEXT", true);
        return new Setup(owner, organization, work, requirement, client);
    }

    private static UUID sendRequest(Setup s) {
        return id(created(s.owner()
                .post(
                        org(s.organization()) + "/work/" + s.work() + "/request-links",
                        Map.of(
                                "recipientEmail",
                                s.client(),
                                "requirementIds",
                                List.of(s.requirement().toString())),
                        key())));
    }

    private static JsonNode requests(BrowserClient person, UUID organization, String query) {
        return ok(person.get(org(organization) + "/request-links" + query)).body();
    }

    private static BrowserClient.Response remind(Setup s, UUID link) {
        return s.owner()
                .post(org(s.organization()) + "/work/" + s.work() + "/request-links/" + link + "/reminders", Map.of());
    }

    @Test
    void requestsAcrossAllWorkShowTheirWorkAndWhatWasAnswered() {
        var s = setup("Collect onboarding");
        var other = setup("Not theirs");
        UUID link = sendRequest(s);
        sendRequest(other);

        var listed = requests(s.owner(), s.organization(), "");
        assertThat(listed).hasSize(1);
        var request = listed.get(0);
        assertThat(request.get("id").asString()).isEqualTo(link.toString());
        assertThat(request.get("workId").asString()).isEqualTo(s.work().toString());
        assertThat(request.get("workTitle").asString()).isEqualTo("Collect onboarding");
        assertThat(request.get("answeredCount").asInt()).isZero();

        created(new BrowserClient(port)
                .post(
                        "/api/v1/client-requests/current/requirements/" + s.requirement() + "/value",
                        Map.of("value", "Jane Doe Ltd"),
                        token(linkToken(outbox, s.client()))));
        assertThat(requests(s.owner(), s.organization(), "?status=ACTIVE")
                        .get(0)
                        .get("answeredCount")
                        .asInt())
                .isEqualTo(1);
        assertThat(requests(s.owner(), s.organization(), "?status=REVOKED")).isEmpty();

        assertThat(s.owner()
                        .delete(org(s.organization()) + "/work/" + s.work() + "/request-links/" + link)
                        .status())
                .isEqualTo(204);
        assertThat(requests(s.owner(), s.organization(), "?status=REVOKED")).hasSize(1);
        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(stranger.get(org(s.organization()) + "/request-links").status())
                .isEqualTo(404);
    }

    @Test
    void aReminderOnRequestIsSentOnceAndNotTooOften() {
        var s = setup("Remind me");
        UUID link = sendRequest(s);
        var early = remind(s, link);
        assertThat(early.status()).isEqualTo(409);
        assertThat(early.code()).isEqualTo("REMINDER_TOO_SOON");

        ownerUpdate("update request_links set created_at = now() - interval '2 hours' where id = ?", link);
        var sent = remind(s, link);
        assertThat(sent.status()).isEqualTo(202);
        assertThat(remind(s, link).status())
                .as("asked again before the reminder went out: the same reminder, not a second one")
                .isIn(202, 409);
        var reminders = outbox.await(
                message -> message.to().equals(s.client()) && message.category().equals("request-reminder"));
        assertThat(reminders).hasSize(1);
        assertThat(reminders.getFirst().body()).contains("Legal name");
        await().atMost(WAIT)
                .until(() -> requests(s.owner(), s.organization(), "")
                                .get(0)
                                .get("remindersSent")
                                .asInt()
                        == 1);
        assertThat(remind(s, link).code()).isEqualTo("REMINDER_TOO_SOON");
        await().pollDelay(Duration.ofSeconds(2)).atMost(WAIT).until(() -> true);
        assertThat(outbox.now(message ->
                        message.to().equals(s.client()) && message.category().equals("request-reminder")))
                .hasSize(1);
        assertThat(auditActions(s.organization())).contains("work.request_link.reminder_requested");

        created(new BrowserClient(port)
                .post(
                        "/api/v1/client-requests/current/requirements/" + s.requirement() + "/value",
                        Map.of("value", "Jane Doe Ltd"),
                        token(linkToken(outbox, s.client()))));
        ownerUpdate("update request_links set last_reminded_at = now() - interval '2 hours' where id = ?", link);
        assertThat(remind(s, link).code()).isEqualTo("NOTHING_TO_REMIND");
        assertThat(s.owner()
                        .delete(org(s.organization()) + "/work/" + s.work() + "/request-links/" + link)
                        .status())
                .isEqualTo(204);
        assertThat(remind(s, link).code()).isEqualTo("REQUEST_LINK_INACTIVE");
    }

    @Test
    void theApprovalsInboxListsRunsWaitingForADecision() {
        var s = setup("Planned onboarding");
        ok(s.owner()
                .put(org(s.organization()) + "/ai/settings", Map.of("documentReading", false, "workPlanning", true)));
        String run = created(
                        s.owner().post(org(s.organization()) + "/work/" + s.work() + "/agent-runs", Map.of(), key()))
                .body()
                .get("id")
                .asString();
        var waiting = await().atMost(WAIT)
                .until(
                        () -> ok(s.owner().get(org(s.organization()) + "/agent-runs?status=AWAITING_APPROVAL"))
                                .body(),
                        list -> list.size() == 1);
        assertThat(waiting.get(0).get("id").asString()).isEqualTo(run);
        assertThat(waiting.get(0).get("workTitle").asString()).isEqualTo("Planned onboarding");
        assertThat(ok(s.owner().get(org(s.organization()) + "/agent-runs?status=COMPLETED"))
                        .body())
                .isEmpty();
        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(stranger.get(org(s.organization()) + "/agent-runs").status()).isEqualTo(404);
    }

    @Test
    void evidenceAcrossAllWorkAndWorkSearch() {
        var s = setup("Evidenced onboarding");
        UUID link = sendRequest(s);
        created(new BrowserClient(port)
                .post(
                        "/api/v1/client-requests/current/requirements/" + s.requirement() + "/value",
                        Map.of("value", "Jane Doe Ltd"),
                        token(linkToken(outbox, s.client()))));
        var evidence = await().atMost(WAIT)
                .until(
                        () -> ok(s.owner().get(org(s.organization()) + "/evidence"))
                                .body(),
                        list -> !list.isEmpty());
        assertThat(evidence.get(0).get("workId").asString()).isEqualTo(s.work().toString());
        assertThat(evidence.get(0).get("workTitle").asString()).isEqualTo("Evidenced onboarding");
        assertThat(ok(s.owner().get(org(s.organization()) + "/evidence?kind=ANSWER"))
                        .body()
                        .toString())
                .contains("\"kind\":\"ANSWER\"")
                .doesNotContain("\"kind\":\"VERIFICATION\"");
        assertThat(link).isNotNull();

        createWork(s.owner(), s.organization(), "Quarterly filing");
        var found =
                ok(s.owner().get(org(s.organization()) + "/work?q=QUARTERLY")).body();
        assertThat(found).hasSize(1);
        assertThat(found.get(0).get("title").asString()).isEqualTo("Quarterly filing");
        assertThat(ok(s.owner().get(org(s.organization()) + "/work?q=%25")).body())
                .as("the search text is literal")
                .isEmpty();
    }
}
