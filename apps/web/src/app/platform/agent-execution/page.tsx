"use client";

import {
  Bot,
  History,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard, EnterpriseSectionImage } from "@/components/enterprise/EnterpriseImageCard";

const AGENT_FAQS = [
  {
    category: "Safety Boundaries",
    question: "Can an autonomous AI agent directly change work status to 'COMPLETED' or execute external payouts?",
    answer: "Never. Avenra enforces strict capability-based authorization barriers between autonomous agent reasoning and the transactional core monolith. Agents operate under an unprivileged `agent.read` and `agent.propose` token scope. When an agent determines a task is ready, it must construct a proposed action changeset that enters the human operator's Approvals Queue. Only a human operator holding explicit `work.approve` permissions can commit the change.",
    technicalDetails: "PostgreSQL transaction rollback if an API token lacking `work.approve` attempts state transition.",
  },
  {
    category: "Audit Provenance",
    question: "How are agent thoughts, tool calls, and decisions logged for legal defense?",
    answer: "Every agent run creates an immutable execution record capturing the system prompt version, model version, temperature, exact input parameters, intermediate tool calls, execution latency, token expenditure, and final proposed output. This trace is linked directly to the deliverable ID and included in the sealed Evidence Locker package.",
    technicalDetails: "Stored in `agent_runs` and `agent_step_traces` tables with foreign key bindings to the parent work deliverable.",
  },
  {
    category: "Runaway Prevention",
    question: "What safeguards prevent runaway agent loops and unexpected token bills?",
    answer: "Every agent run is constrained by hard circuit breakers: a maximum step count (default: 10 steps), a timeout limit (default: 60 seconds), and a strict token consumption quota. If any threshold is breached, the execution terminates immediately and flags an operational alert in the operator dashboard.",
    technicalDetails: "Redis token bucket monitors consumption in real-time, tripping circuit breakers before costly loops occur.",
  },
];

export function AgentHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/platform/agent-execution.jpg"
      alt="Sandboxed Autonomous Agent Execution"
      title="Sandboxed Agent Runtime"
      subtitle="Deterministic multi-step agent actions gated by human-in-the-loop approvals"
      badge="AWAITING HUMAN APPROVAL"
      badgeVariant="warning"
      highlights={[
        { label: "Runtime Sandbox", value: "Strict Isolation" },
        { label: "Approval Gateway", value: "Human Partner" },
        { label: "Unsupervised Writes", value: "Zero Permitted" },
      ]}
    />
  );
}

export default function AgentExecutionPage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Autonomous Sandboxed Agents"
      title="Sandboxed Agent Execution with Mandatory Human Gates"
      subtitle="Deploy autonomous AI agents that execute multi-step research, document comparison, and compliance drafts without relinquishing human operational control."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Agent Execution" },
      ]}
      heroVisual={<AgentHeroVisual />}
      stats={[
        { value: "Strict RBAC", label: "Permission Scopes", detail: "Agents only perform granted actions" },
        { value: "Mandatory", label: "Human Approval", detail: "Sensitive actions require operator sign-off" },
        { value: "Step Trace", label: "Audit Log", detail: "Every thought, tool call, and parameter recorded" },
        { value: "Circuit Breakers", label: "Safety Loops", detail: "Execution limits prevent infinite iterations" },
      ]}
      features={[
        {
          icon: Bot,
          title: "Scoped Autonomous Runs",
          description: "Agents execute specific tasks: drafting requests, cross-referencing registries, and validating fields against policy.",
          badge: "BOUNDED",
        },
        {
          icon: UserCheck,
          title: "Approval-Gated Actions",
          description: "Whenever an agent reaches a side-effect boundary (sending an email, changing a work state), it enters AWAITING_APPROVAL.",
          badge: "HUMAN GATES",
        },
        {
          icon: History,
          title: "Complete Tool Tracing",
          description: "Every external tool invocation, parameters, response time, and token cost is permanently recorded in the audit trail.",
        },
        {
          icon: ShieldAlert,
          title: "Automated Circuit Breakers",
          description: "Execution caps limit token consumption, step counts, and runtime duration to avoid runaway agent loops.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Agent Permission Boundary Breakdown */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              The Agent Trust Boundary
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              What Autonomous Agents CAN and CANNOT Do
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              In Avenra, agents are treated as high-speed analytical assistants, not autonomous legal authorities. We maintain a non-negotiable boundary:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-success/30 bg-success-surface/10 p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> What Agents CAN Execute Autonomously
              </span>
              <ul className="space-y-2 text-xs text-text-primary">
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Extract tabular data from uploaded client balance sheets and cap tables.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Cross-reference corporate registry databases to verify active entity standing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Draft tailored document request descriptions and client guidance questions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Perform preliminary consistency checks and flag conflicting clauses for review.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-danger/30 bg-danger-surface/10 p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-danger flex items-center gap-1.5">
                <AlertTriangle className="size-4" /> What Agents are PHYSICALLY BLOCKED from Doing
              </span>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Cannot mark a deliverable status as COMPLETED without human sign-off.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Cannot bypass or override mandatory verification rule failures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Cannot trigger external bank disbursements or financial transfers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Cannot delete historical audit records or modify Evidence Locker archives.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Agent Trace Visual */}
        <div className="mt-8">
          <EnterpriseSectionImage
            src="/images/platform/agent-trace.jpg"
            alt="Agent Execution Ledger and Circuit Breakers"
            badge="Agent Execution Ledger"
            title="Complete Execution Trace & Circuit Breakers"
            description="Every agent run records its exact token consumption, execution timeline, tool invocations, and approval boundaries into an unalterable audit ledger."
            bullets={[
              "Hard circuit breakers enforce max steps and runtime timeouts via Redis token buckets",
              "Side-effect actions pause automatically at the human-in-the-loop gateway",
              "Full cryptographic provenance linked into the final sealed deliverable pack",
              "Partner approval required before any status advancement or external notification",
            ]}
          />
        </div>

        {/* Agent FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Agent Execution & Human-in-the-Loop FAQ"
            subtitle="Learn how Avenra protects enterprise clients from autonomous AI mistakes and liability."
            items={AGENT_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
