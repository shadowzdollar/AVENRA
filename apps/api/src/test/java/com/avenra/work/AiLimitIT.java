package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestAiService;
import com.avenra.TestOutbox;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

/** The daily limit on AI calls per organization (ADR-030): over it, nothing is sent. */
@IntegrationTest
@TestPropertySource(properties = "avenra.ai.daily-call-limit=1")
class AiLimitIT extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    @AfterEach
    void resetStub() {
        TestAiService.reset();
    }

    @Test
    void overTheDailyLimitDocumentsAreNotSentAndTheChecksSaySo() {
        var owner = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Limited Ltd");
        UUID work = createWork(owner, organization, "Onboarding");
        ok(transition(owner, organization, work, "DRAFT", "READY", null));
        ok(transition(owner, organization, work, "READY", "RUNNING", null));
        ok(owner.put(org(organization) + "/ai/settings", Map.of("documentReading", true)));
        String path = org(organization) + "/work/" + work;
        var rules = List.of(Map.of(
                "type",
                "DOCUMENT_KIND",
                "severity",
                "ADVISORY",
                "message",
                "Not a passport",
                "values",
                List.of("passport")));

        var readings = new java.util.ArrayList<String>();
        for (int i = 0; i < 2; i++) {
            UUID requirement = id(created(owner.post(
                    path + "/requirements",
                    Map.of(
                            "title",
                            "Passport " + i,
                            "kind",
                            "DOCUMENT",
                            "required",
                            true,
                            "acceptance",
                            "MANUAL",
                            "risk",
                            "NORMAL",
                            "rules",
                            rules),
                    key())));
            created(owner.upload(
                    path + "/requirements/" + requirement + "/file",
                    "p.txt",
                    "PASSPORT\n".getBytes(StandardCharsets.UTF_8),
                    Map.of()));
            readings.add(await().atMost(Duration.ofSeconds(20))
                    .until(
                            () -> requirementOf(work(owner, organization, work), requirement)
                                    .get("currentItem")
                                    .path("reading"),
                            node -> !node.path("status").asString("PENDING").equals("PENDING"))
                    .toString());
        }
        assertThat(readings.get(0)).contains("\"DONE\"");
        assertThat(readings.get(1)).contains("\"SKIPPED\"", "today's limit");
        assertThat(TestAiService.requests()).hasSize(1);
        var usage = ok(owner.get(org(organization) + "/ai/usage")).body();
        assertThat(usage.get("dailyCallLimit").asInt()).isEqualTo(1);
        assertThat(usage.get("today").get("calls").asInt()).isEqualTo(1);
    }
}
