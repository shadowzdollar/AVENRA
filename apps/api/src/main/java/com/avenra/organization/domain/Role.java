package com.avenra.organization.domain;

import static com.avenra.organization.domain.Permission.*;

import java.util.EnumSet;
import java.util.Set;

/**
 * Organization roles (Guidelines §18) and the permissions each grants. Roles are ordered by
 * authority; a member can only grant roles at or below their own, and only owners manage owners.
 */
public enum Role {
    OWNER(EnumSet.allOf(Permission.class)),
    // Only owners decide whether client documents may be read automatically (ADR-030).
    ADMIN(EnumSet.complementOf(EnumSet.of(BILLING_MANAGE, AI_MANAGE))),
    MANAGER(EnumSet.of(
            ORGANIZATION_READ,
            MEMBERS_READ,
            WORK_READ,
            WORK_CREATE,
            WORK_UPDATE,
            WORK_EXECUTE,
            WORK_APPROVE,
            WORK_DELETE,
            INFORMATION_READ,
            INFORMATION_COLLECT,
            INFORMATION_VERIFY,
            INTEGRATION_READ,
            ANALYTICS_READ)),
    MEMBER(EnumSet.of(
            ORGANIZATION_READ,
            MEMBERS_READ,
            WORK_READ,
            WORK_CREATE,
            WORK_UPDATE,
            WORK_EXECUTE,
            INFORMATION_READ,
            INFORMATION_COLLECT)),
    VIEWER(EnumSet.of(ORGANIZATION_READ, MEMBERS_READ, WORK_READ, INFORMATION_READ));

    private final Set<Permission> permissions;

    Role(EnumSet<Permission> permissions) {
        this.permissions = Set.copyOf(permissions);
    }

    public boolean grants(Permission permission) {
        return permissions.contains(permission);
    }

    public Set<Permission> permissions() {
        return permissions;
    }

    /** Whether someone with this role may give or take away {@code other}. */
    public boolean mayAssign(Role other) {
        if (other == OWNER) {
            return this == OWNER;
        }
        return grants(MEMBERS_MANAGE) && compareTo(other) <= 0;
    }
}
