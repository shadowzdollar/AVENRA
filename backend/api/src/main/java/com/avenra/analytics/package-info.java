/**
 * Analytics module (Guidelines §112, ADR-038): an organization's own analytics, collected from
 * the modules that own the data, and aggregate customer counts for Avenra's operators.
 */
@ApplicationModule(displayName = "Analytics")
package com.avenra.analytics;

import org.springframework.modulith.ApplicationModule;
