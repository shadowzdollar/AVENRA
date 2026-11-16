/**
 * Document module: accepting, scanning, storing and serving files (Guidelines §23, §65, ADR-019,
 * ADR-021). Callers authorize; this module decides what is accepted and keeps every version.
 */
@ApplicationModule(displayName = "Document")
package com.avenra.document;

import org.springframework.modulith.ApplicationModule;
