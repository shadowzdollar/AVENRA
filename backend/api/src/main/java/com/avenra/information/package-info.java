/**
 * Information module: requirements, the answers submitted for them, their review, request links
 * and the public client requests, with reminders and expiry (Guidelines §21–§23, §128, ADR-018,
 * ADR-020, ADR-026). It never depends on the work module: it reaches work through {@link
 * com.avenra.information.WorkGate} and reports what happened through {@link
 * com.avenra.information.InformationEvents}.
 */
@ApplicationModule(displayName = "Information")
package com.avenra.information;

import org.springframework.modulith.ApplicationModule;
