package com.avenra.organization.application;

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

    public void runWithoutResult(
            UUID userId, UUID organizationId, Permission permission, java.util.function.Consumer<Access> work) {
        run(userId, organizationId, permission, access -> {
            work.accept(access);
            return null;
        });
    }
}
