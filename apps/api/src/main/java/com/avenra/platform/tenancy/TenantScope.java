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
 * @param requestLinkTokenHashHex hash of a client request link token (lets its holder see only
 *     that link's requirements, ADR-020)
 */
public record TenantScope(
        @Nullable UUID userId,
        @Nullable UUID organizationId,
        @Nullable String invitationTokenHashHex,
        @Nullable String requestLinkTokenHashHex) {

    public static final TenantScope NONE = new TenantScope(null, null, null, null);

    public static TenantScope user(UUID userId) {
        return new TenantScope(userId, null, null, null);
    }

    public static TenantScope organization(UUID userId, UUID organizationId) {
        return new TenantScope(userId, organizationId, null, null);
    }

    public TenantScope withInvitationTokenHash(String hex) {
        return new TenantScope(userId, organizationId, hex, requestLinkTokenHashHex);
    }

    /**
     * The platform acting on its own, for one organization (a job) or for none (a platform job).
     * Only background jobs use this; requests always act for a user or a request link.
     */
    public static TenantScope system(@Nullable UUID organizationId) {
        return new TenantScope(null, organizationId, null, null);
    }

    /** A client holding a request link: no user, no organization, only the link. */
    public static TenantScope requestLink(String tokenHashHex) {
        return new TenantScope(null, null, null, tokenHashHex);
    }
}
