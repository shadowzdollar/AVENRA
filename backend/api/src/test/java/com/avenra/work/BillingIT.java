package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import com.avenra.billing.application.WebhookSignature;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

/**
 * Billing through the API (Phase 11 criteria 11.2–11.7): a trial on every new organization, limits
 * enforced where things are added, payment state from signed provider events applied once and in
 * order, records kept available whatever the payment state, and daily usage records.
 */
@IntegrationTest
class BillingIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(20);

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    @Value("${avenra.billing.webhook-secret}")
    private String secret;

    private record Setup(BrowserClient owner, UUID organization) {}

    private Setup setup() {
        var owner = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        return new Setup(owner, owner.createOrganization("Billed Ltd"));
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

    private static JsonNode billing(BrowserClient person, UUID organization) {
        return ok(person.get(org(organization) + "/billing")).body();
    }

    private static JsonNode entitlement(JsonNode billing, String limit) {
        for (var entitlement : billing.get("entitlements")) {
            if (entitlement.get("limit").asString().equals(limit)) {
                return entitlement;
            }
        }
        throw new AssertionError("no entitlement " + limit);
    }

    /** Posts a provider event exactly as the provider would: raw body, signed, no browser session. */
    private HttpResponse<String> deliver(String body, String signature) {
        try {
            return HttpClient.newHttpClient()
                    .send(
                            HttpRequest.newBuilder(URI.create(
                                            "http://localhost:" + port + "/api/v1/billing/providers/fake/events"))
                                    .header("Content-Type", "application/json")
                                    .header("Avenra-Billing-Signature", signature)
                                    .POST(HttpRequest.BodyPublishers.ofString(body))
                                    .build(),
                            HttpResponse.BodyHandlers.ofString());
        } catch (Exception failure) {
            throw new IllegalStateException(failure);
        }
    }

    private HttpResponse<String> deliver(String body) {
        return deliver(
                body,
                WebhookSignature.sign(secret, Instant.now().getEpochSecond(), body.getBytes(StandardCharsets.UTF_8)));
    }

    private static String event(String id, String type, UUID organization, OffsetDateTime at, String extra) {
        return "{\"id\":\"" + id + "\",\"type\":\"" + type + "\",\"occurredAt\":\""
                + at.withOffsetSameInstant(ZoneOffset.UTC) + "\",\"organizationId\":\"" + organization + "\"" + extra
                + "}";
    }

    private static long events(UUID organization, String outcome) {
        return (Long) ownerQuery(
                        "select count(*) from billing_events where organization_id = ? and outcome = ?",
                        organization,
                        outcome)
                .getFirst()
                .getFirst();
    }

    @Test
    void aNewOrganizationStartsOnAStarterTrial() {
        var s = setup();
        var billing = billing(s.owner(), s.organization());
        var subscription = billing.get("subscription");
        assertThat(subscription.get("plan").asString()).isEqualTo("STARTER");
        assertThat(subscription.get("status").asString()).isEqualTo("TRIALING");
        assertThat(subscription.get("inGoodStanding").asBoolean()).isTrue();
        assertThat(Duration.between(
                        OffsetDateTime.now(),
                        OffsetDateTime.parse(subscription.get("trialEndsAt").asString())))
                .isBetween(Duration.ofDays(29), Duration.ofDays(30));
        var members = entitlement(billing, "members");
        assertThat(members.get("used").asLong()).isEqualTo(1);
        assertThat(members.get("allowed").asLong()).isEqualTo(5);

        var plans = ok(s.owner().get("/api/v1/billing/plans")).body();
        assertThat(plans).hasSize(3);
        assertThat(plans.get(2).get("plan").asString()).isEqualTo("ENTERPRISE");
        assertThat(plans.get(2).get("selfServe").asBoolean()).isFalse();
        assertThat(plans.get(2).get("limits").get(0).path("allowed").isNumber())
                .as("unlimited")
                .isFalse();
    }

    @Test
    void limitsAreEnforcedWhereThingsAreAdded() {
        var s = setup();
        for (int i = 0; i < 4; i++) {
            created(s.owner()
                    .post(
                            org(s.organization()) + "/invitations",
                            Map.of("email", TestAccounts.newEmail(), "role", "MEMBER"),
                            Map.of("Idempotency-Key", BrowserClient.key())));
        }
        var refused = s.owner()
                .post(
                        org(s.organization()) + "/invitations",
                        Map.of("email", TestAccounts.newEmail(), "role", "MEMBER"),
                        Map.of("Idempotency-Key", BrowserClient.key()));
        assertThat(refused.status()).isEqualTo(409);
        assertThat(refused.code()).isEqualTo("PLAN_LIMIT_REACHED");

        ownerUpdate(
                "insert into work (id, organization_id, title, status, priority, requested_by, created_at, updated_at)"
                        + " select gen_random_uuid(), ?, 'Filler ' || n, 'DRAFT', 'NORMAL',"
                        + " (select user_id from memberships where organization_id = ? limit 1), now(), now()"
                        + " from generate_series(1, 100) n",
                s.organization(),
                s.organization());
        var work = s.owner().post(org(s.organization()) + "/work", Map.of("title", "One too many"), key());
        assertThat(work.status()).isEqualTo(409);
        assertThat(work.code()).isEqualTo("PLAN_LIMIT_REACHED");
        assertThat(entitlement(billing(s.owner(), s.organization()), "work.open")
                        .get("used")
                        .asLong())
                .isEqualTo(100);
    }

    @Test
    void anInactiveSubscriptionRefusesAdditionsButKeepsRecordsAvailable() {
        var s = setup();
        UUID work = createWork(s.owner(), s.organization(), "Existing");
        ownerUpdate(
                "update subscriptions set status = 'CANCELED', trial_ends_at = now() where organization_id = ?",
                s.organization());
        var refused = s.owner().post(org(s.organization()) + "/work", Map.of("title", "New"), key());
        assertThat(refused.status()).isEqualTo(409);
        assertThat(refused.code()).isEqualTo("SUBSCRIPTION_INACTIVE");
        assertThat(billing(s.owner(), s.organization())
                        .get("subscription")
                        .get("inGoodStanding")
                        .asBoolean())
                .isFalse();
        // Reading and moving existing work on stays available.
        ok(s.owner().get(org(s.organization()) + "/work"));
        ok(transition(s.owner(), s.organization(), work, "DRAFT", "READY", null));
        ok(s.owner().get(org(s.organization()) + "/audit-events/export"));
    }

    @Test
    void aCheckoutChangesThePlanWhenTheProviderConfirms() {
        var s = setup();
        var admin = member(s, "ADMIN");
        assertThat(admin.post(org(s.organization()) + "/billing/checkout", Map.of("plan", "BUSINESS"), key())
                        .status())
                .as("only owners change the plan")
                .isEqualTo(403);
        assertThat(billing(admin, s.organization())).isNotNull();
        var manager = member(s, "MANAGER");
        assertThat(manager.get(org(s.organization()) + "/billing").status()).isEqualTo(403);

        var enterprise =
                s.owner().post(org(s.organization()) + "/billing/checkout", Map.of("plan", "ENTERPRISE"), key());
        assertThat(enterprise.code()).isEqualTo("PLAN_NOT_SELF_SERVE");

        var checkout = ok(s.owner()
                        .post(org(s.organization()) + "/billing/checkout", Map.of("plan", "BUSINESS"), key()))
                .body();
        assertThat(checkout.get("checkoutUrl").asString())
                .endsWith("/organizations/" + s.organization() + "/billing?checkout=returned");
        var subscription = await().atMost(WAIT)
                .until(
                        () -> billing(s.owner(), s.organization()).get("subscription"),
                        current -> current.get("status").asString().equals("ACTIVE"));
        assertThat(subscription.get("plan").asString()).isEqualTo("BUSINESS");
        assertThat(subscription.get("provider").asString()).isEqualTo("fake");
        assertThat(entitlement(billing(s.owner(), s.organization()), "members")
                        .get("allowed")
                        .asLong())
                .isEqualTo(25);
        assertThat(auditActions(s.organization())).contains("billing.checkout_started", "billing.subscription_changed");

        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(stranger.get(org(s.organization()) + "/billing").status()).isEqualTo(404);
    }

    @Test
    void providerEventsAreAppliedOnceAndInOrder() {
        var s = setup();
        var now = OffsetDateTime.now();
        String paid = event(
                "evt_paid_" + UUID.randomUUID(),
                "payment.succeeded",
                s.organization(),
                now.minusMinutes(10),
                ",\"plan\":\"BUSINESS\",\"currentPeriodEnd\":\""
                        + now.plusMonths(1).toInstant() + "\"");
        assertThat(deliver(paid).statusCode()).isEqualTo(204);
        await().atMost(WAIT).until(() -> events(s.organization(), "APPLIED") == 1);
        assertThat(deliver(paid).statusCode()).as("a repeat is accepted").isEqualTo(204);

        String failed =
                event("evt_failed_" + UUID.randomUUID(), "payment.failed", s.organization(), now.minusMinutes(5), "");
        assertThat(deliver(failed).statusCode()).isEqualTo(204);
        var pastDue = await().atMost(WAIT)
                .until(
                        () -> billing(s.owner(), s.organization()).get("subscription"),
                        current -> current.get("status").asString().equals("PAST_DUE"));
        assertThat(pastDue.get("plan").asString()).isEqualTo("BUSINESS");
        assertThat(pastDue.get("inGoodStanding").asBoolean()).as("grace period").isTrue();

        String late =
                event("evt_late_" + UUID.randomUUID(), "payment.succeeded", s.organization(), now.minusMinutes(20), "");
        assertThat(deliver(late).statusCode()).isEqualTo(204);
        await().atMost(WAIT).until(() -> events(s.organization(), "STALE") == 1);
        assertThat(billing(s.owner(), s.organization())
                        .get("subscription")
                        .get("status")
                        .asString())
                .as("an older event changes nothing")
                .isEqualTo("PAST_DUE");
        assertThat(events(s.organization(), "APPLIED"))
                .as("the repeat was not applied again")
                .isEqualTo(2);

        String canceled = event(
                "evt_cancel_" + UUID.randomUUID(), "subscription.canceled", s.organization(), now.minusMinutes(2), "");
        deliver(canceled);
        await().atMost(WAIT).until(() -> events(s.organization(), "APPLIED") == 3);
        String failedAgain =
                event("evt_failed2_" + UUID.randomUUID(), "payment.failed", s.organization(), now.minusMinutes(1), "");
        deliver(failedAgain);
        await().atMost(WAIT).until(() -> events(s.organization(), "REFUSED") == 1);
        assertThat(billing(s.owner(), s.organization())
                        .get("subscription")
                        .get("status")
                        .asString())
                .as("a canceled subscription cannot become past due")
                .isEqualTo("CANCELED");
        assertThat(auditActions(s.organization())).contains("billing.subscription_changed");
    }

    @Test
    void unsignedOrOldEventsAreRefused() {
        var s = setup();
        String body =
                event("evt_" + UUID.randomUUID(), "subscription.canceled", s.organization(), OffsetDateTime.now(), "");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        assertThat(deliver(body, "t=1,v1=00").statusCode()).isEqualTo(401);
        assertThat(deliver(
                                body,
                                WebhookSignature.sign(
                                        "wrong-secret", Instant.now().getEpochSecond(), bytes))
                        .statusCode())
                .isEqualTo(401);
        assertThat(deliver(
                                body,
                                WebhookSignature.sign(
                                        secret,
                                        Instant.now()
                                                .minus(Duration.ofMinutes(10))
                                                .getEpochSecond(),
                                        bytes))
                        .statusCode())
                .as("a captured event cannot be replayed later")
                .isEqualTo(401);
        String tampered = body.replace("subscription.canceled", "payment.succeeded");
        assertThat(deliver(tampered, WebhookSignature.sign(secret, Instant.now().getEpochSecond(), bytes))
                        .statusCode())
                .isEqualTo(401);
        assertThat(billing(s.owner(), s.organization())
                        .get("subscription")
                        .get("status")
                        .asString())
                .isEqualTo("TRIALING");
        assertThat(deliver(event(
                                "evt_" + UUID.randomUUID(),
                                "payment.failed",
                                UUID.randomUUID(),
                                OffsetDateTime.now(),
                                ""))
                        .statusCode())
                .as("an unknown organization is acknowledged and ignored")
                .isEqualTo(204);
    }

    @Test
    void theDailyJobRecordsUsageOnceAndLetsTimeSettleTheSubscription() {
        var s = setup();
        var ended = setup();
        var cancel = ok(s.owner().post(org(s.organization()) + "/billing/cancellation", Map.of()))
                .body();
        assertThat(cancel.get("cancelAtPeriodEnd").asBoolean()).isTrue();
        assertThat(auditActions(s.organization())).contains("billing.cancellation_requested");
        ownerUpdate(
                "update subscriptions set trial_ends_at = now() - interval '1 minute' where organization_id = ?",
                s.organization());
        ownerUpdate(
                "update subscriptions set trial_ends_at = now() - interval '8 days' where organization_id = ?",
                ended.organization());

        ownerQuery("select sweep_billing_daily()");
        var canceled = await().atMost(WAIT)
                .until(
                        () -> billing(s.owner(), s.organization()).get("subscription"),
                        current -> current.get("status").asString().equals("CANCELED"));
        assertThat(canceled.get("inGoodStanding").asBoolean()).isFalse();
        var lapsed = await().atMost(WAIT)
                .until(
                        () -> billing(ended.owner(), ended.organization()).get("subscription"),
                        current -> current.get("status").asString().equals("PAST_DUE"));
        assertThat(lapsed.get("inGoodStanding").asBoolean())
                .as("the grace period is over")
                .isFalse();

        var records = ok(s.owner().get(org(s.organization()) + "/billing/usage-records"))
                .body();
        assertThat(records.toString()).contains("\"metric\":\"members\"").contains("\"value\":1");
        int count = records.size();
        ownerQuery("select sweep_billing_daily()");
        await().pollDelay(Duration.ofSeconds(2)).atMost(WAIT).until(() -> true);
        assertThat(ok(s.owner().get(org(s.organization()) + "/billing/usage-records"))
                        .body())
                .as("once per day and metric")
                .hasSize(count);
        assertThat(s.owner()
                        .get(org(s.organization()) + "/billing/usage-records?from=2026-01-01&to=2026-12-31")
                        .status())
                .isEqualTo(400);
    }
}
