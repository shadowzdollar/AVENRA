package com.avenra.organization.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.Member;
import com.avenra.identity.UserDirectory;
import com.avenra.organization.domain.Permission;
import com.avenra.organization.domain.Role;
import com.avenra.organization.infrastructure.OrganizationRepository;
import com.avenra.organization.infrastructure.OrganizationRepository.MembershipRow;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Members and roles. Rules: a member can only assign roles at or below their own and only owners
 * manage owners ({@link Role#mayAssign}); an organization always keeps at least one owner.
 * Removing a member takes effect on their next request, because access is checked per request.
 */
@Service
public class MemberService {

    private final OrganizationRepository organizations;
    private final OrganizationAccess access;
    private final UserDirectory users;
    private final AuditLog audit;
    private final Clock clock;

    MemberService(
            OrganizationRepository organizations,
            OrganizationAccess access,
            UserDirectory users,
            AuditLog audit,
            Clock clock) {
        this.organizations = organizations;
        this.access = access;
        this.users = users;
        this.audit = audit;
        this.clock = clock;
    }

    public List<Member> list(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.MEMBERS_READ, granted -> {
            List<MembershipRow> members = organizations.listMembers(organizationId);
            Map<UUID, UserDirectory.UserSummary> people =
                    users.findAll(members.stream().map(MembershipRow::userId).toList());
            return members.stream()
                    .filter(member -> people.containsKey(member.userId()))
                    .map(member -> toApi(member, people.get(member.userId())))
                    .toList();
        });
    }

    public Member changeRole(UUID userId, UUID organizationId, UUID membershipId, Role newRole) {
        return access.run(userId, organizationId, Permission.MEMBERS_MANAGE, granted -> {
            MembershipRow target = organizations
                    .findMembershipForUpdate(organizationId, membershipId)
                    .orElseThrow(ApiException::notFound);
            if (!granted.role().mayAssign(target.role()) || !granted.role().mayAssign(newRole)) {
                throw ApiException.accessDenied();
            }
            if (target.role() == Role.OWNER && newRole != Role.OWNER) {
                requireAnotherOwner(organizationId);
            }
            organizations.changeRole(membershipId, newRole, OffsetDateTime.now(clock));
            audit.record(AuditLog.Event.of("organization.member.role_changed", organizationId, userId)
                    .resource("membership", membershipId)
                    .detail("from", target.role().name())
                    .detail("to", newRole.name()));
            var person = users.find(target.userId()).orElseThrow(ApiException::notFound);
            return toApi(
                    new MembershipRow(target.id(), organizationId, target.userId(), newRole, target.createdAt()),
                    person);
        });
    }

    public void remove(UUID userId, UUID organizationId, UUID membershipId) {
        access.runWithoutResult(userId, organizationId, Permission.MEMBERS_MANAGE, granted -> {
            MembershipRow target = organizations
                    .findMembershipForUpdate(organizationId, membershipId)
                    .orElseThrow(ApiException::notFound);
            if (!granted.role().mayAssign(target.role())) {
                throw ApiException.accessDenied();
            }
            if (target.role() == Role.OWNER) {
                requireAnotherOwner(organizationId);
            }
            organizations.deleteMembership(membershipId);
            audit.record(AuditLog.Event.of("organization.member.removed", organizationId, userId)
                    .resource("membership", membershipId)
                    .detail("removedUserId", target.userId().toString()));
        });
    }

    private void requireAnotherOwner(UUID organizationId) {
        if (organizations.countOwnersForUpdate(organizationId) <= 1) {
            throw ApiException.conflict("LAST_OWNER", "An organization must keep at least one owner.");
        }
    }

    static Member toApi(MembershipRow member, UserDirectory.UserSummary person) {
        return new Member(
                member.id(),
                member.userId(),
                person.email(),
                person.displayName(),
                com.avenra.contract.v1.model.Role.fromValue(member.role().name()),
                member.createdAt().withOffsetSameInstant(ZoneOffset.UTC));
    }
}
