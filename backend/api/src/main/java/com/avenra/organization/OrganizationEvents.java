package com.avenra.organization;

import java.util.UUID;

/** Facts about organizations other modules may react to. Published inside the transaction. */
public final class OrganizationEvents {

    private OrganizationEvents() {}

    /** A new organization, in its own scope; listeners may write its first rows. */
    public record Created(UUID organizationId, UUID createdBy) {}
}
