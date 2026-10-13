/**
 * Identity module: accounts, passwords, sessions, email verification, password reset and
 * multi-factor authentication (Guidelines §35, ADR-013, ADR-014, ADR-017).
 *
 * <p>Users are global: organization membership is owned by the organization module, which this
 * module reaches only through {@link com.avenra.identity.MembershipDirectory}.
 */
@ApplicationModule(displayName = "Identity")
package com.avenra.identity;

import org.springframework.modulith.ApplicationModule;
