/**
 * AI module: the organization's AI setting, calls to the AI service and the record of every call
 * (Guidelines §41–§53, ADR-029, ADR-030). Model output reaches other modules only as validated,
 * typed data; nothing here decides or executes anything.
 */
@ApplicationModule(displayName = "AI")
package com.avenra.ai;

import org.springframework.modulith.ApplicationModule;
