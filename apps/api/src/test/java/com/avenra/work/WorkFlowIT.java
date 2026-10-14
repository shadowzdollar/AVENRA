package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

/**
 * Clients, projects, work and its lifecycle, completeness, provenance and review through the API
 * (Phase 3 criteria 3.4, 3.5, 3.6, 3.7, 3.11).
 */
@IntegrationTest
class WorkFlowIT extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private BrowserClient user() {
        return TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
    }

    private BrowserClient member(BrowserClient owner, UUID organization, String role) {
        String email = TestAccounts.newEmail();
        created(owner.post(org(organization) + "/invitations", Map.of("email", email, "role", role), key()));
        var person = TestAccounts.signedIn(port, outbox, email);
        ok(person.post(
                "/api/v1/invitations/acceptance",
                Map.of("token", outbox.latestToken(email, "invitation").orElseThrow())));
        return person;
    }

    @Test
    void clientsAndProjectsAreCreatedOnceAndListed() {
        var alice = user();
        UUID organization = alice.createOrganization("Alice Accounting");
        var headers = key();
        var first = created(alice.post(
                org(organization) + "/clients", Map.of("name", "Acme Ltd", "email", "Ops@Acme.test"), headers));
        var repeat = created(alice.post(
                org(organization) + "/clients", Map.of("name", "Acme Ltd", "email", "Ops@Acme.test"), headers));
        assertThat(id(repeat)).isEqualTo(id(first));
        assertThat(first.body().get("email").asString()).isEqualTo("ops@acme.test");
        UUID client = id(first);

        UUID project = id(created(alice.post(
                org(organization) + "/projects",
                Map.of("name", "Year end 2026", "clientId", client.toString()),
                key())));
        assertThat(ok(alice.get(org(organization) + "/projects?clientId=" + client))
                        .body()
                        .size())
                .isEqualTo(1);
        assertThat(ok(alice.get(org(organization) + "/clients"))
                        .body()
                        .get(0)
                        .get("name")
                        .asString())
                .isEqualTo("Acme Ltd");

        ok(alice.put(org(organization) + "/clients/" + client, Map.of("name", "Acme Limited")));
        assertThat(ok(alice.get(org(organization) + "/clients/" + client))
                        .body()
                        .get("name")
                        .asString())
                .isEqualTo("Acme Limited");

        var work = created(alice.post(
                org(organization) + "/work",
                Map.of("title", "Year-end accounts", "clientId", client.toString(), "projectId", project.toString()),
                key()));
        assertThat(work.body().get("status").asString()).isEqualTo("DRAFT");
        assertThat(work.body().get("ownerMembershipId").isNull()).isFalse();
        assertThat(ok(alice.get(org(organization) + "/work?projectId=" + project))
                        .body()
                        .size())
                .isEqualTo(1);
    }

    @Test
    void referencesToUnknownOrForeignRowsAreRejected() {
        var alice = user();
        var bob = user();
        UUID aliceOrg = alice.createOrganization("Alice");
        UUID bobOrg = bob.createOrganization("Bob");
        UUID bobClient = id(created(bob.post(org(bobOrg) + "/clients", Map.of("name", "Bob's client"), key())));

        var response =
                alice.post(org(aliceOrg) + "/projects", Map.of("name", "P", "clientId", bobClient.toString()), key());
        assertThat(response.status()).isEqualTo(400);
        assertThat(response.code()).isEqualTo("VALIDATION_FAILED");
        var work = alice.post(org(aliceOrg) + "/work", Map.of("title", "W", "clientId", bobClient.toString()), key());
        assertThat(work.status()).isEqualTo(400);
    }

    @Test
    void theLifecycleAllowsOnlyDeclaredTransitionsAndRecordsThem() {
        var alice = user();
        UUID organization = alice.createOrganization("Alice");
        UUID work = createWork(alice, organization, "Onboarding");

        var skip = transition(alice, organization, work, "DRAFT", "RUNNING", null);
        assertThat(skip.status()).isEqualTo(409);
        assertThat(skip.code()).isEqualTo("INVALID_TRANSITION");

        var stale = transition(alice, organization, work, "READY", "RUNNING", null);
        assertThat(stale.code()).isEqualTo("STATUS_CHANGED");

        ok(transition(alice, organization, work, "DRAFT", "READY", null));
        // Repeating the same transition is harmless (idempotent) and records nothing new.
        var repeat = ok(transition(alice, organization, work, "DRAFT", "READY", null));
        assertThat(repeat.body().get("status").asString()).isEqualTo("READY");

        var running = ok(transition(alice, organization, work, "READY", "RUNNING", null))
                .body();
        assertThat(running.get("startedAt").isNull()).isFalse();
        assertThat(running.get("allowedTransitions").toString()).contains("BLOCKED", "COMPLETED");

        var blockedWithoutReason = transition(alice, organization, work, "RUNNING", "BLOCKED", null);
        assertThat(blockedWithoutReason.status()).isEqualTo(400);
        ok(transition(alice, organization, work, "RUNNING", "BLOCKED", "Waiting for the bank"));
        ok(transition(alice, organization, work, "BLOCKED", "RUNNING", null));

        var history = ok(alice.get(org(organization) + "/work/" + work + "/transitions"))
                .body();
        assertThat(history.size()).isEqualTo(5);
        assertThat(history.get(0).get("to").asString()).isEqualTo("DRAFT");
        assertThat(history.get(3).get("reason").asString()).isEqualTo("Waiting for the bank");
        assertThat(history.get(4).get("actorUserId").isNull()).isFalse();

        ok(transition(alice, organization, work, "RUNNING", "CANCELLED", "Client left"));
        assertThat(transition(alice, organization, work, "CANCELLED", "RUNNING", null)
                        .code())
                .isEqualTo("INVALID_TRANSITION");
        var edit = alice.patch(org(organization) + "/work/" + work, Map.of("title", "Reopened"));
        assertThat(edit.code()).isEqualTo("WORK_CLOSED");
        assertThat(auditActions(organization)).contains("work.created", "work.transitioned");
    }

    @Test
    void statusCannotBeSetThroughTheUpdateOperation() {
        var alice = user();
        UUID organization = alice.createOrganization("Alice");
        UUID work = createWork(alice, organization, "W");
        var response = alice.patch(org(organization) + "/work/" + work, Map.of("status", "COMPLETED"));
        assertThat(response.status()).isEqualTo(400);
        assertThat(status(alice, organization, work)).isEqualTo("DRAFT");
    }

    @Test
    void completenessIsComputedFromRequiredRequirementsAndGuardsCompletion() {
        var alice = user();
        UUID organization = alice.createOrganization("Alice");
        UUID work = createWork(alice, organization, "Tax return");
        UUID income = requirement(alice, organization, work, "Annual income", "NUMBER", true);
        UUID start = requirement(alice, organization, work, "Start date", "DATE", true);
        requirement(alice, organization, work, "Notes", "TEXT", false);
        UUID task = id(created(alice.post(
                org(organization) + "/work/" + work + "/tasks",
                Map.of("title", "Check figures", "completionCondition", "Figures match the bank statements"),
                key())));
        ok(transition(alice, organization, work, "DRAFT", "READY", null));
        ok(transition(alice, organization, work, "READY", "RUNNING", null));

        var completeness = work(alice, organization, work).get("completeness");
        assertThat(completeness.get("required").asInt()).isEqualTo(2);
        assertThat(completeness.get("missing").asInt()).isEqualTo(2);
        assertThat(completeness.get("complete").asBoolean()).isFalse();

        var invalid = alice.post(
                org(organization) + "/work/" + work + "/requirements/" + income + "/value", Map.of("value", "lots"));
        assertThat(invalid.status()).isEqualTo(400);
        UUID incomeItem = id(created(alice.post(
                org(organization) + "/work/" + work + "/requirements/" + income + "/value",
                Map.of("value", "1250.50"))));
        UUID startItem = id(created(alice.post(
                org(organization) + "/work/" + work + "/requirements/" + start + "/value",
                Map.of("value", "2026-01-31"))));

        completeness = work(alice, organization, work).get("completeness");
        assertThat(completeness.get("awaitingReview").asInt()).isEqualTo(2);
        assertThat(transition(alice, organization, work, "RUNNING", "COMPLETED", null)
                        .code())
                .isEqualTo("REQUIREMENTS_INCOMPLETE");

        review(alice, organization, work, income, incomeItem, "ACCEPT", null);
        var rejected = review(alice, organization, work, start, startItem, "REJECT", "Use the contract start date");
        assertThat(rejected.get("state").asString()).isEqualTo("REJECTED");
        assertThat(rejected.get("currentItem").get("verification").get("reason").asString())
                .isEqualTo("Use the contract start date");
        completeness = work(alice, organization, work).get("completeness");
        assertThat(completeness.get("accepted").asInt()).isEqualTo(1);
        assertThat(completeness.get("rejected").asInt()).isEqualTo(1);

        UUID corrected = id(created(alice.post(
                org(organization) + "/work/" + work + "/requirements/" + start + "/value",
                Map.of("value", "2026-02-01"))));
        review(alice, organization, work, start, corrected, "ACCEPT", null);
        assertThat(work(alice, organization, work)
                        .get("completeness")
                        .get("complete")
                        .asBoolean())
                .isTrue();

        assertThat(transition(alice, organization, work, "RUNNING", "COMPLETED", null)
                        .code())
                .isEqualTo("TASKS_OPEN");
        ok(alice.put(org(organization) + "/work/" + work + "/tasks/" + task + "/status", Map.of("status", "DONE")));
        var done = ok(transition(alice, organization, work, "RUNNING", "COMPLETED", null))
                .body();
        assertThat(done.get("completedAt").isNull()).isFalse();
    }

    @Test
    void submissionsAreNeverOverwrittenAndKeepTheirSource() {
        var alice = user();
        UUID organization = alice.createOrganization("Alice");
        UUID work = createWork(alice, organization, "W");
        UUID name = requirement(alice, organization, work, "Legal name", "TEXT", true);
        String path = org(organization) + "/work/" + work + "/requirements/" + name;

        UUID first = id(created(alice.post(path + "/value", Map.of("value", "Acme"))));
        UUID repeat = id(created(alice.post(path + "/value", Map.of("value", "  Acme "))));
        assertThat(repeat).isEqualTo(first);
        UUID second = id(created(alice.post(path + "/value", Map.of("value", "Acme Ltd"))));
        assertThat(second).isNotEqualTo(first);

        var items = ok(alice.get(path + "/items")).body();
        assertThat(items.size()).isEqualTo(2);
        assertThat(items.get(0).get("value").asString()).isEqualTo("Acme Ltd");
        assertThat(items.get(1).get("value").asString()).isEqualTo("Acme");
        assertThat(items.get(1).get("source").get("type").asString()).isEqualTo("TEAM_MEMBER");
        assertThat(items.get(1).get("source").get("userId").isNull()).isFalse();
        assertThat(items.get(1).get("receivedAt").isNull()).isFalse();

        // Only the current item can be reviewed; the earlier one stays as it was.
        var stale = alice.post(path + "/review", Map.of("itemId", first.toString(), "decision", "ACCEPT"));
        assertThat(stale.code()).isEqualTo("NOT_AWAITING_REVIEW");
        review(alice, organization, work, name, second, "ACCEPT", null);
        var again = review(alice, organization, work, name, second, "ACCEPT", null);
        assertThat(again.get("state").asString()).isEqualTo("ACCEPTED");
        assertThat(alice.post(path + "/value", Map.of("value", "Other")).code()).isEqualTo("ALREADY_ACCEPTED");
        assertThat(alice.post(path + "/review", Map.of("itemId", second.toString(), "decision", "REJECT"))
                        .status())
                .isEqualTo(400);
    }

    @Test
    void permissionsFollowRoles() {
        var owner = user();
        UUID organization = owner.createOrganization("Firm");
        UUID work = createWork(owner, organization, "W");
        UUID requirement = requirement(owner, organization, work, "Name", "TEXT", true);
        String path = org(organization) + "/work/" + work + "/requirements/" + requirement;
        UUID item = id(created(owner.post(path + "/value", Map.of("value", "x"))));

        var viewer = member(owner, organization, "VIEWER");
        assertThat(viewer.get(org(organization) + "/work/" + work).status()).isEqualTo(200);
        assertThat(viewer.post(org(organization) + "/work", Map.of("title", "x"), key())
                        .status())
                .isEqualTo(403);
        assertThat(viewer.post(path + "/value", Map.of("value", "y")).status()).isEqualTo(403);

        var memberUser = member(owner, organization, "MEMBER");
        assertThat(memberUser.post(path + "/value", Map.of("value", "y")).status())
                .isEqualTo(201);
        assertThat(memberUser
                        .post(path + "/review", Map.of("itemId", item.toString(), "decision", "ACCEPT"))
                        .status())
                .isEqualTo(403);
        assertThat(memberUser
                        .post(
                                org(organization) + "/work/" + work + "/request-links",
                                Map.of(
                                        "recipientEmail",
                                        "c@client.test",
                                        "requirementIds",
                                        java.util.List.of(requirement.toString())),
                                key())
                        .status())
                .isEqualTo(201);
    }

    @Test
    void anotherTenantCannotReachAnyResourceEvenByIdentifier() {
        var alice = user();
        var mallory = user();
        UUID aliceOrg = alice.createOrganization("Alice");
        UUID malloryOrg = mallory.createOrganization("Mallory");
        UUID client = id(created(alice.post(org(aliceOrg) + "/clients", Map.of("name", "C"), key())));
        UUID project = id(created(alice.post(org(aliceOrg) + "/projects", Map.of("name", "P"), key())));
        UUID work = createWork(alice, aliceOrg, "Secret work");
        UUID requirement = requirement(alice, aliceOrg, work, "Name", "TEXT", true);

        // Through the victim's organization: not a member, so nothing exists.
        for (String path : java.util.List.of(
                "/clients/" + client,
                "/projects/" + project,
                "/work/" + work,
                "/work/" + work + "/transitions",
                "/work/" + work + "/request-links",
                "/work/" + work + "/requirements/" + requirement + "/items")) {
            assertThat(mallory.get(org(aliceOrg) + path).status()).as(path).isEqualTo(404);
        }
        // Through the attacker's own organization, with the victim's ids: still nothing.
        for (String path : java.util.List.of(
                "/clients/" + client,
                "/projects/" + project,
                "/work/" + work,
                "/work/" + work + "/transitions",
                "/work/" + work + "/requirements/" + requirement + "/items")) {
            assertThat(mallory.get(org(malloryOrg) + path).status()).as(path).isEqualTo(404);
        }
        assertThat(mallory.post(
                                org(malloryOrg) + "/work/" + work + "/requirements/" + requirement + "/value",
                                Map.of("value", "x"))
                        .status())
                .isEqualTo(404);
        assertThat(transition(mallory, malloryOrg, work, "DRAFT", "READY", null).status())
                .isEqualTo(404);
        assertThat(mallory.put(org(malloryOrg) + "/clients/" + client, Map.of("name", "x"))
                        .status())
                .isEqualTo(404);
        assertThat(ok(mallory.get(org(malloryOrg) + "/work")).body().size()).isZero();
        assertThat(ok(mallory.get(org(malloryOrg) + "/clients")).body().size()).isZero();
        assertThat(status(alice, aliceOrg, work)).isEqualTo("DRAFT");
    }

    private JsonNode review(
            BrowserClient user,
            UUID organization,
            UUID work,
            UUID requirement,
            UUID item,
            String decision,
            String reason) {
        var body = new java.util.HashMap<String, Object>(Map.of("itemId", item.toString(), "decision", decision));
        if (reason != null) {
            body.put("reason", reason);
        }
        return ok(user.post(org(organization) + "/work/" + work + "/requirements/" + requirement + "/review", body))
                .body();
    }
}
