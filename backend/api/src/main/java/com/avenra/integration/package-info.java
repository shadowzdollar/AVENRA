/**
 * Integration module: connections to other systems, their credentials, the integration events
 * built from domain facts, and deliveries (Guidelines §54–§58, §66, ADR-034). Other modules never
 * call providers directly; they publish facts and this module delivers them.
 */
@ApplicationModule(displayName = "Integration")
package com.avenra.integration;

import org.springframework.modulith.ApplicationModule;
