package com.avenra.organization;

import com.avenra.organization.domain.Permission;
import com.avenra.organization.domain.Role;
import com.avenra.organization.infrastructure.OrganizationRepository;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.stereotype.Component;

/**
 * The single authorization path for organization-scoped operations (Guidelines §36): identity →
 * membership in the organization named by the request → permission → then, and only then, the
 * transaction's tenant scope is narrowed to that organization for row-level security (ADR-005).
 *
 * <p>Not being a member answers {@code 404}, so organization ids cannot be probed; being a member
 * without the permission answers {@code 403}.
 */
@Component
public class OrganizationAccess {

    /** The verified caller inside an organization. */
    public record Access(UUID userId, UUID organizationId, UUID membershipId, Role role) {}

    private final OrganizationRepository organizations;
    private final TenantTransactions transactions;

    OrganizationAccess(OrganizationRepository organizations, TenantTransactions transactions) {
        this.organizations = organizations;
        this.transactions = transactions;
    }

    public <T> T run(UUID userId, UUID organizationId, Permission permission, Function<Access, T> work) {
        return transactions.run(TenantScope.user(userId), () -> {
            var membership =
                    organizations.findMembership(organizationId, userId).orElseThrow(ApiException::notFound);
            if (!membership.role().grants(permission)) {
                throw ApiException.accessDenied();
            }
            transactions.enterOrganization(organizationId);
            return work.apply(new Access(userId, organizationId, membership.id(), membership.role()));
        });
    }

    /**
     * Whether {@code membershipId} is a membership of the organization. Must run inside {@link #run}
     * for that organization (row-level security hides other organizations' memberships anyway).
     */
    public boolean isMembership(UUID organizationId, UUID membershipId) {
        return organizations.membershipExists(organizationId, membershipId);
    }

    /**
     * The name of an organization visible to the current transaction: the caller's current
     * organization, or the one that issued the request link it holds.
     */
    public String organizationName(UUID organizationId) {
        return organizations
                .findOrganization(organizationId)
                .orElseThrow(ApiException::notFound)
                .name();
    }

    /** How long the organization's request links stay valid unless the sender chooses (ADR-036). */
    public int requestLinkDays(UUID organizationId) {
        return organizations
                .findOrganization(organizationId)
                .orElseThrow(ApiException::notFound)
                .requestLinkDays();
    }

    /**
     * The people of the organization whose role grants a permission, for deciding who is told about
     * something (notifications). Must run in that organization's scope.
     */
    public java.util.List<UUID> usersWithPermission(UUID organizationId, Permission permission) {
        return organizations.listMembers(organizationId).stream()
                .filter(member -> member.role().grants(permission))
                .map(member -> member.userId())
                .toList();
    }

    /** The person behind a membership of the organization, if it still exists. */
    public java.util.Optional<UUID> userOfMembership(UUID organizationId, UUID membershipId) {
        return organizations.listMembers(organizationId).stream()
                .filter(member -> member.id().equals(membershipId))
                .map(member -> member.userId())
                .findFirst();
    }

    /** The organization's owners, who receive escalations (ADR-035). */
    public java.util.List<UUID> owners(UUID organizationId) {
        return organizations.listMembers(organizationId).stream()
                .filter(member -> member.role() == Role.OWNER)
                .map(member -> member.userId())
                .toList();
    }

    /** Whether the person is still a member of the organization. */
    public boolean isMember(UUID organizationId, UUID userId) {
        return organizations.listMembers(organizationId).stream()
                .anyMatch(member -> member.userId().equals(userId));
    }

    public void runWithoutResult(
            UUID userId, UUID organizationId, Permission permission, java.util.function.Consumer<Access> work) {
        run(userId, organizationId, permission, access -> {
            work.accept(access);
            return null;
        });
    }
}
