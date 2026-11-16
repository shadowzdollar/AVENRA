package com.avenra.organization;

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

/**
 * Tenant isolation and authorization through the API (Guidelines §36, §137; Phase 2 criteria 2.8,
 * 2.9, 2.11): organizations are invisible to non-members, permissions follow roles, role rules and
 * the last-owner rule hold, invitations are bound to the invitee's email.
 */
@IntegrationTest
class OrganizationAccessIT extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private BrowserClient user(String email) {
        return TestAccounts.signedIn(port, outbox, email);
    }

    private static String org(UUID id) {
        return "/api/v1/organizations/" + id;
    }

    /** Invites {@code email} with {@code role} and has that person accept; returns their browser. */
    private BrowserClient member(BrowserClient owner, UUID organization, String role) {
        String email = TestAccounts.newEmail();
        var invite = owner.post(
                org(organization) + "/invitations",
                Map.of("email", email, "role", role),
                Map.of("Idempotency-Key", BrowserClient.key()));
        assertThat(invite.status()).isEqualTo(201);
        var person = user(email);
        String token = outbox.latestToken(email, "invitation").orElseThrow();
        assertThat(person.post("/api/v1/invitations/acceptance", Map.of("token", token))
                        .status())
                .isEqualTo(200);
        return person;
    }

    @Test
    void tenantACannotSeeOrTouchTenantB() {
        var alice = user(TestAccounts.newEmail());
        var bob = user(TestAccounts.newEmail());
        UUID aliceOrg = alice.createOrganization("Alice Consulting");
        UUID bobOrg = bob.createOrganization("Bob Advisory");

        assertThat(alice.get("/api/v1/organizations").body())
                .extracting(node -> node.get("organization").get("id").asString())
                .containsExactly(aliceOrg.toString());

        // Every route into B's organization answers 404, as if it did not exist.
        assertThat(alice.get(org(bobOrg)).status()).isEqualTo(404);
        assertThat(alice.get(org(bobOrg) + "/members").status()).isEqualTo(404);
        assertThat(alice.get(org(bobOrg) + "/invitations").status()).isEqualTo(404);
        assertThat(alice.patch(org(bobOrg), Map.of("name", "Hijacked")).status())
                .isEqualTo(404);
        assertThat(alice.post(
                                org(bobOrg) + "/invitations",
                                Map.of("email", TestAccounts.newEmail(), "role", "OWNER"),
                                Map.of("Idempotency-Key", BrowserClient.key()))
                        .status())
                .isEqualTo(404);
        String bobMembership = bob.get(org(bobOrg) + "/members")
                .body()
                .get(0)
                .get("membershipId")
                .asString();
        assertThat(alice.patch(org(bobOrg) + "/members/" + bobMembership, Map.of("role", "VIEWER"))
                        .status())
                .isEqualTo(404);
        assertThat(alice.delete(org(bobOrg) + "/members/" + bobMembership).status())
                .isEqualTo(404);

        assertThat(bob.get(org(bobOrg)).body().get("name").asString()).isEqualTo("Bob Advisory");
    }

    @Test
    void permissionsFollowTheRole() {
        var owner = user(TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Role Test");
        var viewer = member(owner, organization, "VIEWER");

        assertThat(viewer.get(org(organization)).status()).isEqualTo(200);
        assertThat(viewer.get(org(organization) + "/members").status()).isEqualTo(200);
        assertThat(viewer.patch(org(organization), Map.of("name", "Renamed")).code())
                .isEqualTo("ACCESS_DENIED");
        assertThat(viewer.post(
                                org(organization) + "/invitations",
                                Map.of("email", TestAccounts.newEmail(), "role", "VIEWER"),
                                Map.of("Idempotency-Key", BrowserClient.key()))
                        .code())
                .isEqualTo("ACCESS_DENIED");

        var me = viewer.get("/api/v1/auth/session").body().get("organizations").get(0);
        assertThat(me.get("role").asString()).isEqualTo("VIEWER");
        assertThat(me.get("permissions"))
                .extracting(node -> node.asString())
                .contains("organization.read", "members.read")
                .doesNotContain("members.manage", "organization.manage");
    }

    @Test
    void adminsCannotGrantOrRemoveOwnership() {
        var owner = user(TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Admin Test");
        var admin = member(owner, organization, "ADMIN");
        var regular = member(owner, organization, "MEMBER");
        String regularMembership = membershipOf(owner, organization, regular);
        String ownerMembership = membershipOf(owner, organization, owner);

        assertThat(admin.patch(org(organization) + "/members/" + regularMembership, Map.of("role", "MANAGER"))
                        .status())
                .isEqualTo(200);
        assertThat(admin.patch(org(organization) + "/members/" + regularMembership, Map.of("role", "OWNER"))
                        .code())
                .isEqualTo("ACCESS_DENIED");
        assertThat(admin.delete(org(organization) + "/members/" + ownerMembership)
                        .code())
                .isEqualTo("ACCESS_DENIED");
        assertThat(admin.post(
                                org(organization) + "/invitations",
                                Map.of("email", TestAccounts.newEmail(), "role", "OWNER"),
                                Map.of("Idempotency-Key", BrowserClient.key()))
                        .code())
                .isEqualTo("ACCESS_DENIED");
    }

    @Test
    void anOrganizationAlwaysKeepsAnOwner() {
        var owner = user(TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Last Owner");
        String ownerMembership = membershipOf(owner, organization, owner);

        assertThat(owner.patch(org(organization) + "/members/" + ownerMembership, Map.of("role", "ADMIN"))
                        .code())
                .isEqualTo("LAST_OWNER");
        assertThat(owner.delete(org(organization) + "/members/" + ownerMembership)
                        .code())
                .isEqualTo("LAST_OWNER");

        var second = member(owner, organization, "OWNER");
        assertThat(second.patch(org(organization) + "/members/" + ownerMembership, Map.of("role", "ADMIN"))
                        .status())
                .isEqualTo(200);
    }

    @Test
    void removalTakesEffectOnTheNextRequest() {
        var owner = user(TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Removal");
        var leaving = member(owner, organization, "MEMBER");
        assertThat(leaving.get(org(organization)).status()).isEqualTo(200);

        assertThat(owner.delete(org(organization) + "/members/" + membershipOf(owner, organization, leaving))
                        .status())
                .isEqualTo(204);

        assertThat(leaving.get(org(organization)).status()).isEqualTo(404);
        assertThat(leaving.get("/api/v1/organizations").body()).isEmpty();
    }

    @Test
    void anInvitationOnlyWorksForTheInvitedEmailAndOnlyOnce() {
        var owner = user(TestAccounts.newEmail());
        UUID organization = owner.createOrganization("Invitations");
        String invited = TestAccounts.newEmail();
        owner.post(
                org(organization) + "/invitations",
                Map.of("email", invited, "role", "MEMBER"),
                Map.of("Idempotency-Key", BrowserClient.key()));
        String token = outbox.latestToken(invited, "invitation").orElseThrow();

        var stranger = user(TestAccounts.newEmail());
        assertThat(stranger.post("/api/v1/invitations/acceptance", Map.of("token", token))
                        .code())
                .isEqualTo("INVITATION_EMAIL_MISMATCH");
        assertThat(stranger.get(org(organization)).status()).isEqualTo(404);

        var person = user(invited);
        assertThat(person.post("/api/v1/invitations/acceptance", Map.of("token", token))
                        .status())
                .isEqualTo(200);
        assertThat(person.post("/api/v1/invitations/acceptance", Map.of("token", token))
                        .code())
                .isEqualTo("INVALID_TOKEN");
    }

    @Test
    void creatingWithTheSameIdempotencyKeyReturnsTheSameOrganization() {
        var owner = user(TestAccounts.newEmail());
        String key = BrowserClient.key();
        var first = owner.post("/api/v1/organizations", Map.of("name", "Once"), Map.of("Idempotency-Key", key));
        var again = owner.post("/api/v1/organizations", Map.of("name", "Once"), Map.of("Idempotency-Key", key));
        var different = owner.post("/api/v1/organizations", Map.of("name", "Other"), Map.of("Idempotency-Key", key));

        assertThat(first.status()).isEqualTo(201);
        assertThat(again.body().get("id")).isEqualTo(first.body().get("id"));
        assertThat(owner.get("/api/v1/organizations").body()).hasSize(1);
        assertThat(different.code()).isEqualTo("IDEMPOTENCY_KEY_REUSED");
    }

    private static String membershipOf(BrowserClient viewer, UUID organization, BrowserClient person) {
        String userId = person.get("/api/v1/auth/session").body().get("id").asString();
        for (var member : viewer.get(org(organization) + "/members").body()) {
            if (member.get("userId").asString().equals(userId)) {
                return member.get("membershipId").asString();
            }
        }
        throw new AssertionError("not a member");
    }
}
