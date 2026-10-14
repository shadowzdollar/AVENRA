package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * Client request links through the API (Phase 3 criterion 3.10, ADR-020): the token reaches only
 * the recipient's email, is never returned, opens only the link's own requirements, expires, can be
 * revoked, and every use is audited and attributed to the link.
 */
@IntegrationTest
class RequestLinksIT extends IntegrationTestBase {

    private static final String CLIENT = "jane.doe@client.test";

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(
            BrowserClient team,
            UUID organization,
            UUID work,
            UUID asked,
            UUID document,
            UUID notAsked,
            UUID link,
            String token) {}

    private Setup setup() {
        var team = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = team.createOrganization("Northwind Advisors");
        UUID work = createWork(team, organization, "Onboarding Acme");
        UUID asked = requirement(team, organization, work, "Company number", "TEXT", true);
        UUID document = requirement(team, organization, work, "Certificate", "DOCUMENT", true);
        UUID notAsked = requirement(team, organization, work, "Internal risk note", "TEXT", true);
        String recipient = "x" + UUID.randomUUID().toString().substring(0, 8) + "." + CLIENT;
        var link = created(team.post(
                        org(organization) + "/work/" + work + "/request-links",
                        Map.of(
                                "recipientEmail",
                                recipient,
                                "recipientName",
                                "Jane",
                                "message",
                                "Please send these by Friday.",
                                "requirementIds",
                                List.of(asked.toString(), document.toString(), asked.toString())),
                        key()))
                .body();
        assertThat(link.toString()).doesNotContainIgnoringCase("token");
        assertThat(link.get("status").asString()).isEqualTo("ACTIVE");
        assertThat(link.get("requirementIds").size()).isEqualTo(2);
        return new Setup(
                team,
                organization,
                work,
                asked,
                document,
                notAsked,
                UUID.fromString(link.get("id").asString()),
                linkToken(outbox, recipient));
    }

    private BrowserClient client() {
        return new BrowserClient(port);
    }

    @Test
    void theClientSeesOnlyWhatWasAskedAndCanAnswerWithoutAnAccount() {
        var s = setup();
        var client = client();
        var view = ok(client.get("/api/v1/client-requests/current", token(s.token())))
                .body();
        assertThat(view.get("organizationName").asString()).isEqualTo("Northwind Advisors");
        assertThat(view.get("workTitle").asString()).isEqualTo("Onboarding Acme");
        assertThat(view.get("recipient").asString()).startsWith("x•••@");
        assertThat(view.get("message").asString()).isEqualTo("Please send these by Friday.");
        assertThat(view.get("items").size()).isEqualTo(2);
        assertThat(view.toString())
                .doesNotContain("Internal risk note", s.notAsked().toString());

        String base = "/api/v1/client-requests/current/requirements/";
        var answered = created(client.post(base + s.asked() + "/value", Map.of("value", "09876543"), token(s.token())))
                .body();
        assertThat(answered.get("state").asString()).isEqualTo("SUBMITTED");
        var uploaded = created(client.upload(base + s.document() + "/file", "cert.pdf", pdf("cert"), token(s.token())))
                .body();
        assertThat(uploaded.get("state").asString()).isEqualTo("SUBMITTED");
        assertThat(uploaded.get("acceptedFileTypes").toString()).contains("pdf");

        // Not part of the link: invisible.
        assertThat(client.post(base + s.notAsked() + "/value", Map.of("value", "x"), token(s.token()))
                        .status())
                .isEqualTo(404);

        // The team sees the answers with their source.
        var items = ok(s.team()
                        .get(org(s.organization()) + "/work/" + s.work() + "/requirements/" + s.asked() + "/items"))
                .body();
        assertThat(items.get(0).get("source").get("type").asString()).isEqualTo("CLIENT_LINK");
        assertThat(items.get(0).get("source").get("requestLinkId").asString())
                .isEqualTo(s.link().toString());
        assertThat(items.get(0).get("source").get("userId").isNull()).isTrue();
        assertThat(auditActions(s.organization()))
                .contains(
                        "work.request_link.created",
                        "work.request_link.opened",
                        "work.information.submitted",
                        "work.document.uploaded");
        var links = ok(s.team().get(org(s.organization()) + "/work/" + s.work() + "/request-links"))
                .body();
        assertThat(links.get(0).get("lastOpenedAt").isNull()).isFalse();
    }

    @Test
    void aRejectedAnswerTellsTheClientWhyAndCanBeCorrected() {
        var s = setup();
        var client = client();
        String base = "/api/v1/client-requests/current/requirements/";
        created(client.post(base + s.asked() + "/value", Map.of("value", "wrong"), token(s.token())));
        var work = work(s.team(), s.organization(), s.work());
        String item =
                requirementOf(work, s.asked()).get("currentItem").get("id").asString();
        ok(s.team()
                .post(
                        org(s.organization()) + "/work/" + s.work() + "/requirements/" + s.asked() + "/review",
                        Map.of("itemId", item, "decision", "REJECT", "reason", "Use the registered number")));

        var view = ok(client.get("/api/v1/client-requests/current", token(s.token())))
                .body();
        var asked = view.get("items").get(0);
        assertThat(asked.get("state").asString()).isEqualTo("REJECTED");
        assertThat(asked.get("rejectionReason").asString()).isEqualTo("Use the registered number");
        created(client.post(base + s.asked() + "/value", Map.of("value", "01234567"), token(s.token())));
        assertThat(ok(client.get("/api/v1/client-requests/current", token(s.token())))
                        .body()
                        .get("items")
                        .get(0)
                        .get("state")
                        .asString())
                .isEqualTo("SUBMITTED");
    }

    @Test
    void unknownExpiredAndRevokedLinksAllLookTheSame() {
        var s = setup();
        var client = client();
        var unknown = client.get("/api/v1/client-requests/current", token("A".repeat(43)));
        assertThat(unknown.status()).isEqualTo(404);
        assertThat(unknown.code()).isEqualTo("REQUEST_LINK_INVALID");
        assertThat(client.get("/api/v1/client-requests/current", Map.of()).status())
                .isEqualTo(400);

        // Expired.
        ownerUpdate(
                "update request_links set created_at = now() - interval '20 days', expires_at = now() - interval"
                        + " '1 minute' where id = ?",
                s.link());
        assertThat(client.get("/api/v1/client-requests/current", token(s.token()))
                        .code())
                .isEqualTo("REQUEST_LINK_INVALID");
        var listed = ok(s.team().get(org(s.organization()) + "/work/" + s.work() + "/request-links"))
                .body();
        assertThat(listed.get(0).get("status").asString()).isEqualTo("EXPIRED");

        // Revoked (on a fresh link).
        var other = setup();
        var revoke = other.team()
                .delete(org(other.organization()) + "/work/" + other.work() + "/request-links/" + other.link());
        assertThat(revoke.status()).isEqualTo(204);
        assertThat(other.team()
                        .delete(org(other.organization()) + "/work/" + other.work() + "/request-links/" + other.link())
                        .status())
                .isEqualTo(204);
        assertThat(client.get("/api/v1/client-requests/current", token(other.token()))
                        .code())
                .isEqualTo("REQUEST_LINK_INVALID");
        assertThat(client.upload(
                                "/api/v1/client-requests/current/requirements/" + other.document() + "/file",
                                "a.pdf",
                                pdf("x"),
                                token(other.token()))
                        .code())
                .isEqualTo("REQUEST_LINK_INVALID");
        assertThat(auditActions(other.organization())).contains("work.request_link.revoked");
    }

    @Test
    void finishedWorkClosesItsLinks() {
        var s = setup();
        ok(transition(s.team(), s.organization(), s.work(), "DRAFT", "CANCELLED", "Not needed"));
        assertThat(client().get("/api/v1/client-requests/current", token(s.token()))
                        .code())
                .isEqualTo("REQUEST_LINK_INVALID");
    }

    @Test
    void linksCoverOnlyRequirementsOfTheirOwnWork() {
        var s = setup();
        UUID otherWork = createWork(s.team(), s.organization(), "Other");
        UUID foreign = requirement(s.team(), s.organization(), otherWork, "X", "TEXT", true);
        var response = s.team()
                .post(
                        org(s.organization()) + "/work/" + s.work() + "/request-links",
                        Map.of("recipientEmail", "a@client.test", "requirementIds", List.of(foreign.toString())),
                        key());
        assertThat(response.status()).isEqualTo(400);
        assertThat(s.team()
                        .post(
                                org(s.organization()) + "/work/" + s.work() + "/request-links",
                                Map.of(
                                        "recipientEmail",
                                        "a@client.test",
                                        "requirementIds",
                                        List.of(s.asked().toString()),
                                        "expiresInDays",
                                        31),
                                key())
                        .status())
                .isEqualTo(400);
    }

    @Test
    void malwareFromAClientIsRejectedAndAuditedInTheOrganization() {
        var s = setup();
        var response = client().upload(
                        "/api/v1/client-requests/current/requirements/" + s.document() + "/file",
                        "invoice.txt",
                        eicar(),
                        token(s.token()));
        assertThat(response.status()).isEqualTo(422);
        assertThat(response.code()).isEqualTo("FILE_REJECTED");
        assertThat(auditActions(s.organization())).contains("document.malware_detected");
        assertThat(requirementOf(work(s.team(), s.organization(), s.work()), s.document())
                        .get("state")
                        .asString())
                .isEqualTo("MISSING");
    }
}
