package com.avenra.platform.tenancy;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

/**
 * Who a database transaction acts for (ADR-005). Row-level security reads these values; anything
 * left {@code null} matches no tenant-owned row.
 *
 * <p>An organization may only be set after the caller's membership in it has been verified; this
 * type does not check that, {@code OrganizationAccess} does.
 *
 * @param userId the authenticated user
 * @param organizationId the organization the operation acts in
 * @param invitationTokenHashHex hash of an invitation token being accepted (lets the invitee see
 *     only that one invitation)
 */
public record TenantScope(
        @Nullable UUID userId,
        @Nullable UUID organizationId,
        @Nullable String invitationTokenHashHex) {

    public static final TenantScope NONE = new TenantScope(null, null, null);

    public static TenantScope user(UUID userId) {
        return new TenantScope(userId, null, null);
    }

    public static TenantScope organization(UUID userId, UUID organizationId) {
        return new TenantScope(userId, organizationId, null);
    }

    public TenantScope withInvitationTokenHash(String hex) {
        return new TenantScope(userId, organizationId, hex);
    }
}
