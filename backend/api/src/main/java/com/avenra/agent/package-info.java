/**
 * Agent module: the orchestrator, the tool gateway, agent runs and their approval gates (Guidelines
 * §44–§47, §129–§133, ADR-004, ADR-033). The model only proposes; this module decides, through the
 * tools other modules provide ({@link com.avenra.agent.WorkTools}, {@link
 * com.avenra.agent.InformationTools}), what may run, as whom, within which budget, and checks the
 * result afterwards.
 */
@ApplicationModule(displayName = "Agent")
package com.avenra.agent;

import org.springframework.modulith.ApplicationModule;
