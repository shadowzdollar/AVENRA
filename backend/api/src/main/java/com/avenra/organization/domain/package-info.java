/**
 * Roles and permissions (Guidelines §18). Exposed to other modules so they can name the permission
 * an operation needs; only the organization module decides whether a caller has it.
 */
@NamedInterface("permissions")
package com.avenra.organization.domain;

import org.springframework.modulith.NamedInterface;
