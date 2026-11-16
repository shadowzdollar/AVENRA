/**
 * Organization module: organizations (tenants), memberships, roles and permissions, and invitations
 * (Guidelines §16–§18, ADR-005). Every operation runs in a tenant scope that is set only after the
 * caller's membership and permission were checked.
 */
@ApplicationModule(displayName = "Organization")
package com.avenra.organization;

import org.springframework.modulith.ApplicationModule;
