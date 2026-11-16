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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

/**
 * Agent execution through the API (Phase 7 criteria 7.3–7.11): planning is opt-in, nothing runs
 * before approval, high-risk steps are approved one by one, each step runs with its person's
 * permissions and is verified, budgets and deadlines stop runs and ask for a person, and a person
 * can stop a run at any time.
 */
@IntegrationTest
class AgentRunIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(20);

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(BrowserClient owner, UUID organization, UUID work, String clientEmail) {

        String runs() {
            return org(organization) + "/work/" + work + "/agent-runs";
        }
    }

    @AfterEach
    void resetStub() {
        TestAiService.reset();
    }

    private Setup setup(boolean planning) {
        var owner = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Planned Ltd");
        String clientEmail = "client-" + UUID.randomUUID() + "@planned.test";
        UUID client = id(created(
                owner.post(org(organization) + "/clients", Map.of("name", "Jane Doe", "email", clientEmail), key())));
        UUID work = id(created(owner.post(
                org(organization) + "/work",
                Map.of("title", "Onboarding Jane Doe", "description", "KYC first.", "clientId", client.toString()),
                key())));
        ok(transition(owner, organization, work, "DRAFT", "READY", null));
        ok(transition(owner, organization, work, "READY", "RUNNING", null));
        if (planning) {
            ok(owner.put(org(organization) + "/ai/settings", Map.of("documentReading", false, "workPlanning", true)));
        }
        return new Setup(owner, organization, work, clientEmail);
    }

    private JsonNode start(BrowserClient as, Setup s) {
        return created(as.post(s.runs(), Map.of(), key())).body();
    }

    private JsonNode run(Setup s, String runId) {
        return ok(s.owner().get(s.runs() + "/" + runId)).body();
    }

    private JsonNode awaitStatus(Setup s, String runId, String status) {
        return await().atMost(WAIT)
                .until(() -> run(s, runId), run -> run.get("status").asString().equals(status));
    }

    private BrowserClient.Response decide(BrowserClient as, Setup s, String runId, String decision, List<String> high) {
        var body = new HashMap<String, Object>(Map.of("decision", decision));
        body.put("highRiskStepIds", high);
        return as.post(s.runs() + "/" + runId + "/approval", body);
    }

    private int requirements(Setup s) {
        return work(s.owner(), s.organization(), s.work()).get("requirements").size();
    }

    @Test
    void planningIsOffUntilAnOwnerSwitchesItOn() {
        var s = setup(false);
        var refused = s.owner().post(s.runs(), Map.of(), key());
        assertThat(refused.status()).isEqualTo(409);
        assertThat(refused.code()).isEqualTo("AI_PLANNING_OFF");
        assertThat(TestAiService.planRequests()).isEmpty();
        var settings = ok(s.owner().get(org(s.organization()) + "/ai/settings")).body();
        assertThat(settings.get("workPlanning").asBoolean()).isFalse();
    }

    @Test
    void nothingRunsBeforeApprovalAndTheHighRiskStepNeedsItsOwn() {
        var s = setup(true);
        var started = start(s.owner(), s);
        String runId = started.get("id").asString();
        assertThat(started.get("status").asString()).isEqualTo("PLANNING");

        var planned = awaitStatus(s, runId, "AWAITING_APPROVAL");
        var steps = planned.get("steps");
        assertThat(steps)
                .extracting(step ->
                        step.get("tool").asString() + ":" + step.get("risk").asString())
                .containsExactly(
                        "create_requirement:MEDIUM",
                        "create_requirement:MEDIUM",
                        "create_task:MEDIUM",
                        "send_information_request:HIGH");
        assertThat(steps.get(3).get("needsOwnApproval").asBoolean()).isTrue();
        assertThat(steps.get(0).get("description").asString()).isEqualTo("Ask for \"Passport\" (document, required)");
        assertThat(requirements(s)).as("nothing happens before approval").isZero();
        // What the planner saw: the work's own description and the allowed tools, nothing more.
        var asked = TestAiService.planRequests().getFirst();
        assertThat(asked.get("title").asString()).isEqualTo("Onboarding Jane Doe");
        assertThat(asked.get("tools").toString()).contains("send_information_request");
        assertThat(asked.toString()).doesNotContain(s.clientEmail());

        // Approving the plan runs the reversible steps and stops at the high-risk one.
        ok(decide(s.owner(), s, runId, "APPROVE", List.of()));
        var waiting = await().atMost(WAIT)
                .until(
                        () -> run(s, runId),
                        run -> run.get("steps").get(2).get("status").asString().equals("SUCCEEDED")
                                && run.get("status").asString().equals("AWAITING_APPROVAL"));
        assertThat(waiting.get("steps").get(3).get("status").asString()).isEqualTo("PROPOSED");
        assertThat(requirements(s)).isEqualTo(2);
        assertThat(outbox.to(s.clientEmail())).as("nothing sent yet").isEmpty();

        // The high-risk step, approved on its own, emails the client's recorded address.
        String send = waiting.get("steps").get(3).get("id").asString();
        ok(decide(s.owner(), s, runId, "APPROVE", List.of(send)));
        var done = awaitStatus(s, runId, "COMPLETED");
        assertThat(done.get("steps"))
                .extracting(step -> step.get("status").asString())
                .containsOnly("SUCCEEDED");
        assertThat(done.get("steps").get(3).get("result").asString()).contains("2 items");
        assertThat(outbox.await(message -> message.to().equals(s.clientEmail())))
                .hasSize(1);
        var budget = done.get("budget");
        assertThat(budget.get("modelCalls").asInt()).isEqualTo(1);
        assertThat(budget.get("toolCalls").asInt()).isEqualTo(4);
        assertThat(budget.get("sideEffects").asInt()).isEqualTo(1);
        assertThat(budget.get("costMicros").asLong()).isEqualTo(540);
        assertThat(auditActions(s.organization()))
                .contains(
                        "agent.run.started",
                        "agent.step.approved",
                        "agent.step.create_requirement",
                        "agent.step.send_information_request",
                        "ai.work_planned");
        var usage = ok(s.owner().get(org(s.organization()) + "/ai/usage")).body();
        assertThat(usage.get("invocations").get(0).get("purpose").asString()).isEqualTo("work.plan");
    }

    @Test
    void approvingNeedsWorkApproveAndStepsRunWithTheStartersPermissionsOnly() {
        var s = setup(true);
        var member = member(s, "MEMBER");
        String runId = start(member, s).get("id").asString();
        awaitStatus(s, runId, "AWAITING_APPROVAL");
        assertThat(decide(member, s, runId, "APPROVE", List.of()).status())
                .as("a member cannot approve")
                .isEqualTo(403);

        // The starter loses the permission before the plan runs: the step is refused as theirs would be.
        demote(s, member, "VIEWER");
        ok(decide(s.owner(), s, runId, "APPROVE", List.of()));
        var failed = awaitStatus(s, runId, "FAILED");
        assertThat(failed.get("steps").get(0).get("status").asString()).isEqualTo("FAILED");
        assertThat(failed.get("steps").get(1).get("status").asString()).isEqualTo("SKIPPED");
        assertThat(requirements(s)).isZero();
        var exceptions =
                ok(s.owner().get(org(s.organization()) + "/exceptions")).body();
        assertThat(exceptions.toString()).contains("HUMAN_REQUIRED", "assistant");
    }

    @Test
    void theGatewayRefusesPlansOutsideTheCatalogue() {
        var s = setup(true);
        TestAiService.plan(request -> TestAiService.planOf(List.of(TestAiService.step(
                "create_requirement",
                Map.of("title", "Passport", "kind", "MONEY", "required", true, "instructions", "")))));
        String runId = start(s.owner(), s).get("id").asString();
        var failed = awaitStatus(s, runId, "FAILED");
        assertThat(failed.get("stopReason").asString()).contains("refused by the tool gateway");
        assertThat(failed.get("steps")).isEmpty();

        TestAiService.plan(request -> TestAiService.planOf(List.of(TestAiService.step("delete_work", Map.of()))));
        String second = start(s.owner(), s).get("id").asString();
        assertThat(awaitStatus(s, second, "FAILED").get("stopReason").asString())
                .contains("could not plan");
    }

    @Test
    void aRejectedPlanDoesNothing() {
        var s = setup(true);
        String runId = start(s.owner(), s).get("id").asString();
        awaitStatus(s, runId, "AWAITING_APPROVAL");
        var rejected = ok(s.owner()
                        .post(s.runs() + "/" + runId + "/approval", Map.of("decision", "REJECT", "reason", "Not now")))
                .body();
        assertThat(rejected.get("status").asString()).isEqualTo("REJECTED");
        assertThat(rejected.get("stopReason").asString()).contains("Not now");
        assertThat(rejected.get("steps"))
                .extracting(step -> step.get("status").asString())
                .containsOnly("REJECTED");
        assertThat(requirements(s)).isZero();
        assertThat(decide(s.owner(), s, runId, "APPROVE", List.of()).status()).isEqualTo(409);
    }

    @Test
    void aPersonCanStopARunAtAnyTime() {
        var s = setup(true);
        String runId = start(s.owner(), s).get("id").asString();
        awaitStatus(s, runId, "AWAITING_APPROVAL");
        var stopped = ok(s.owner().post(s.runs() + "/" + runId + "/stop", Map.of("reason", "Wrong client")))
                .body();
        assertThat(stopped.get("status").asString()).isEqualTo("STOPPED");
        assertThat(stopped.get("stopReason").asString()).isEqualTo("Stopped by a person: Wrong client");
        assertThat(stopped.get("steps"))
                .extracting(step -> step.get("status").asString())
                .containsOnly("SKIPPED");
        assertThat(decide(s.owner(), s, runId, "APPROVE", List.of()).status()).isEqualTo(409);
        // Stopping again is harmless.
        assertThat(s.owner()
                        .post(s.runs() + "/" + runId + "/stop", Map.of("reason", "again"))
                        .status())
                .isEqualTo(200);
    }

    @Test
    void aRunPastItsDeadlineIsStoppedByTheSweepAndAsksForAPerson() {
        var s = setup(true);
        String runId = start(s.owner(), s).get("id").asString();
        awaitStatus(s, runId, "AWAITING_APPROVAL");
        ownerUpdate(
                "update agent_runs set deadline = now() - interval '1 minute' where id = ?", UUID.fromString(runId));
        ownerQuery("select sweep_agent_deadlines()");
        var stopped = awaitStatus(s, runId, "STOPPED");
        assertThat(stopped.get("stopReason").asString()).isEqualTo("The run reached its deadline.");
        await().atMost(WAIT)
                .until(
                        () -> ok(s.owner().get(org(s.organization()) + "/exceptions"))
                                .body()
                                .toString(),
                        text -> text.contains("deadline"));
    }

    @Test
    void aRepeatedStepHasNoSecondEffect() {
        var s = setup(true);
        String runId = start(s.owner(), s).get("id").asString();
        var planned = awaitStatus(s, runId, "AWAITING_APPROVAL");
        String send = planned.get("steps").get(3).get("id").asString();
        ok(decide(s.owner(), s, runId, "APPROVE", List.of(send)));
        awaitStatus(s, runId, "COMPLETED");
        assertThat(outbox.await(message -> message.to().equals(s.clientEmail())))
                .hasSize(1);

        // Replay the last step as a crashed worker would: same key, same result, no second email.
        ownerUpdate(
                "update agent_steps set status = 'APPROVED', finished_at = null where id = ?", UUID.fromString(send));
        ownerUpdate(
                "update agent_runs set status = 'RUNNING', finished_at = null, tool_calls = 3, side_effects = 0"
                        + " where id = ?",
                UUID.fromString(runId));
        ownerUpdate(
                "insert into jobs (id, organization_id, type, payload, status, max_attempts, run_at, idempotency_key,"
                        + " created_at, updated_at) select gen_random_uuid(), organization_id, 'agent.step',"
                        + " jsonb_build_object('runId', id::text), 'QUEUED', 3, now(), 'replay:' || id::text, now(), now()"
                        + " from agent_runs where id = ?",
                UUID.fromString(runId));
        awaitStatus(s, runId, "COMPLETED");
        assertThat(requirements(s)).isEqualTo(2);
        assertThat(outbox.now(message -> message.to().equals(s.clientEmail()))).hasSize(1);
        var links = ok(s.owner().get(org(s.organization()) + "/work/" + s.work() + "/request-links"))
                .body();
        assertThat(links.size()).isEqualTo(1);
    }

    @Test
    void planningRetriesTransientFailuresAndRecordsEveryCall() {
        var s = setup(true);
        var calls = new AtomicInteger();
        TestAiService.plan(request -> calls.incrementAndGet() == 1
                ? TestAiService.failure(503, "RATE_LIMITED", true, true)
                : TestAiService.plan(request));
        String runId = start(s.owner(), s).get("id").asString();
        awaitStatus(s, runId, "AWAITING_APPROVAL");
        var usage =
                ok(s.owner().get(org(s.organization()) + "/ai/usage")).body().get("invocations");
        assertThat(usage)
                .extracting(call -> call.get("outcome").asString() + "#"
                        + call.get("attempt").asInt())
                .containsExactly("SUCCEEDED#2", "FAILED#1");
    }

    @Test
    void anotherOrganizationSeesNoneOfIt() {
        var s = setup(true);
        String runId = start(s.owner(), s).get("id").asString();
        var stranger = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        assertThat(stranger.get(s.runs() + "/" + runId).status()).isEqualTo(404);
        assertThat(stranger.post(s.runs() + "/" + runId + "/stop", Map.of("reason", "x"))
                        .status())
                .isEqualTo(404);
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

    private void demote(Setup s, BrowserClient person, String role) {
        var members = ok(s.owner().get(org(s.organization()) + "/members")).body();
        String me = ok(person.get("/api/v1/auth/session")).body().get("id").asString();
        for (JsonNode member : members) {
            if (member.get("userId").asString().equals(me)) {
                ok(s.owner()
                        .patch(
                                org(s.organization()) + "/members/"
                                        + member.get("membershipId").asString(),
                                Map.of("role", role)));
            }
        }
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate tx;

    @Test
    void theDatabaseKeepsUnapprovedStepsFromRunningAndStepsFromBeingRewritten() {
        var s = setup(true);
        String runId = start(s.owner(), s).get("id").asString();
        awaitStatus(s, runId, "AWAITING_APPROVAL");
        assertThat(asApplication(s, "update agent_steps set status = 'SUCCEEDED' where run_id = '" + runId + "'"))
                .contains("agent_steps_approved_before_running");
        assertThat(asApplication(s, "update agent_steps set tool = 'create_task' where run_id = '" + runId + "'"))
                .contains("permission denied");
        assertThat(asApplication(s, "update agent_steps set input = '{}' where run_id = '" + runId + "'"))
                .contains("permission denied");
        assertThat(asApplication(s, "delete from agent_runs where id = '" + runId + "'"))
                .contains("permission denied");
        assertThat(asApplication(s, "update agent_runs set started_by = null where id = '" + runId + "'"))
                .contains("permission denied");
    }

    /** Runs a statement as the application role in the organization's scope; returns the error. */
    private String asApplication(Setup s, String sql) {
        try {
            tx.executeWithoutResult(status -> {
                jdbc.queryForObject(
                        "select set_config('app.organization_id', ?, true)",
                        String.class,
                        s.organization().toString());
                jdbc.update(sql);
            });
            return "succeeded";
        } catch (RuntimeException denied) {
            return String.valueOf(org.springframework.core.NestedExceptionUtils.getMostSpecificCause(denied)
                    .getMessage());
        }
    }
}
