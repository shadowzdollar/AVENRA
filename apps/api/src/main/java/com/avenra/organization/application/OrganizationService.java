package com.avenra.organization.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.Organization;
import com.avenra.contract.v1.model.OrganizationMembership;
import com.avenra.identity.MembershipDirectory;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.organization.domain.Role;
import com.avenra.organization.infrastructure.OrganizationRepository;
import com.avenra.organization.infrastructure.OrganizationRepository.MembershipWithOrganization;
import com.avenra.organization.infrastructure.OrganizationRepository.OrganizationRow;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

/** Creating, listing and renaming organizations; also serves the identity module's directory. */
@Service
public class OrganizationService implements MembershipDirectory {

    private final OrganizationRepository organizations;
    private final OrganizationAccess access;
    private final TenantTransactions transactions;
    private final Idempotency idempotency;
    private final AuditLog audit;
    private final Clock clock;

    OrganizationService(
            OrganizationRepository organizations,
            OrganizationAccess access,
            TenantTransactions transactions,
            Idempotency idempotency,
            AuditLog audit,
            Clock clock) {
        this.organizations = organizations;
        this.access = access;
        this.transactions = transactions;
        this.idempotency = idempotency;
        this.audit = audit;
        this.clock = clock;
    }

    /** Creates an organization with the caller as its owner; repeat calls with the same key return it. */
    public Organization create(UUID userId, String idempotencyKey, String rawName) {
        String name = requireName(rawName);
        UUID id = UUID.randomUUID();
        return transactions.run(
                TenantScope.organization(userId, id),
                () -> idempotency.once(
                        userId, "createOrganization", idempotencyKey, "name=" + name, Organization.class, () -> {
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            organizations.insertOrganization(id, name, now);
                            UUID membershipId = UUID.randomUUID();
                            organizations.insertMembership(membershipId, id, userId, Role.OWNER, now);
                            audit.record(AuditLog.Event.of("organization.created", id, userId)
                                    .resource("organization", id));
                            return toApi(new OrganizationRow(id, name, now, DEFAULT_REQUEST_LINK_DAYS));
                        }));
    }

    @Override
    public List<OrganizationMembership> membershipsOf(UUID userId) {
        return transactions.run(
                TenantScope.user(userId),
                () -> organizations.membershipsOf(userId).stream()
                        .map(OrganizationService::toApi)
                        .toList());
    }

    public Organization get(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.ORGANIZATION_READ,
                granted -> organizations
                        .findOrganization(organizationId)
                        .map(OrganizationService::toApi)
                        .orElseThrow(ApiException::notFound));
    }

    /** Request links are valid this long unless the organization chooses otherwise (ADR-036). */
    public static final int DEFAULT_REQUEST_LINK_DAYS = 14;

    /**
     * Changes the organization's name and defaults (ADR-036).
     *
     * @param rawName the new name, or {@code null} to keep it
     * @param requestLinkDays the new request-link validity, or {@code null} to keep it
     */
    public Organization update(
            UUID userId, UUID organizationId, @Nullable String rawName, @Nullable Integer requestLinkDays) {
        return access.run(userId, organizationId, Permission.ORGANIZATION_MANAGE, granted -> {
            var current = organizations.findOrganization(organizationId).orElseThrow(ApiException::notFound);
            String name = rawName == null ? current.name() : requireName(rawName);
            int days = requestLinkDays == null ? current.requestLinkDays() : requestLinkDays;
            if (days < 1 || days > 30) {
                throw ApiException.invalid("requestLinkDays", "must be between 1 and 30");
            }
            organizations.updateOrganization(organizationId, name, days, OffsetDateTime.now(clock));
            if (!name.equals(current.name())) {
                audit.record(AuditLog.Event.of("organization.renamed", organizationId, userId)
                        .resource("organization", organizationId));
            }
            if (days != current.requestLinkDays()) {
                audit.record(AuditLog.Event.of("organization.settings_changed", organizationId, userId)
                        .resource("organization", organizationId)
                        .detail("requestLinkDays", days));
            }
            return organizations
                    .findOrganization(organizationId)
                    .map(OrganizationService::toApi)
                    .orElseThrow(ApiException::notFound);
        });
    }

    static Organization toApi(OrganizationRow row) {
        return new Organization(
                row.id(), row.name(), row.createdAt().withOffsetSameInstant(ZoneOffset.UTC), row.requestLinkDays());
    }

    static OrganizationMembership toApi(MembershipWithOrganization membership) {
        return new OrganizationMembership(
                toApi(membership.organization()),
                membership.membershipId(),
                com.avenra.contract.v1.model.Role.fromValue(membership.role().name()),
                permissions(membership.role()));
    }

    static List<String> permissions(Role role) {
        return role.permissions().stream().map(Permission::code).sorted().toList();
    }

    private static String requireName(String raw) {
        String name = raw.strip();
        if (name.isEmpty()) {
            throw ApiException.invalid("name", "must not be blank");
        }
        return name;
    }
}
