package com.avenra.organization.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.Invitation;
import com.avenra.contract.v1.model.OrganizationMembership;
import com.avenra.identity.UserDirectory;
import com.avenra.organization.domain.Permission;
import com.avenra.organization.domain.Role;
import com.avenra.organization.infrastructure.InvitationRepository;
import com.avenra.organization.infrastructure.InvitationRepository.InvitationRow;
import com.avenra.organization.infrastructure.OrganizationRepository;
import com.avenra.organization.infrastructure.OrganizationRepository.MembershipWithOrganization;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.email.EmailMessage;
import com.avenra.platform.email.OutgoingEmail;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Inviting people by email and accepting invitations. An invitation can only be accepted by a
 * signed-in user whose verified email matches it; the token alone is not enough.
 */
@Service
public class InvitationService {

    static final Duration VALIDITY = Duration.ofDays(7);

    private final InvitationRepository invitations;
    private final OrganizationRepository organizations;
    private final OrganizationAccess access;
    private final TenantTransactions transactions;
    private final Idempotency idempotency;
    private final UserDirectory users;
    private final OutgoingEmail outgoing;
    private final AuditLog audit;
    private final URI publicBaseUrl;
    private final Clock clock;

    InvitationService(
            InvitationRepository invitations,
            OrganizationRepository organizations,
            OrganizationAccess access,
            TenantTransactions transactions,
            Idempotency idempotency,
            UserDirectory users,
            OutgoingEmail outgoing,
            AuditLog audit,
            AvenraProperties properties,
            Clock clock) {
        this.invitations = invitations;
        this.organizations = organizations;
        this.access = access;
        this.transactions = transactions;
        this.idempotency = idempotency;
        this.users = users;
        this.outgoing = outgoing;
        this.audit = audit;
        this.publicBaseUrl = properties.web().publicBaseUrl();
        this.clock = clock;
    }

    public Invitation invite(UUID userId, UUID organizationId, String idempotencyKey, String rawEmail, Role role) {
        String email = UserDirectory.normalizeEmail(rawEmail);
        return access.run(
                userId,
                organizationId,
                Permission.MEMBERS_MANAGE,
                granted -> idempotency.once(
                        userId,
                        "inviteMember",
                        idempotencyKey,
                        organizationId + "|" + email + "|" + role,
                        Invitation.class,
                        () -> {
                            if (!granted.role().mayAssign(role)) {
                                throw ApiException.accessDenied();
                            }
                            boolean alreadyMember = users
                                    .findAll(organizations.listMembers(organizationId).stream()
                                            .map(OrganizationRepository.MembershipRow::userId)
                                            .toList())
                                    .values()
                                    .stream()
                                    .anyMatch(person -> person.emailNormalized().equals(email));
                            if (alreadyMember) {
                                throw ApiException.conflict("ALREADY_MEMBER", "This person is already a member.");
                            }
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            String token = SecureTokens.generate();
                            var row = new InvitationRow(
                                    UUID.randomUUID(), organizationId, email, role, userId, now, now.plus(VALIDITY));
                            invitations.insert(row, SecureTokens.hash(token), now);
                            String organizationName = organizations
                                    .findOrganization(organizationId)
                                    .orElseThrow(ApiException::notFound)
                                    .name();
                            String inviter = users.find(userId)
                                    .map(UserDirectory.UserSummary::displayName)
                                    .orElse("Someone");
                            outgoing.sendAfterCommit(invitationEmail(email, inviter, organizationName, token));
                            audit.record(AuditLog.Event.of("organization.invitation.created", organizationId, userId)
                                    .resource("invitation", row.id())
                                    .detail("role", role.name()));
                            return toApi(row);
                        }));
    }

    public List<Invitation> listPending(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.MEMBERS_READ,
                granted -> invitations.listPending(organizationId, OffsetDateTime.now(clock)).stream()
                        .map(InvitationService::toApi)
                        .toList());
    }

    public void revoke(UUID userId, UUID organizationId, UUID invitationId) {
        access.runWithoutResult(userId, organizationId, Permission.MEMBERS_MANAGE, granted -> {
            if (!invitations.revoke(organizationId, invitationId, OffsetDateTime.now(clock))) {
                throw ApiException.notFound();
            }
            audit.record(AuditLog.Event.of("organization.invitation.revoked", organizationId, userId)
                    .resource("invitation", invitationId));
        });
    }

    public OrganizationMembership accept(UUID userId, String token) {
        byte[] tokenHash = SecureTokens.hash(token);
        var scope =
                TenantScope.user(userId).withInvitationTokenHash(HexFormat.of().formatHex(tokenHash));
        return transactions.run(scope, () -> {
            OffsetDateTime now = OffsetDateTime.now(clock);
            InvitationRow invitation = invitations
                    .findPendingByTokenForUpdate(tokenHash, now)
                    .orElseThrow(() -> new ApiException(
                            "INVALID_TOKEN", HttpStatus.BAD_REQUEST, "This invitation is invalid or has expired."));
            var person = users.find(userId).orElseThrow(ApiException::notFound);
            if (!person.emailVerified() || !person.emailNormalized().equals(invitation.emailNormalized())) {
                throw new ApiException(
                        "INVITATION_EMAIL_MISMATCH",
                        HttpStatus.FORBIDDEN,
                        "This invitation was sent to a different email address. Sign in with that address.");
            }
            transactions.enterOrganization(invitation.organizationId());
            var existing = organizations.findMembership(invitation.organizationId(), userId);
            UUID membershipId =
                    existing.map(OrganizationRepository.MembershipRow::id).orElseGet(UUID::randomUUID);
            Role role = existing.map(OrganizationRepository.MembershipRow::role).orElse(invitation.role());
            if (existing.isEmpty()) {
                organizations.insertMembership(membershipId, invitation.organizationId(), userId, role, now);
            }
            invitations.markAccepted(invitation.id(), now);
            audit.record(AuditLog.Event.of("organization.invitation.accepted", invitation.organizationId(), userId)
                    .resource("invitation", invitation.id()));
            var organization =
                    organizations.findOrganization(invitation.organizationId()).orElseThrow(ApiException::notFound);
            return OrganizationService.toApi(new MembershipWithOrganization(membershipId, role, organization));
        });
    }

    private EmailMessage invitationEmail(String to, String inviter, String organization, String token) {
        String link = UriComponentsBuilder.fromUri(publicBaseUrl)
                .path("/accept-invitation")
                .queryParam("token", token)
                .build()
                .toUriString();
        return new EmailMessage(
                to,
                inviter + " invited you to " + organization + " on Avenra",
                "Hello,\n\n" + inviter + " invited you to join " + organization + " on Avenra.\n\nAccept the "
                        + "invitation here (sign in or create an account with this email address):\n\n" + link
                        + "\n\nThe invitation expires in 7 days. If you were not expecting it, ignore this email.\n",
                "invitation");
    }

    static Invitation toApi(InvitationRow row) {
        return new Invitation(
                row.id(),
                row.emailNormalized(),
                com.avenra.contract.v1.model.Role.fromValue(row.role().name()),
                row.createdAt().withOffsetSameInstant(ZoneOffset.UTC),
                row.expiresAt().withOffsetSameInstant(ZoneOffset.UTC));
    }
}
