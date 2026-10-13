package com.avenra.identity;

import com.avenra.contract.v1.model.OrganizationMembership;
import java.util.List;
import java.util.UUID;

/**
 * The organizations a user belongs to, for describing the signed-in user. Implemented by the
 * organization module; defined here so identity does not depend on it (dependency inversion keeps
 * the module graph acyclic, ADR-001).
 */
public interface MembershipDirectory {

    List<OrganizationMembership> membershipsOf(UUID userId);
}
