/**
 * Platform module: cross-cutting technical foundations shared by all business modules
 * (configuration, request context, error format, logging, health, telemetry).
 *
 * <p>It contains no business rules and must not depend on any business module.
 */
@ApplicationModule(displayName = "Platform")
package com.avenra.platform;

import org.springframework.modulith.ApplicationModule;
