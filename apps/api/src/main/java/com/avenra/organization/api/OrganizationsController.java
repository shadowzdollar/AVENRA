package com.avenra.organization.api;

import com.avenra.contract.v1.api.OrganizationsApi;
import com.avenra.contract.v1.model.ChangeRoleRequest;
import com.avenra.contract.v1.model.CreateOrganizationRequest;
import com.avenra.contract.v1.model.Invitation;
import com.avenra.contract.v1.model.InviteRequest;
import com.avenra.contract.v1.model.Member;
import com.avenra.contract.v1.model.Organization;
import com.avenra.contract.v1.model.OrganizationMembership;
import com.avenra.contract.v1.model.TokenRequest;
import com.avenra.contract.v1.model.UpdateOrganizationRequest;
import com.avenra.organization.application.InvitationService;
import com.avenra.organization.application.MemberService;
import com.avenra.organization.application.OrganizationService;
import com.avenra.organization.domain.Role;
import com.avenra.platform.security.CurrentUser;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Implements the contract's organization operations (ADR-008). The caller always comes from the
 * session ({@link CurrentUser}); the organization id in the path is only a request, checked against
 * the caller's membership by the services (ADR-005).
 */
@RestController
class OrganizationsController implements OrganizationsApi {

    private final OrganizationService organizations;
    private final MemberService members;
    private final InvitationService invitations;

    OrganizationsController(OrganizationService organizations, MemberService members, InvitationService invitations) {
        this.organizations = organizations;
        this.members = members;
        this.invitations = invitations;
    }

    @Override
    public ResponseEntity<List<OrganizationMembership>> listOrganizations() {
        return ResponseEntity.ok(organizations.membershipsOf(userId()));
    }

    @Override
    public ResponseEntity<Organization> createOrganization(String idempotencyKey, CreateOrganizationRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizations.create(userId(), idempotencyKey, body.getName()));
    }

    @Override
    public ResponseEntity<Organization> getOrganization(UUID organizationId) {
        return ResponseEntity.ok(organizations.get(userId(), organizationId));
    }

    @Override
    public ResponseEntity<Organization> updateOrganization(UUID organizationId, UpdateOrganizationRequest body) {
        return ResponseEntity.ok(
                organizations.update(userId(), organizationId, body.getName(), body.getRequestLinkDays()));
    }

    @Override
    public ResponseEntity<List<Member>> listMembers(UUID organizationId) {
        return ResponseEntity.ok(members.list(userId(), organizationId));
    }

    @Override
    public ResponseEntity<Member> changeMemberRole(UUID organizationId, UUID membershipId, ChangeRoleRequest body) {
        return ResponseEntity.ok(members.changeRole(userId(), organizationId, membershipId, role(body.getRole())));
    }

    @Override
    public ResponseEntity<Void> removeMember(UUID organizationId, UUID membershipId) {
        members.remove(userId(), organizationId, membershipId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<List<Invitation>> listInvitations(UUID organizationId) {
        return ResponseEntity.ok(invitations.listPending(userId(), organizationId));
    }

    @Override
    public ResponseEntity<Invitation> inviteMember(UUID organizationId, String idempotencyKey, InviteRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invitations.invite(
                        userId(), organizationId, idempotencyKey, body.getEmail(), role(body.getRole())));
    }

    @Override
    public ResponseEntity<Void> revokeInvitation(UUID organizationId, UUID invitationId) {
        invitations.revoke(userId(), organizationId, invitationId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<OrganizationMembership> acceptInvitation(TokenRequest body) {
        return ResponseEntity.ok(invitations.accept(userId(), body.getToken()));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }

    private static Role role(com.avenra.contract.v1.model.Role role) {
        return Role.valueOf(role.getValue());
    }
}
