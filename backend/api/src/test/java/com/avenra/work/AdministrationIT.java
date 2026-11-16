package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

/**
 * Administration through the API (Phase 10 criteria 10.2–10.7): audit history browsed, filtered and
 * exported by those allowed to; the organization's settings; the roles matrix; usage and health
 * from the modules that own the data. Nobody sees another organization's administration.
 */
@IntegrationTest
class AdministrationIT extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(BrowserClient owner, UUID ownerId, UUID organization) {}

    private Setup setup() {
        String email = TestAccounts.newEmail();
        var owner = TestAccounts.signedIn(port, outbox, email);
        UUID organization = owner.createOrganization("Administered Ltd");
        UUID ownerId = (UUID) ownerQuery("select id from users where email_normalized = ?", email.toLowerCase())
                .getFirst()
                .getFirst();
        return new Setup(owner, ownerId, organization);
    }

    private BrowserClient member(Setup s, String role) {
        String email = TestAccounts.newEmail();
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

    private static void recordEvents(UUID organization, UUID actor, String action, int count, OffsetDateTime start) {
        for (int i = 0; i < count; i++) {
            ownerUpdate(
                    "insert into audit_events (id, occurred_at, organization_id, actor_user_id, action, details)"
                            + " values (?, ?, ?, ?, ?, '{\"n\": " + i + "}'::jsonb)",
                    UUID.randomUUID(),
                    // Several events share a time, so the cursor must order by id as well.
                    start.plusSeconds(i / 3),
                    organization,
                    actor,
                    action);
        }
    }

    private static JsonNode page(BrowserClient person, UUID organization, String query) {
        return ok(person.get(org(organization) + "/audit-events" + query)).body();
    }

    @Test
    void auditHistoryIsPagedNewestFirstWithoutGapsOrRepeats() {
        var s = setup();
        recordEvents(
                s.organization(),
                s.ownerId(),
                "test.paged",
                70,
                OffsetDateTime.now().minusHours(1));
        var first = page(s.owner(), s.organization(), "?action=test.");
        assertThat(first.get("events")).hasSize(50);
        assertThat(first.get("nextCursor").isString()).isTrue();
        var second = page(
                s.owner(),
                s.organization(),
                "?action=test.&cursor=" + first.get("nextCursor").asString());
        assertThat(second.get("events")).hasSize(20);
        assertThat(second.path("nextCursor").isString()).isFalse();

        var ids = new HashSet<String>();
        var times = new ArrayList<OffsetDateTime>();
        for (var events : List.of(first.get("events"), second.get("events"))) {
            for (var event : events) {
                ids.add(event.get("id").asString());
                times.add(OffsetDateTime.parse(event.get("occurredAt").asString()));
                assertThat(event.get("action").asString()).isEqualTo("test.paged");
                assertThat(event.get("actorName").asString()).isNotBlank();
            }
        }
        assertThat(ids).hasSize(70);
        for (int i = 1; i < times.size(); i++) {
            assertThat(times.get(i)).isBeforeOrEqualTo(times.get(i - 1));
        }
        assertThat(s.owner()
                        .get(org(s.organization()) + "/audit-events?cursor=not-a-cursor")
                        .status())
                .isEqualTo(400);
    }

    @Test
    void auditHistoryIsFilteredByActionPersonAndTime() {
        var s = setup();
        var colleague = member(s, "ADMIN");
        UUID colleagueId = UUID.fromString(
                ok(colleague.get("/api/v1/auth/session")).body().get("id").asString());
        var now = OffsetDateTime.now();
        recordEvents(s.organization(), s.ownerId(), "test.old", 2, now.minusDays(3));
        recordEvents(s.organization(), colleagueId, "test.recent", 3, now.minusMinutes(30));

        assertThat(page(s.owner(), s.organization(), "?action=test.recent").get("events"))
                .hasSize(3);
        assertThat(page(s.owner(), s.organization(), "?action=test.&actorUserId=" + colleagueId)
                        .get("events"))
                .hasSize(3);
        String since = now.minusDays(1).toInstant().toString();
        assertThat(page(s.owner(), s.organization(), "?action=test.&from=" + since)
                        .get("events"))
                .hasSize(3);
        assertThat(page(s.owner(), s.organization(), "?action=test.&to=" + since)
                        .get("events"))
                .hasSize(2);
        assertThat(page(s.owner(), s.organization(), "?action=%25").get("events"))
                .as("the prefix is literal, not a pattern")
                .isEmpty();
        assertThat(s.owner()
                        .get(org(s.organization()) + "/audit-events?from=" + since + "&to=" + since)
                        .status())
                .isEqualTo(400);
        // The organization's own actions are in its history too.
        assertThat(page(s.owner(), s.organization(), "?action=organization.").toString())
                .contains("organization.created");
    }

    @Test
    void theExportIsCsvSafeToOpenInASpreadsheet() {
        var s = setup();
        ownerUpdate(
                "insert into audit_events (id, occurred_at, organization_id, actor_user_id, action, request_id,"
                        + " details) values (?, now(), ?, ?, 'test.export', ?, '{\"note\": \"a \\\"quoted\\\" value\"}')",
                UUID.randomUUID(),
                s.organization(),
                s.ownerId(),
                "=HYPERLINK(\"https://example.test\")");
        var response = s.owner().get(org(s.organization()) + "/audit-events/export?action=test.export");
        assertThat(response.status()).isEqualTo(200);
        assertThat(response.raw().headers().firstValue("Content-Type").orElseThrow())
                .startsWith("text/csv");
        assertThat(response.raw().headers().firstValue("Content-Disposition").orElseThrow())
                .contains("attachment");
        var lines = response.raw().body().split("\r\n");
        assertThat(lines).hasSize(2);
        assertThat(lines[0])
                .isEqualTo("occurredAt,action,actorUserId,actorName,resourceType,resourceId,requestId,details");
        assertThat(lines[1])
                .contains("\"test.export\"")
                .contains("\"'=HYPERLINK(\"\"https://example.test\"\")\"")
                .contains("\"" + s.ownerId() + "\"");
    }

    @Test
    void onlyThoseAllowedReadAdministration() {
        var s = setup();
        var manager = member(s, "MANAGER");
        var viewer = member(s, "VIEWER");
        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID theirs = stranger.createOrganization("Elsewhere Ltd");
        recordEvents(theirs, null, "test.elsewhere", 1, OffsetDateTime.now());

        assertThat(manager.get(org(s.organization()) + "/audit-events").status())
                .isEqualTo(403);
        assertThat(manager.get(org(s.organization()) + "/audit-events/export").status())
                .isEqualTo(403);
        assertThat(manager.get(org(s.organization()) + "/administration").status())
                .isEqualTo(403);
        assertThat(viewer.get(org(s.organization()) + "/roles").status()).isEqualTo(200);
        assertThat(stranger.get(org(s.organization()) + "/audit-events").status())
                .isEqualTo(404);
        assertThat(stranger.get(org(s.organization()) + "/administration").status())
                .isEqualTo(404);
        assertThat(s.owner().get(org(theirs) + "/audit-events").status()).isEqualTo(404);
        assertThat(page(s.owner(), s.organization(), "?action=test.").get("events"))
                .as("another organization's history is never included")
                .isEmpty();
    }

    @Test
    void theRolesMatrixIsTheOneEnforced() {
        var s = setup();
        var roles = ok(s.owner().get(org(s.organization()) + "/roles")).body();
        assertThat(roles).hasSize(5);
        assertThat(roles.get(0).get("role").asString()).isEqualTo("OWNER");
        assertThat(roles.get(0).get("permissions").toString()).contains("billing.manage", "audit.read");
        var viewer = roles.get(4);
        assertThat(viewer.get("role").asString()).isEqualTo("VIEWER");
        assertThat(viewer.get("permissions").toString())
                .contains("work.read")
                .doesNotContain("work.update")
                .doesNotContain("audit.read");
        assertThat(roles.get(1).get("permissions").toString())
                .as("only owners decide on AI and billing")
                .doesNotContain("ai.manage")
                .doesNotContain("billing.manage");
    }

    @Test
    void settingsChangeTheDefaultRequestLinkValidity() {
        var s = setup();
        assertThat(ok(s.owner().get(org(s.organization())))
                        .body()
                        .get("requestLinkDays")
                        .asInt())
                .isEqualTo(14);
        var updated = ok(s.owner().patch(org(s.organization()), Map.of("requestLinkDays", 30)))
                .body();
        assertThat(updated.get("requestLinkDays").asInt()).isEqualTo(30);
        assertThat(updated.get("name").asString()).isEqualTo("Administered Ltd");
        assertThat(auditActions(s.organization())).contains("organization.settings_changed");
        assertThat(s.owner()
                        .patch(org(s.organization()), Map.of("requestLinkDays", 91))
                        .status())
                .isEqualTo(400);
        assertThat(s.owner()
                        .patch(org(s.organization()), Map.of("requestLinkDays", 0))
                        .status())
                .isEqualTo(400);
        var member = member(s, "MEMBER");
        assertThat(member.patch(org(s.organization()), Map.of("requestLinkDays", 5))
                        .status())
                .isEqualTo(403);

        UUID work = createWork(s.owner(), s.organization(), "Settings");
        ok(transition(s.owner(), s.organization(), work, "DRAFT", "READY", null));
        ok(transition(s.owner(), s.organization(), work, "READY", "RUNNING", null));
        UUID name = requirement(s.owner(), s.organization(), work, "Legal name", "TEXT", true);
        var link = created(s.owner()
                        .post(
                                org(s.organization()) + "/work/" + work + "/request-links",
                                Map.of(
                                        "recipientEmail",
                                        "client-" + UUID.randomUUID() + "@administered.test",
                                        "requirementIds",
                                        List.of(name.toString())),
                                key()))
                .body();
        var validity = Duration.between(
                OffsetDateTime.parse(link.get("createdAt").asString()),
                OffsetDateTime.parse(link.get("expiresAt").asString()));
        assertThat(validity).isEqualTo(Duration.ofDays(30));
    }

    @Test
    void usageAndHealthComeFromTheModulesThatOwnTheData() {
        var s = setup();
        createWork(s.owner(), s.organization(), "Counted");
        var overview =
                ok(s.owner().get(org(s.organization()) + "/administration")).body();
        assertThat(figure(overview.get("usage"), "members")).isEqualTo(1);
        assertThat(figure(overview.get("usage"), "work.total")).isEqualTo(1);
        assertThat(figure(overview.get("usage"), "documents")).isZero();
        assertThat(overview.get("usage").toString()).contains("ai.calls_today", "integrations.active");
        assertThat(overview.get("health").get("status").asString()).isEqualTo("OK");
        assertThat(overview.get("health").get("checks").toString())
                .contains("jobs.failed", "email.failed", "documents.quarantined", "exceptions.high_open");

        ownerUpdate(
                "insert into jobs (id, organization_id, type, payload, status, attempts, max_attempts, run_at,"
                        + " created_at, updated_at, finished_at) values (gen_random_uuid(), ?, 'test.failing', '{}',"
                        + " 'DEAD', 3, 3, now(), now(), now(), now())",
                s.organization());
        var attention =
                ok(s.owner().get(org(s.organization()) + "/administration")).body();
        assertThat(attention.get("health").get("status").asString()).isEqualTo("ATTENTION");
        var failed = check(attention.get("health").get("checks"), "jobs.failed");
        assertThat(failed.get("value").asLong()).isEqualTo(1);
        assertThat(failed.get("status").asString()).isEqualTo("ATTENTION");
    }

    private static long figure(JsonNode figures, String key) {
        for (var figure : figures) {
            if (figure.get("key").asString().equals(key)) {
                return figure.get("value").asLong();
            }
        }
        throw new AssertionError("no figure " + key + " in " + figures);
    }

    private static JsonNode check(JsonNode checks, String key) {
        for (var check : checks) {
            if (check.get("key").asString().equals(key)) {
                return check;
            }
        }
        throw new AssertionError("no check " + key + " in " + checks);
    }
}
