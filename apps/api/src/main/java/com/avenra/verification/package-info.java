/**
 * Verification module: rules, verification results and evidence, and completion manifests
 * (Guidelines §24–§25, §50, ADR-026 to ADR-028). An engine: it checks what it is given and never
 * reads other modules' tables.
 */
@ApplicationModule(displayName = "Verification")
package com.avenra.verification;

import org.springframework.modulith.ApplicationModule;
