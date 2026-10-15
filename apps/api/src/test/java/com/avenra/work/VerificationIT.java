package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Verification through the API (Phase 5 criteria 5.3–5.10): rules validated when defined, a
 * structured verification for every answer, immediate rejection with reasons, opt-in automatic
 * acceptance, consistency re-checks, overrides, completion criteria and the sealed manifest.
 */
@IntegrationTest
class VerificationIT extends IntegrationTestBase {

    private static final Duration WAIT = Duration.ofSeconds(15);
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    @Autowired
    private io.micrometer.core.instrument.MeterRegistry registry;

    private record Setup(BrowserClient team, UUID organization, UUID work) {

        String path() {
            return org(organization) + "/work/" + work;
        }
    }

    private Setup setup() {
        var team = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = team.createOrganization("Verified Ltd");
        UUID work = createWork(team, organization, "Onboarding");
        ok(transition(team, organization, work, "DRAFT", "READY", null));
        ok(transition(team, organization, work, "READY", "RUNNING", null));
        return new Setup(team, organization, work);
    }

    private static Map<String, Object> rule(String type, String severity, String message, Object... params) {
        var rule = new HashMap<String, Object>(Map.of("type", type, "severity", severity, "message", message));
        for (int i = 0; i < params.length; i += 2) {
            rule.put((String) params[i], params[i + 1]);
        }
        return rule;
    }

    private BrowserClient.Response createRequirement(
            Setup s, String title, String kind, String acceptance, String risk, List<Map<String, Object>> rules) {
        return s.team()
                .post(
                        s.path() + "/requirements",
                        Map.of(
                                "title",
                                title,
                                "kind",
                                kind,
                                "required",
                                true,
                                "acceptance",
                                acceptance,
                                "risk",
                                risk,
                                "rules",
                                rules),
                        key());
    }

    private UUID requirement(Setup s, String title, String kind, String acceptance, List<Map<String, Object>> rules) {
        return id(created(createRequirement(s, title, kind, acceptance, "NORMAL", rules)));
    }

    private JsonNode answer(Setup s, UUID requirement, String value) {
        return created(s.team().post(s.path() + "/requirements/" + requirement + "/value", Map.of("value", value)))
                .body();
    }

    private JsonNode current(Setup s, UUID requirement) {
        return requirementOf(work(s.team(), s.organization(), s.work()), requirement);
    }

    private BrowserClient.Response review(Setup s, UUID requirement, String decision, String reason, String override) {
        var body = new HashMap<String, Object>(Map.of(
                "itemId", current(s, requirement).get("currentItem").get("id").asString(), "decision", decision));
        if (reason != null) {
            body.put("reason", reason);
        }
        if (override != null) {
            body.put("overrideReason", override);
        }
        return s.team().post(s.path() + "/requirements/" + requirement + "/review", body);
    }

    @Test
    void rulesAreValidatedWhenDefined() {
        var s = setup();
        var wrongKind = createRequirement(
                s,
                "Amount",
                "NUMBER",
                "MANUAL",
                "NORMAL",
                List.of(rule("PATTERN", "BLOCKING", "Digits", "pattern", "[0-9]+")));
        assertThat(wrongKind.status()).isEqualTo(400);
        assertThat(wrongKind.code()).isEqualTo("INVALID_RULE");
        assertThat(wrongKind.body().get("details").toString()).contains("does not apply");

        var badPattern = createRequirement(
                s,
                "Name",
                "TEXT",
                "MANUAL",
                "NORMAL",
                List.of(rule("PATTERN", "BLOCKING", "x", "pattern", "[unclosed")));
        assertThat(badPattern.code()).isEqualTo("INVALID_RULE");
        var foreign = createRequirement(
                s,
                "Name",
                "TEXT",
                "MANUAL",
                "NORMAL",
                List.of(rule(
                        "EQUALS_REQUIREMENT",
                        "BLOCKING",
                        "x",
                        "otherRequirementId",
                        UUID.randomUUID().toString())));
        assertThat(foreign.body().get("details").toString()).contains("same work");
        var risky = createRequirement(s, "Passport", "DOCUMENT", "AUTOMATIC", "HIGH", List.of());
        assertThat(risky.status()).isEqualTo(400);

        var valid = created(createRequirement(
                        s,
                        "Company number",
                        "TEXT",
                        "MANUAL",
                        "HIGH",
                        List.of(rule("PATTERN", "BLOCKING", "Use 8 digits", "pattern", "[0-9]{8}"))))
                .body();
        assertThat(valid.get("rulesVersion").asInt()).isEqualTo(1);
        assertThat(valid.get("risk").asString()).isEqualTo("HIGH");
        assertThat(valid.get("rules").get(0).get("pattern").asString()).isEqualTo("[0-9]{8}");
    }

    @Test
    void everyAnswerGetsAStructuredVerificationWithEvidence() {
        var s = setup();
        UUID number = requirement(
                s,
                "Company number",
                "TEXT",
                "MANUAL",
                List.of(
                        rule("PATTERN", "BLOCKING", "Use 8 digits", "pattern", "[0-9]{8}"),
                        rule("LENGTH", "ADVISORY", "8 characters", "minLength", 8, "maxLength", 8)));
        var item = answer(s, number, "12345678");
        var checks = item.get("checks");
        assertThat(checks.get("status").asString()).isEqualTo("PASSED");
        assertThat(checks.get("confidence").asDouble()).isEqualTo(1.0);
        assertThat(checks.get("checks").size()).isEqualTo(2);
        assertThat(checks.get("method").asString()).isEqualTo("RULES");
        assertThat(checks.get("evidence").get(0).get("type").asString()).isEqualTo("information_item");
        assertThat(item.get("confidence").asDouble()).isEqualTo(1.0);
        assertThat(item.get("verification").get("state").asString())
                .as("still a person's decision")
                .isEqualTo("PENDING");

        assertThat(registry.get("avenra.verification.completed")
                        .tag("status", "PASSED")
                        .counter()
                        .count())
                .isPositive();
        var history = ok(s.team().get(s.path() + "/requirements/" + number + "/verifications"))
                .body();
        assertThat(history.size()).isEqualTo(1);
        var evidence = ok(s.team().get(s.path() + "/evidence")).body().toString();
        assertThat(evidence).contains("ANSWER", "VERIFICATION");
        assertThat(evidence).contains(sha256("12345678"));
    }

    @Test
    void failedBlockingChecksRejectAClientsAnswerAtOnceWithReasons() {
        var s = setup();
        UUID number = requirement(
                s,
                "Company number",
                "TEXT",
                "MANUAL",
                List.of(rule("PATTERN", "BLOCKING", "Use the 8-digit registered number", "pattern", "[0-9]{8}")));
        UUID certificate = requirement(
                s,
                "Certificate",
                "DOCUMENT",
                "MANUAL",
                List.of(rule(
                        "FILE_TYPE",
                        "BLOCKING",
                        "Send the certificate as a PDF",
                        "contentTypes",
                        List.of("application/pdf"))));
        String client = "client-" + UUID.randomUUID() + "@verified.test";
        created(s.team()
                .post(
                        s.path() + "/request-links",
                        Map.of(
                                "recipientEmail",
                                client,
                                "requirementIds",
                                List.of(number.toString(), certificate.toString()),
                                "expiresInDays",
                                14),
                        key()));
        String token = linkToken(outbox, client);
        var browser = new BrowserClient(port);
        String base = "/api/v1/client-requests/current/requirements/";

        var wrong = created(browser.post(base + number + "/value", Map.of("value", "1234"), token(token)))
                .body();
        assertThat(wrong.get("state").asString()).isEqualTo("REJECTED");
        assertThat(wrong.get("problems").toString()).contains("Use the 8-digit registered number");
        assertThat(wrong.get("rejectionReason").asString()).contains("8-digit");
        var png = new byte[] {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0};
        var wrongFile = created(browser.upload(base + certificate + "/file", "cert.png", png, token(token)))
                .body();
        assertThat(wrongFile.get("problems").toString()).contains("Send the certificate as a PDF");

        var team = current(s, number);
        assertThat(team.get("state").asString()).isEqualTo("REJECTED");
        assertThat(team.get("currentItem").get("verification").get("decidedBy").asString())
                .isEqualTo("RULES");
        assertThat(team.get("currentItem").get("checks").get("status").asString())
                .isEqualTo("FAILED");

        var right = created(browser.post(base + number + "/value", Map.of("value", "12345678"), token(token)))
                .body();
        assertThat(right.get("state").asString()).isEqualTo("SUBMITTED");
        assertThat(right.path("problems").isEmpty())
                .as("no problems with a passing answer")
                .isTrue();
    }

    @Test
    void automaticAcceptanceOnlyWhenOptedInAndEverythingPasses() {
        var s = setup();
        UUID auto = requirement(
                s,
                "VAT number",
                "TEXT",
                "AUTOMATIC",
                List.of(rule("PATTERN", "BLOCKING", "GB and 9 digits", "pattern", "GB[0-9]{9}")));
        var accepted = answer(s, auto, "GB123456789");
        assertThat(accepted.get("verification").get("state").asString()).isEqualTo("ACCEPTED");
        assertThat(accepted.get("verification").get("decidedBy").asString()).isEqualTo("RULES");
        assertThat(ok(s.team().get(s.path() + "/evidence")).body().toString()).contains("SYSTEM_DECISION");

        // Without rules there is nothing to be confident about: a person decides.
        UUID noRules = requirement(s, "Trading name", "TEXT", "AUTOMATIC", List.of());
        assertThat(answer(s, noRules, "Globex").get("verification").get("state").asString())
                .isEqualTo("PENDING");
        // An advisory failure needs a person too.
        UUID advisory = requirement(
                s,
                "Website",
                "TEXT",
                "AUTOMATIC",
                List.of(rule("PATTERN", "ADVISORY", "Usually starts with https://", "pattern", "https://.+")));
        var needsReview = answer(s, advisory, "globex.test");
        assertThat(needsReview.get("checks").get("status").asString()).isEqualTo("NEEDS_REVIEW");
        assertThat(needsReview.get("verification").get("state").asString()).isEqualTo("PENDING");
        // Manual is the default.
        UUID manual = requirement(
                s,
                "Sector",
                "TEXT",
                "MANUAL",
                List.of(rule("ONE_OF", "BLOCKING", "Pick a sector", "values", List.of("Retail", "Finance"))));
        assertThat(answer(s, manual, "retail").get("verification").get("state").asString())
                .isEqualTo("PENDING");
    }

    @Test
    void overridesAreRequiredToAcceptFailedChecksAndAreAudited() {
        var s = setup();
        UUID website = requirement(
                s,
                "Website",
                "TEXT",
                "MANUAL",
                List.of(rule("PATTERN", "ADVISORY", "Usually starts with https://", "pattern", "https://.+")));
        answer(s, website, "globex.test");
        var refused = review(s, website, "ACCEPT", null, null);
        assertThat(refused.status()).isEqualTo(409);
        assertThat(refused.code()).isEqualTo("OVERRIDE_REQUIRED");
        var accepted = ok(review(s, website, "ACCEPT", null, "Their site has no TLS; confirmed by phone"))
                .body();
        assertThat(accepted.get("state").asString()).isEqualTo("ACCEPTED");
        assertThat(accepted.get("currentItem")
                        .get("verification")
                        .get("overrideReason")
                        .asString())
                .contains("confirmed by phone");

        // A rules rejection can be overridden by a person, and only with a reason.
        UUID number = requirement(
                s,
                "Company number",
                "TEXT",
                "MANUAL",
                List.of(rule("PATTERN", "BLOCKING", "Use 8 digits", "pattern", "[0-9]{8}")));
        answer(s, number, "SC123456");
        assertThat(current(s, number).get("state").asString()).isEqualTo("REJECTED");
        assertThat(review(s, number, "ACCEPT", null, null).code()).isEqualTo("OVERRIDE_REQUIRED");
        ok(review(s, number, "ACCEPT", null, "Scottish companies use an SC prefix"));
        assertThat(current(s, number).get("state").asString()).isEqualTo("ACCEPTED");
        assertThat(ownerQuery(
                                "select count(*) from audit_events where organization_id = ? and action = 'work.information.accepted'"
                                        + " and details->>'override' = 'true'",
                                s.organization())
                        .getFirst()
                        .getFirst())
                .isEqualTo(2L);
    }

    @Test
    void consistencyChecksRunAgainWhenARelatedAnswerChanges() {
        var s = setup();
        UUID legal = requirement(s, "Legal name", "TEXT", "MANUAL", List.of());
        UUID onCertificate = requirement(
                s,
                "Name on certificate",
                "TEXT",
                "MANUAL",
                List.of(rule(
                        "EQUALS_REQUIREMENT",
                        "BLOCKING",
                        "Must match the legal name",
                        "otherRequirementId",
                        legal.toString())));
        // The related answer is missing: the check waits instead of failing.
        var waiting = answer(s, onCertificate, "Acme Ltd");
        assertThat(waiting.get("checks").get("status").asString()).isEqualTo("NEEDS_REVIEW");
        assertThat(waiting.get("checks").get("checks").get(0).get("outcome").asString())
                .isEqualTo("SKIPPED");

        answer(s, legal, "acme  ltd");
        await().atMost(WAIT)
                .until(() -> current(s, onCertificate)
                        .get("currentItem")
                        .get("checks")
                        .get("status")
                        .asString()
                        .equals("PASSED"));

        // The legal name changes: the pending answer no longer matches and is rejected by the rules.
        answer(s, legal, "Acme Holdings Ltd");
        await().atMost(WAIT)
                .until(() -> current(s, onCertificate).get("state").asString().equals("REJECTED"));
        assertThat(current(s, onCertificate)
                        .get("currentItem")
                        .get("verification")
                        .get("reason")
                        .asString())
                .contains("Must match the legal name");
    }

    @Test
    void anAcceptedAnswerThatStopsMatchingRaisesAnExceptionAndBlocksCompletion() {
        var s = setup();
        UUID legal = requirement(s, "Legal name", "TEXT", "MANUAL", List.of());
        UUID onCertificate = requirement(
                s,
                "Name on certificate",
                "TEXT",
                "MANUAL",
                List.of(rule(
                        "EQUALS_REQUIREMENT",
                        "BLOCKING",
                        "Must match the legal name",
                        "otherRequirementId",
                        legal.toString())));
        answer(s, legal, "Acme Ltd");
        answer(s, onCertificate, "Acme Ltd");
        await().atMost(WAIT)
                .until(() -> current(s, onCertificate)
                        .get("currentItem")
                        .get("checks")
                        .get("status")
                        .asString()
                        .equals("PASSED"));
        ok(review(s, onCertificate, "ACCEPT", null, null));

        // The legal name, still awaiting review, is corrected: the accepted answer no longer matches.
        answer(s, legal, "Acme Holdings Ltd");
        await().atMost(WAIT)
                .until(() -> ok(s.team().get(org(s.organization()) + "/exceptions?workId=" + s.work()))
                        .body()
                        .toString()
                        .contains("INCONSISTENT_INFORMATION"));
        assertThat(current(s, onCertificate).get("state").asString())
                .as("not changed silently")
                .isEqualTo("ACCEPTED");
        var criteria = work(s.team(), s.organization(), s.work())
                .get("completionCriteria")
                .toString();
        assertThat(criteria).contains("CHECKS_PASSED", "NO_HIGH_EXCEPTIONS");
        assertThat(unmet(s)).contains("CHECKS_PASSED", "NO_HIGH_EXCEPTIONS");

        // Keeping it needs an override; then only the exception remains to be handled.
        assertThat(review(s, onCertificate, "ACCEPT", null, null).code()).isEqualTo("OVERRIDE_REQUIRED");
        ok(review(s, onCertificate, "ACCEPT", null, "The certificate predates the renaming"));
        assertThat(unmet(s)).doesNotContain("CHECKS_PASSED").contains("NO_HIGH_EXCEPTIONS");

        // Or the answer may be replaced, since it no longer passes.
        var other = setup();
        UUID otherLegal = requirement(other, "Legal name", "TEXT", "MANUAL", List.of());
        UUID otherCertificate = requirement(
                other,
                "Name on certificate",
                "TEXT",
                "MANUAL",
                List.of(rule(
                        "EQUALS_REQUIREMENT",
                        "BLOCKING",
                        "Must match the legal name",
                        "otherRequirementId",
                        otherLegal.toString())));
        answer(other, otherLegal, "Acme Ltd");
        answer(other, otherCertificate, "Acme Ltd");
        await().atMost(WAIT)
                .until(() -> current(other, otherCertificate)
                        .get("currentItem")
                        .get("checks")
                        .get("status")
                        .asString()
                        .equals("PASSED"));
        ok(review(other, otherCertificate, "ACCEPT", null, null));
        answer(other, otherLegal, "Acme Holdings Ltd");
        await().atMost(WAIT)
                .until(() -> current(other, otherCertificate)
                        .get("currentItem")
                        .get("checks")
                        .get("status")
                        .asString()
                        .equals("FAILED"));
        var replaced = answer(other, otherCertificate, "Acme Holdings Ltd");
        assertThat(replaced.get("checks").get("status").asString()).isEqualTo("PASSED");
    }

    private String unmet(Setup s) {
        var unmet = new StringBuilder();
        for (JsonNode criterion : work(s.team(), s.organization(), s.work()).get("completionCriteria")) {
            if (!criterion.get("met").asBoolean()) {
                unmet.append(criterion.get("name").asString()).append(' ');
            }
        }
        return unmet.toString();
    }

    @Test
    void completionIsGuardedByCriteriaAndSealsAVerifiableManifest() throws Exception {
        var s = setup();
        UUID number = requirement(
                s,
                "Company number",
                "TEXT",
                "AUTOMATIC",
                List.of(rule("PATTERN", "BLOCKING", "Use 8 digits", "pattern", "[0-9]{8}")));
        UUID certificate = requirement(
                s,
                "Certificate",
                "DOCUMENT",
                "MANUAL",
                List.of(rule("FILE_TYPE", "BLOCKING", "PDF only", "contentTypes", List.of("application/pdf"))));
        assertThat(s.team().get(s.path() + "/completion").status())
                .as("not completed yet")
                .isEqualTo(404);

        var criteria = work(s.team(), s.organization(), s.work()).get("completionCriteria");
        assertThat(criteria.toString()).contains("REQUIREMENTS_ACCEPTED");
        assertThat(criteria.get(0).get("met").asBoolean()).isFalse();

        answer(s, number, "12345678");
        byte[] pdf = pdf("certificate");
        created(s.team().upload(s.path() + "/requirements/" + certificate + "/file", "cert.pdf", pdf, Map.of()));
        ok(review(s, certificate, "ACCEPT", null, null));
        await().atMost(WAIT)
                .until(() -> work(s.team(), s.organization(), s.work())
                        .get("completionCriteria")
                        .get(0)
                        .get("met")
                        .asBoolean());
        await().atMost(WAIT)
                .until(() -> work(s.team(), s.organization(), s.work())
                                .get("progress")
                                .get("openTasks")
                                .asInt()
                        == 0);
        ok(transition(s.team(), s.organization(), s.work(), "RUNNING", "COMPLETED", null));

        var completion = ok(s.team().get(s.path() + "/completion")).body();
        String manifest = completion.get("manifest").asString();
        assertThat(completion.get("intact").asBoolean()).isTrue();
        assertThat(completion.get("sha256").asString()).isEqualTo(sha256(manifest));
        var parsed = JSON.readTree(manifest);
        assertThat(parsed.get("work").get("id").asString()).isEqualTo(s.work().toString());
        assertThat(parsed.get("requirements").size()).isEqualTo(2);
        assertThat(manifest)
                .contains(sha256("12345678"))
                .contains(HexFormat.of()
                        .formatHex(MessageDigest.getInstance("SHA-256").digest(pdf)))
                .contains("\"by\":\"RULES\"", "\"by\":\"PERSON\"", "\"status\":\"PASSED\"");

        // The manifest is immutable for the application; any change behind its back is detected.
        ownerUpdate(
                "update work_completions set manifest = replace(manifest, 'Company number', 'Company name')"
                        + " where work_id = ?",
                s.work());
        assertThat(ok(s.team().get(s.path() + "/completion"))
                        .body()
                        .get("intact")
                        .asBoolean())
                .isFalse();
    }

    @Test
    void anotherTenantSeesNoneOfIt() {
        var s = setup();
        UUID number = requirement(
                s,
                "Company number",
                "TEXT",
                "MANUAL",
                List.of(rule("PATTERN", "BLOCKING", "Use 8 digits", "pattern", "[0-9]{8}")));
        answer(s, number, "12345678");
        var mallory = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID malloryOrg = mallory.createOrganization("Mallory");
        for (String path : List.of("/evidence", "/completion", "/requirements/" + number + "/verifications")) {
            assertThat(mallory.get(org(s.organization()) + "/work/" + s.work() + path)
                            .status())
                    .as(path)
                    .isEqualTo(404);
            assertThat(mallory.get(org(malloryOrg) + "/work/" + s.work() + path).status())
                    .as(path)
                    .isEqualTo(404);
        }
        assertThat(mallory.put(
                                org(malloryOrg) + "/work/" + s.work() + "/requirements/" + number + "/rules",
                                Map.of("rules", List.of(), "acceptance", "MANUAL", "risk", "NORMAL"))
                        .status())
                .isEqualTo(404);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of()
                    .formatHex(MessageDigest.getInstance("SHA-256")
                            .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
