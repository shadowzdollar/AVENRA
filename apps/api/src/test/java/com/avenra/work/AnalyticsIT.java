package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

/**
 * Analytics through the API (Phase 12 criteria 12.2–12.6): what an organization sees about its own
 * work, compared with the period before; only those allowed see it; nothing of another
 * organization and no content is included; operators get counts only.
 */
@IntegrationTest
class AnalyticsIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(20);

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(BrowserClient owner, UUID organization) {}

    private Setup setup(String name) {
        var owner = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        return new Setup(owner, owner.createOrganization(name));
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

    private static UUID work(Setup s, String title, String type) {
        return id(
                created(s.owner().post(org(s.organization()) + "/work", Map.of("title", title, "type", type), key())));
    }

    private static JsonNode report(BrowserClient person, UUID organization, int days) {
        return ok(person.get(org(organization) + "/analytics?days=" + days)).body();
    }

    private static JsonNode metric(JsonNode report, String key) {
        for (var metric : report.get("metrics")) {
            if (metric.get("key").asString().equals(key)) {
                return metric;
            }
        }
        throw new AssertionError("no metric " + key + " in " + report.get("metrics"));
    }

    private static JsonNode series(JsonNode report, String key) {
        for (var line : report.get("series")) {
            if (line.get("key").asString().equals(key)) {
                return line;
            }
        }
        throw new AssertionError("no series " + key);
    }

    /** Completes work directly, as the completion flow would have, at a chosen time. */
    private static void complete(UUID work, String createdAgo, String completedAgo) {
        ownerUpdate(
                "update work set status = 'COMPLETED', created_at = now() - cast(? as interval),"
                        + " completed_at = now() - cast(? as interval) where id = ?",
                createdAgo,
                completedAgo,
                work);
    }

    @Test
    void operationalAndWorkflowMetricsDescribeTheOrganizationsOwnWork() {
        var s = setup("Measured Ltd");
        var elsewhere = setup("Elsewhere Ltd");
        UUID done = work(s, "Secret client onboarding", "Onboarding");
        UUID dropped = work(s, "Dropped", "Onboarding");
        work(s, "Still open", "Audit");
        UUID earlier = work(s, "Last month", "Onboarding");
        complete(done, "3 hours", "1 hour");
        complete(earlier, "45 days", "40 days");
        ownerUpdate("update work set status = 'CANCELLED' where id = ?", dropped);
        ownerUpdate(
                "insert into work_transitions (id, organization_id, work_id, from_status, to_status, occurred_at)"
                        + " values (gen_random_uuid(), ?, ?, 'DRAFT', 'CANCELLED', now())",
                s.organization(),
                dropped);
        ownerUpdate(
                "insert into work_exceptions (id, organization_id, work_id, type, severity, description, source_type,"
                        + " source_id, status, resolution, created_at, updated_at, resolved_at) values (gen_random_uuid(), ?, ?,"
                        + " 'HUMAN_REQUIRED', 'LOW', 'Needed a person', 'work', 'x', 'RESOLVED', 'Done', now() - interval"
                        + " '2 hours', now(), now() - interval '90 minutes')",
                s.organization(),
                done);
        complete(work(elsewhere, "Not theirs", "Onboarding"), "2 hours", "1 hour");

        var report = report(s.owner(), s.organization(), 30);
        assertThat(report.get("days").asInt()).isEqualTo(30);
        var completed = metric(report, "work.completed");
        assertThat(completed.get("value").asDouble())
                .as("another organization's work never counts")
                .isEqualTo(1);
        assertThat(completed.get("previous").asDouble()).isEqualTo(1);
        assertThat(metric(report, "work.created").get("value").asDouble()).isEqualTo(3);
        assertThat(metric(report, "work.completion_rate").get("value").asDouble())
                .isEqualTo(50);
        assertThat(metric(report, "work.completion_time_median").get("value").asDouble())
                .isEqualTo(7200);
        assertThat(metric(report, "work.intervention_rate").get("value").asDouble())
                .isEqualTo(100);
        assertThat(metric(report, "exceptions.resolution_time_median")
                        .get("value")
                        .asDouble())
                .isEqualTo(1800);
        assertThat(metric(report, "requests.response_time_median").path("value").isNumber())
                .as("nothing to measure")
                .isFalse();

        var weekly = series(report, "work.completed_weekly");
        assertThat(weekly.get("interval").asString()).isEqualTo("WEEK");
        long total = 0;
        for (var point : weekly.get("points")) {
            total += point.get("value").asLong();
        }
        assertThat(total).isEqualTo(1);

        var types = report.get("workTypes");
        assertThat(types.get(0).get("type").asString()).isEqualTo("Onboarding");
        assertThat(types.get(0).get("created").asLong()).isEqualTo(2);
        assertThat(types.get(0).get("completed").asLong()).isEqualTo(1);
        assertThat(types.get(0).get("completionRate").asDouble()).isEqualTo(50);
        assertThat(report.toString())
                .as("analytics carry counts and durations, never titles or descriptions")
                .doesNotContain("Secret client onboarding")
                .doesNotContain("Needed a person");

        assertThat(metric(report(s.owner(), s.organization(), 90), "work.completed")
                        .get("value")
                        .asDouble())
                .isEqualTo(2);
        assertThat(s.owner().get(org(s.organization()) + "/analytics?days=14").status())
                .isEqualTo(400);
    }

    @Test
    void clientResponseTimeComesFromTheFirstAnswerToARequest() {
        var s = setup("Responsive Ltd");
        UUID work = createWork(s.owner(), s.organization(), "Collect");
        ok(transition(s.owner(), s.organization(), work, "DRAFT", "READY", null));
        ok(transition(s.owner(), s.organization(), work, "READY", "RUNNING", null));
        UUID name = requirement(s.owner(), s.organization(), work, "Legal name", "TEXT", true);
        String client = "client-" + UUID.randomUUID() + "@responsive.test";
        created(s.owner()
                .post(
                        org(s.organization()) + "/work/" + work + "/request-links",
                        Map.of("recipientEmail", client, "requirementIds", List.of(name.toString())),
                        key()));
        created(new BrowserClient(port)
                .post(
                        "/api/v1/client-requests/current/requirements/" + name + "/value",
                        Map.of("value", "Responsive Holdings"),
                        token(linkToken(outbox, client))));

        var report = report(s.owner(), s.organization(), 7);
        assertThat(metric(report, "requests.sent").get("value").asDouble()).isEqualTo(1);
        assertThat(metric(report, "requests.answered_rate").get("value").asDouble())
                .isEqualTo(100);
        assertThat(metric(report, "requests.response_time_median").get("value").asDouble())
                .isGreaterThanOrEqualTo(0);
        assertThat(metric(report, "information.collected").get("value").asDouble())
                .isEqualTo(1);
        assertThat(report.toString()).doesNotContain("Responsive Holdings").doesNotContain(client);
    }

    @Test
    void onlyThoseAllowedSeeAnalytics() {
        var s = setup("Guarded Ltd");
        var manager = member(s, "MANAGER");
        var colleague = member(s, "MEMBER");
        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(manager.get(org(s.organization()) + "/analytics").status()).isEqualTo(200);
        assertThat(colleague.get(org(s.organization()) + "/analytics").status()).isEqualTo(403);
        assertThat(stranger.get(org(s.organization()) + "/analytics").status()).isEqualTo(404);
    }

    @Test
    void usageAnalyticsShowTheRecordsBillingKeeps() {
        var s = setup("Used Ltd");
        ownerQuery("select sweep_billing_daily()");
        await().atMost(WAIT)
                .until(() -> !ownerQuery(
                                "select 1 from usage_records where organization_id = ? and metric = 'members'",
                                s.organization())
                        .isEmpty());
        var members = series(report(s.owner(), s.organization(), 7), "usage.members");
        assertThat(members.get("interval").asString()).isEqualTo("DAY");
        assertThat(members.get("points").get(0).get("value").asDouble()).isEqualTo(1);
        assertThat(series(report(s.owner(), s.organization(), 7), "usage.documents.bytes")
                        .get("unit")
                        .asString())
                .isEqualTo("BYTES");
    }

    @Test
    void operatorsGetAggregateCountsOnly() {
        var s = setup("Counted Ltd");
        complete(work(s, "Counted", "Onboarding"), "2 hours", "1 hour");
        var counts = ownerQuery("select * from platform_daily_counts()").getFirst();
        assertThat(counts).hasSize(7).allSatisfy(value -> assertThat(value).isInstanceOf(Long.class));
        assertThat((Long) counts.get(0)).isPositive();
        assertThat((Long) counts.get(2)).as("activated").isPositive();
        await().atMost(WAIT)
                .until(() -> !ownerQuery("select 1 from platform_daily_metrics where day = current_date")
                        .isEmpty());
    }
}
