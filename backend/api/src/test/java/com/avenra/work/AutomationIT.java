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
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mail.MailAuthenticationException;
import software.amazon.awssdk.core.sync.RequestBody;
import tools.jackson.databind.JsonNode;

/**
 * Work execution through the API with the background worker running (Phase 4 criteria 4.8–4.13,
 * 4.16): automatic transitions, executions, review tasks, reminders, exceptions, delivery failures
 * and rescans. Sweeps are triggered by calling their functions, as the schedules would.
 */
@IntegrationTest
class AutomationIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(15);

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    @Autowired
    private JdbcClient jdbc;

    @Autowired
    private MeterRegistry registry;

    private record Setup(
            BrowserClient team,
            UUID organization,
            UUID work,
            UUID name,
            UUID number,
            UUID link,
            String token,
            String client) {

        String path() {
            return org(organization) + "/work/" + work;
        }
    }

    /** Running work with two required items, asked for through a link. */
    private Setup setup() {
        var team = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = team.createOrganization("Automation Ltd");
        UUID work = createWork(team, organization, "Onboard Globex");
        UUID name = requirement(team, organization, work, "Legal name", "TEXT", true);
        UUID number = requirement(team, organization, work, "Company number", "TEXT", true);
        ok(transition(team, organization, work, "DRAFT", "READY", null));
        ok(transition(team, organization, work, "READY", "RUNNING", null));
        String client = "client-" + UUID.randomUUID() + "@globex.test";
        var link = created(team.post(
                        org(organization) + "/work/" + work + "/request-links",
                        Map.of(
                                "recipientEmail",
                                client,
                                "requirementIds",
                                List.of(name.toString(), number.toString()),
                                "expiresInDays",
                                14),
                        key()))
                .body();
        return new Setup(
                team,
                organization,
                work,
                name,
                number,
                UUID.fromString(link.get("id").asString()),
                linkToken(outbox, client),
                client);
    }

    private String status(Setup s) {
        return work(s.team(), s.organization(), s.work()).get("status").asString();
    }

    private JsonNode lastTransition(Setup s) {
        var history = ok(s.team().get(s.path() + "/transitions")).body();
        return history.get(history.size() - 1);
    }

    private void answer(Setup s, UUID requirement, String value) {
        created(new BrowserClient(port)
                .post(
                        "/api/v1/client-requests/current/requirements/" + requirement + "/value",
                        Map.of("value", value),
                        token(s.token())));
    }

    private List<JsonNode> exceptions(Setup s) {
        var list = ok(s.team().get(org(s.organization()) + "/exceptions?workId=" + s.work()))
                .body();
        return java.util.stream.StreamSupport.stream(list.spliterator(), false).toList();
    }

    @Test
    void workWaitsForTheClientAndResumesWhenEverythingIsAnswered() {
        var s = setup();
        await().atMost(WAIT).until(() -> status(s).equals("WAITING_FOR_INFORMATION"));
        var waiting = lastTransition(s);
        assertThat(waiting.get("actorRule").asString()).isEqualTo("information.requested");
        assertThat(waiting.get("actorUserId").isNull()).isTrue();
        assertThat(work(s.team(), s.organization(), s.work())
                        .get("progress")
                        .get("nextAction")
                        .asString())
                .contains("client still has to provide 2 items");

        answer(s, s.name(), "Globex Corporation");
        // One item still missing: the work keeps waiting.
        await().atMost(WAIT).until(() -> tasks(s).size() == 1);
        assertThat(status(s)).isEqualTo("WAITING_FOR_INFORMATION");
        answer(s, s.number(), "12345678");
        await().atMost(WAIT).until(() -> status(s).equals("RUNNING"));
        assertThat(lastTransition(s).get("actorRule").asString()).isEqualTo("information.received");

        var executions = ok(s.team().get(s.path() + "/executions")).body();
        assertThat(executions.toString()).contains("information.received", "information.requested");
        var advance = executions.get(0);
        assertThat(advance.get("action").asString()).isEqualTo("work.advance");
        assertThat(advance.get("status").asString()).isEqualTo("COMPLETED");
        assertThat(advance.get("actor").get("type").asString()).isEqualTo("SYSTEM");
        assertThat(advance.get("result").get("to").asString()).isEqualTo("RUNNING");
        assertThat(registry.get("avenra.execution.completed")
                        .tag("action", "work.advance")
                        .counter()
                        .count())
                .isPositive();
    }

    private List<JsonNode> tasks(Setup s) {
        var tasks = work(s.team(), s.organization(), s.work()).get("tasks");
        return java.util.stream.StreamSupport.stream(tasks.spliterator(), false)
                .filter(task -> task.get("origin").asString().equals("SYSTEM"))
                .filter(task -> task.get("status").asString().equals("OPEN"))
                .toList();
    }

    @Test
    void answersCreateReviewTasksThatTheReviewCloses() {
        var s = setup();
        answer(s, s.name(), "Globex Corporation");
        answer(s, s.number(), "wrong");
        await().atMost(WAIT).until(() -> tasks(s).size() == 2);
        var task = tasks(s).stream()
                .filter(t -> t.get("about").get("id").asString().equals(s.name().toString()))
                .findFirst()
                .orElseThrow();
        assertThat(task.get("requiredAction").asString()).contains("Accept the answer for \"Legal name\"");
        assertThat(task.get("reason").asString()).isEqualTo("An answer arrived from the client");
        assertThat(task.get("choices").toString()).contains("ACCEPT", "REJECT");
        assertThat(task.get("dueAt").isNull()).isFalse();
        assertThat(task.get("about").get("type").asString()).isEqualTo("requirement");

        var byHand =
                s.team().put(s.path() + "/tasks/" + task.get("id").asString() + "/status", Map.of("status", "DONE"));
        assertThat(byHand.code()).isEqualTo("TASK_SYSTEM_MANAGED");

        await().atMost(WAIT).until(() -> status(s).equals("RUNNING"));
        review(s, s.name(), "ACCEPT", null);
        review(s, s.number(), "REJECT", "Use the registered number");
        assertThat(tasks(s)).isEmpty();
        // The rejected answer goes back to the client: the work waits again.
        await().atMost(WAIT).until(() -> status(s).equals("WAITING_FOR_INFORMATION"));
        assertThat(lastTransition(s).get("actorRule").asString()).isEqualTo("information.rejected");
    }

    private void review(Setup s, UUID requirement, String decision, String reason) {
        var current = requirementOf(work(s.team(), s.organization(), s.work()), requirement)
                .get("currentItem");
        var body = new java.util.HashMap<String, Object>(
                Map.of("itemId", current.get("id").asString(), "decision", decision));
        if (reason != null) {
            body.put("reason", reason);
        }
        ok(s.team().post(s.path() + "/requirements/" + requirement + "/review", body));
    }

    @Test
    void remindersFollowTheScheduleAndStopWhenAnswered() {
        var s = setup();
        sweepReminders();
        assertThat(remindersQueued(s.link())).as("too early for a reminder").isEqualTo(0L);

        ownerUpdate("update request_links set created_at = now() - interval '4 days' where id = ?", s.link());
        sweepReminders();
        assertThat(remindersQueued(s.link())).isEqualTo(1L);
        sweepReminders();
        assertThat(remindersQueued(s.link())).as("the same slot never twice").isEqualTo(1L);
        var first = await().atMost(WAIT)
                .until(() -> reminders(s), list -> list.size() == 1)
                .getFirst();
        assertThat(first.body()).contains("#" + s.token()).contains("Legal name", "Company number");
        await().atMost(WAIT).until(() -> link(s).get("remindersSent").asInt() == 1);
        sweepReminders();
        assertThat(remindersQueued(s.link()))
                .as("next reminder only after the interval")
                .isEqualTo(1L);

        // Three days later, with one item answered, the second reminder lists only the rest.
        answer(s, s.name(), "Globex Corporation");
        ownerUpdate("update request_links set last_reminded_at = now() - interval '4 days' where id = ?", s.link());
        sweepReminders();
        assertThat(remindersQueued(s.link())).isEqualTo(2L);
        var second = await().atMost(WAIT)
                .until(() -> reminders(s), list -> list.size() == 2)
                .getLast();
        assertThat(second.body()).contains("Company number").doesNotContain("Legal name");

        var executions = ok(s.team().get(s.path() + "/executions")).body();
        assertThat(executions.toString()).contains("request_link.remind");

        // Everything answered: no more reminders.
        answer(s, s.number(), "12345678");
        await().atMost(WAIT).until(() -> link(s).get("remindersSent").asInt() == 2);
        ownerUpdate("update request_links set last_reminded_at = now() - interval '4 days' where id = ?", s.link());
        sweepReminders();
        assertThat(remindersQueued(s.link())).isEqualTo(2L);
    }

    @Test
    void remindersStopAtTheMaximumAndForRevokedLinks() {
        var s = setup();
        ownerUpdate(
                "update request_links set created_at = now() - interval '4 days', reminders_sent = 3,"
                        + " last_reminded_at = now() - interval '4 days' where id = ?",
                s.link());
        sweepReminders();
        assertThat(remindersQueued(s.link())).isEqualTo(0L);
        var other = setup();
        ownerUpdate("update request_links set created_at = now() - interval '4 days' where id = ?", other.link());
        ok204(other.team().delete(other.path() + "/request-links/" + other.link()));
        sweepReminders();
        assertThat(remindersQueued(other.link())).isEqualTo(0L);
        assertThat(ownerQuery("select token_ciphertext is null from request_links where id = ?", other.link())
                        .getFirst()
                        .getFirst())
                .as("revoking erases the token copy")
                .isEqualTo(true);
    }

    @Test
    void anExpiredIncompleteRequestRaisesAnExceptionThatPeopleResolve() {
        var s = setup();
        ownerUpdate(
                "update request_links set created_at = now() - interval '20 days', expires_at = now() -"
                        + " interval '1 minute' where id = ?",
                s.link());
        sweepExpired();
        await().atMost(WAIT).until(() -> !exceptions(s).isEmpty());
        sweepExpired();
        // Other tests' links share the database; this link was handled exactly once.
        assertThat(ownerQuery(
                                "select count(*) from jobs where type = 'request_link.expired' and idempotency_key = ?",
                                s.link().toString())
                        .getFirst()
                        .getFirst())
                .isEqualTo(1L);
        var exception = exceptions(s).getFirst();
        assertThat(exception.get("type").asString()).isEqualTo("REQUEST_EXPIRED_INCOMPLETE");
        assertThat(registry.get("avenra.exception.raised")
                        .tag("type", "REQUEST_EXPIRED_INCOMPLETE")
                        .counter()
                        .count())
                .isPositive();
        assertThat(exception.get("description").asString()).contains("2 required items still missing");
        assertThat(exception.get("status").asString()).isEqualTo("OPEN");
        assertThat(ownerQuery("select token_ciphertext is null from request_links where id = ?", s.link())
                        .getFirst()
                        .getFirst())
                .isEqualTo(true);
        assertThat(work(s.team(), s.organization(), s.work())
                        .get("progress")
                        .get("openExceptions")
                        .asInt())
                .isEqualTo(1);

        String path =
                org(s.organization()) + "/exceptions/" + exception.get("id").asString();
        assertThat(s.team()
                        .post(path + "/transitions", Map.of("to", "RESOLVED", "expectedStatus", "OPEN"))
                        .status())
                .isEqualTo(400);
        ok(s.team().post(path + "/transitions", Map.of("to", "IN_PROGRESS", "expectedStatus", "OPEN")));
        var resolved = ok(s.team()
                        .post(
                                path + "/transitions",
                                Map.of(
                                        "to",
                                        "RESOLVED",
                                        "expectedStatus",
                                        "IN_PROGRESS",
                                        "resolution",
                                        "Called the client; new link sent")))
                .body();
        assertThat(resolved.get("resolvedAt").isNull()).isFalse();
        assertThat(resolved.get("allowedTransitions").size()).isZero();
        assertThat(s.team()
                        .post(path + "/transitions", Map.of("to", "OPEN", "expectedStatus", "RESOLVED"))
                        .code())
                .isEqualTo("INVALID_TRANSITION");
        assertThat(auditActions(s.organization())).contains("work.exception.raised", "work.exception.transitioned");

        // Another tenant cannot see it.
        var mallory = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID malloryOrg = mallory.createOrganization("Mallory");
        assertThat(mallory.get(path).status()).isEqualTo(404);
        assertThat(mallory.get(org(malloryOrg) + "/exceptions/"
                                + exception.get("id").asString())
                        .status())
                .isEqualTo(404);
    }

    @Test
    void overdueWorkRaisesOneException() {
        var team = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = team.createOrganization("Late Ltd");
        UUID work = id(created(team.post(
                org(organization) + "/work", Map.of("title", "Year end", "dueAt", "2026-01-31T17:00:00Z"), key())));
        assertThat(jdbc.sql("select sweep_overdue_work()").query(Integer.class).single())
                .isPositive();
        await().atMost(WAIT)
                .until(() -> ok(team.get(org(organization) + "/exceptions?open=true"))
                                .body()
                                .size()
                        == 1);
        assertThat(jdbc.sql("select sweep_overdue_work()").query(Integer.class).single())
                .isZero();
        var exception = ok(team.get(org(organization) + "/exceptions?workId=" + work))
                .body()
                .get(0);
        assertThat(exception.get("type").asString()).isEqualTo("WORK_OVERDUE");
        assertThat(exception.get("severity").asString()).isEqualTo("HIGH");
    }

    @Test
    void undeliverableEmailRaisesAnException() {
        var s = setup();
        await().atMost(WAIT).until(() -> status(s).equals("WAITING_FOR_INFORMATION"));
        outbox.failNext(new MailAuthenticationException("rejected"));
        created(s.team()
                .post(
                        s.path() + "/request-links",
                        Map.of(
                                "recipientEmail",
                                "second-" + s.client(),
                                "requirementIds",
                                List.of(s.name().toString()),
                                "expiresInDays",
                                7),
                        key()));
        await().atMost(WAIT)
                .until(() -> ok(s.team().get(org(s.organization()) + "/exceptions?open=true"))
                        .body()
                        .toString()
                        .contains("DELIVERY_FAILED"));
        outbox.clearFailures();
    }

    @Test
    void aRescanFindsMalwareInAStoredFileAndQuarantinesIt() throws Exception {
        var team = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = team.createOrganization("Rescan Ltd");
        UUID work = createWork(team, organization, "Statements");
        UUID statement = requirement(team, organization, work, "Bank statement", "DOCUMENT", true);
        var item = created(team.upload(
                        org(organization) + "/work/" + work + "/requirements/" + statement + "/file",
                        "statement.txt",
                        "Balance 100".getBytes(),
                        Map.of()))
                .body();
        UUID documentId = UUID.fromString(item.get("document").get("documentId").asString());
        String key = "org/" + organization + "/documents/" + documentId + "/v1";
        // New signatures now recognise the stored file; simulated by replacing its content. The sweep
        // is asked for every version scanned before now (the schedule uses 7 days).
        try (var s3 = TestServices.s3Client()) {
            // Same request shape as the application: an explicit SHA-256 checksum.
            String sha256 = java.util.Base64.getEncoder()
                    .encodeToString(
                            java.security.MessageDigest.getInstance("SHA-256").digest(eicar()));
            s3.putObject(
                    r -> r.bucket(TestServices.S3_BUCKET).key(key).checksumSHA256(sha256),
                    RequestBody.fromBytes(eicar()));
        }
        assertThat(jdbc.sql("select sweep_rescans(0, 500)").query(Integer.class).single())
                .isPositive();

        await().atMost(WAIT)
                .until(() -> ownerQuery("select scan_status from document_versions where document_id = ?", documentId)
                        .getFirst()
                        .getFirst()
                        .equals("INFECTED"));
        var row = ownerQuery(
                        "select storage_key, scan_signature from document_versions where document_id = ?", documentId)
                .getFirst();
        assertThat((String) row.get(0)).isEqualTo("quarantine/" + key);
        assertThat((String) row.get(1)).containsIgnoringCase("eicar");
        await().atMost(WAIT).until(() -> {
            try (var s3 = TestServices.s3Client()) {
                s3.headObject(r -> r.bucket(TestServices.S3_BUCKET).key(key));
                return false;
            } catch (software.amazon.awssdk.services.s3.model.S3Exception gone) {
                return true;
            }
        });
        var download = team.get(org(organization) + "/documents/" + documentId + "/versions/1/content");
        assertThat(download.code()).isEqualTo("DOCUMENT_UNAVAILABLE");
        var exceptions =
                ok(team.get(org(organization) + "/exceptions?workId=" + work)).body();
        assertThat(exceptions.get(0).get("type").asString()).isEqualTo("MALWARE_FOUND");
        assertThat(auditActions(organization)).contains("document.malware_detected");
    }

    // --- helpers -------------------------------------------------------------

    private int sweepReminders() {
        return jdbc.sql("select sweep_reminders(259200, 259200, 3)")
                .query(Integer.class)
                .single();
    }

    /** Reminder jobs queued for one link so far (other tests' links share the database). */
    private long remindersQueued(UUID link) {
        return (Long) ownerQuery(
                        "select count(*) from jobs where type = 'request_link.remind' and idempotency_key like ?",
                        link + ":%")
                .getFirst()
                .getFirst();
    }

    private int sweepExpired() {
        return jdbc.sql("select sweep_expired_links()").query(Integer.class).single();
    }

    private List<com.avenra.platform.email.EmailMessage> reminders(Setup s) {
        return outbox.now(
                message -> message.to().equals(s.client()) && message.category().equals("request-reminder"));
    }

    private JsonNode link(Setup s) {
        var links = ok(s.team().get(s.path() + "/request-links")).body();
        for (JsonNode link : links) {
            if (link.get("id").asString().equals(s.link().toString())) {
                return link;
            }
        }
        throw new AssertionError("no link");
    }

    private static void ok204(BrowserClient.Response response) {
        assertThat(response.status()).isEqualTo(204);
    }
}
