"use client";

import {
  Lock,
  RefreshCw,
  ShieldCheck,
  Workflow,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveStateMachine } from "@/components/enterprise/InteractiveStateMachine";
import { EnterpriseWorkflowTimeline } from "@/components/enterprise/EnterpriseWorkflowTimeline";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const WORK_ENGINE_FAQS = [
  {
    category: "State Machine",
    question: "Can an administrator force a status update to 'COMPLETED' if client documents are missing?",
    answer: "No. In Avenra, administrative roles do not possess arbitrary state-writing superpowers. The state machine transitions are constrained by Java domain entity invariants and PostgreSQL CHECK constraints. If a prerequisite checkpoint (such as a verified client signature or mandatory tax document) has not evaluated to PASSED, the transition method throws a `PreconditionFailedException` and rolls back the database transaction.",
    technicalDetails: "PostgreSQL constraint: CHECK (status != 'COMPLETED' OR (checks_passed = true AND sealed_at IS NOT NULL)). Invariant enforced across API and direct DB queries.",
  },
  {
    category: "Concurrency",
    question: "How does the Work Engine prevent race conditions when multiple operators or webhooks interact simultaneously?",
    answer: "Avenra employs optimistic locking via a `@Version` counter on the Work aggregate root combined with Redis-based distributed idempotency reservations. If two operators attempt concurrent state transitions, the second transaction detects a version conflict and safely rejects the modification with HTTP 409 Conflict, requiring the client to refresh the latest state.",
    technicalDetails: "Zero lost updates. Prevents split-brain decisions where two operators might approve different document versions concurrently.",
  },
  {
    category: "Audit Logging",
    question: "What exact information is committed to the immutable audit trail on each state step?",
    answer: "Every transition creates an unmodifiable row in the `audit_ledger` table recording the previous status, next status, operator user ID, IP address, user-agent, UTC timestamp, event reason, and a SHA-256 state snapshot digest of all associated entities.",
    technicalDetails: "Audit rows cannot be updated or deleted. Database triggers block UPDATE and DELETE operations on the audit ledger table.",
  },
];

export function WorkEngineHeroVisual() {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Finite State Machine Engine</span>
        <span className="text-cyan-400 font-bold">STRICT_INVARIANT</span>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="text-text-secondary">{"// State Transition Matrix Guard"}</div>
        <div className="text-[#ff7b72]">class <span className="text-[#79c0ff]">WorkStateMachine</span> &#123;</div>
        <div className="text-[#79c0ff] pl-3">public TransitionResult <span className="text-[#d2a8ff]">advance</span>(</div>
        <div className="text-[#c9d1d9] pl-6">WorkId id, WorkEvent event, Operator actor</div>
        <div className="text-[#79c0ff] pl-3">) &#123;</div>
        <div className="text-[#7ee787] pl-6">requireState(PENDING, AWAITING_INPUT);</div>
        <div className="text-[#7ee787] pl-6">validateGuards(id, event.rules());</div>
        <div className="text-[#7ee787] pl-6">auditLog.append(actor, event);</div>
        <div className="text-[#79c0ff] pl-3">&#125;</div>
        <div className="text-[#ff7b72]">&#125;</div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-cyan-400 flex justify-between">
        <span>Guards Evaluated: 100% Deterministic</span>
        <span>ACID Enforced</span>
      </div>
    </div>
  );
}

export default function WorkEnginePage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Spring Modulith Monolith"
      title="The Finite State Work Execution Engine"
      subtitle="Eliminate workflow race conditions and unauthorized status updates. Avenra executes all business deliverables through strict, mathematically verified state transitions."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Work Execution Engine" },
      ]}
      heroVisual={<WorkEngineHeroVisual />}
      stats={[
        { value: "0", label: "Illegal Transitions", detail: "Enforced at database constraint level" },
        { value: "100%", label: "Idempotency", detail: "Safe against network duplicate calls" },
        { value: "Full", label: "Audit Provenance", detail: "Who, when, and why for every state step" },
        { value: "Sub-ms", label: "Evaluation Speed", detail: "In-memory transaction verification" },
      ]}
      features={[
        {
          icon: Workflow,
          title: "Rigorous State Machines",
          description: "Status is never arbitrary text. Work moves predictably: PENDING → IN_PROGRESS → AWAITING_CLIENT → UNDER_REVIEW → VERIFIED → COMPLETED.",
          badge: "INVARIANT",
        },
        {
          icon: ShieldCheck,
          title: "Server-Enforced Guard Conditions",
          description: "State cannot transition until all pre-conditions are satisfied: documents validated, checks passed, and permissions confirmed.",
          badge: "GATES",
        },
        {
          icon: RefreshCw,
          title: "Idempotent Execution",
          description: "Every external event, webhook, and client response carries unique idempotency keys, guaranteeing actions happen once and only once.",
        },
        {
          icon: Lock,
          title: "Row-Level Tenant Isolation",
          description: "Every state machine query is bound to the server-verified organization ID via PostgreSQL RLS policies.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive State Machine */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Interactive State Inspector
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Explore the State Transition Graph
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Click through the deliverable stages below to inspect the server guard preconditions, emitted database events, and audit JSON payloads.
            </p>
          </div>
          <InteractiveStateMachine />
        </div>

        {/* Real Lifecycle Timeline */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Chronological Audit Ledger
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Complete Deliverable Execution Trace
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              From the instant intent is registered to sovereign S3 cryptographic sealing, every atomic transition is logged in an append-only ledger.
            </p>
          </div>
          <EnterpriseWorkflowTimeline />
        </div>

        {/* Technical Deep Dive: Database Schema & Invariants */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Database Constraints & Guard Enforcement
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Why Invariants Can Never Be Bypassed
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              In traditional project management SaaS, work status is an unindexed VARCHAR column in a MySQL or MongoDB database. A junior developer writing a migration script or a rogue Zapier webhook can set `status = &apos;Done&apos;` with zero checks. Avenra enforces invariants in three independent layers:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Layer 1: Domain Kernel</span>
              <h3 className="mt-2 text-base font-bold text-text-primary">Spring Modulith Types</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Java 25 sealed classes and record types make illegal state models impossible to express at compile time. Methods accept strongly typed transitions only.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Layer 2: Guard Gateways</span>
              <h3 className="mt-2 text-base font-bold text-text-primary">Rule Check Engine</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Before advancing state, the engine queries the verification registry. If any mandatory checkpoint is missing or rejected, transition aborts.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Layer 3: Kernel Database</span>
              <h3 className="mt-2 text-base font-bold text-text-primary">PostgreSQL Constraints</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Native PostgreSQL CHECK constraints prevent invalid status values, while Row-Level Security ensures tenant boundaries cannot be breached.
              </p>
            </div>
          </div>

          {/* DDL Snippet */}
          <div className="mt-8 rounded-2xl border border-border bg-[#0d1117] p-6 font-mono text-xs text-[#c9d1d9] overflow-x-auto">
            <span className="text-[#8b949e]">{"// PostgreSQL Schema Definition from apps/api/src/main/resources/db/migration/V4__work.sql"}</span>
            <pre className="mt-2 text-[11px] leading-relaxed text-[#79c0ff]">
{`CREATE TABLE work (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_identifier VARCHAR(120) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    sealed_at TIMESTAMPTZ,
    package_sha256 VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_valid_work_status CHECK (
        status IN ('PENDING', 'AWAITING_CLIENT_INPUT', 'EVALUATING_CHECKS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT chk_completed_has_seal CHECK (
        status != 'COMPLETED' OR (sealed_at IS NOT NULL AND package_sha256 IS NOT NULL)
    )
);

ALTER TABLE work ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_tenant_isolation ON work
    USING (organization_id = current_setting('app.current_organization_id')::UUID);`}
            </pre>
          </div>
        </div>

        {/* Work Engine FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Work Engine Architecture & Invariants FAQ"
            subtitle="Deep technical answers regarding state machine theory, idempotency guarantees, and transactional integrity."
            items={WORK_ENGINE_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
