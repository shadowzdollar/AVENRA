"use client";

import {
  FolderLock,
  Inbox,
  Workflow,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Terminal,
  Database,
  Lock,
  FileCheck,
  ZapOff,
  GitBranch,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { VisualWorkflowSimulator } from "@/components/enterprise/VisualWorkflowSimulator";
import { VisualMagicPortalMockup } from "@/components/enterprise/VisualMagicPortalMockup";
import { EnterpriseArchitectureDiagram } from "@/components/enterprise/EnterpriseArchitectureDiagram";
import { EnterpriseComparisonTable } from "@/components/enterprise/EnterpriseComparisonTable";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const FAQ_ITEMS = [
  {
    category: "Architecture",
    question: "How does Avenra guarantee that work items never get stuck or skip steps?",
    answer: "Avenra models every work package as a mathematical Finite State Machine (FSM) implemented with Spring Modulith and PostgreSQL check constraints. State transitions require explicit guard conditions (e.g. required documents present, zero virus detections, positive verification scores). Transitions execute within serializable database transactions; if any guard or audit write fails, the entire transaction rolls back to the prior clean state.",
  },
  {
    category: "Integrity",
    question: "Why can't trigger-based automation tools (Zapier, Make) handle this?",
    answer: "Trigger-based tools are fundamentally stateless. If a webhook drops or an intermediate step times out, the automation fails silently or leaves the client record in an undefined, corrupted half-state. Avenra enforces idempotent state transitions with distributed locks (Redis Redlock + SELECT FOR UPDATE SKIP LOCKED), meaning operations can be retried 100 times without duplicating side effects or corrupting deliverables.",
  },
  {
    category: "Security",
    question: "Where do client uploaded files get stored during verification?",
    answer: "Files are directly streamed to your private S3 bucket using temporary presigned URLs; bytes never touch intermediate web servers unencrypted. As soon as the upload completes, an asynchronous worker executes ClamAV virus analysis in isolated memory. If clean, the file's SHA-256 hash is immutably committed into the PostgreSQL audit log.",
  },
  {
    category: "Compliance",
    question: "Can an auditor inspect the exact sequence of events months later?",
    answer: "Yes. Every completed work item generates an Evidence Manifest containing the chronological log of all state transitions, user timestamps, IP addresses, AI extraction confidence scores, and raw input checksums. The entire package is cryptographically signed and sealed with SHA-256 digests in an immutable completion manifest.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingLayout
      category="The Avenra Mechanics"
      badge="Engineering Discipline"
      variant="how-it-works"
      title="From Fragmented Intent to Verified Completed Work"
      subtitle="Understand the exact architectural mechanics of how Avenra ingests unstructured business demands, collects verified facts, executes state transitions, and creates sealed proof."
      breadcrumbs={[{ label: "How It Works" }]}
      heroVisual={<VisualMagicPortalMockup />}
      stats={[
        { value: "4 Stages", label: "Work Lifecycle", detail: "Intent → Collect → Verify → Prove" },
        { value: "100%", label: "Traceability", detail: "Every transition audited in DB" },
        { value: "Zero", label: "Silent Failures", detail: "Deterministic failure codes" },
        { value: "Pure State", label: "Guaranteed", detail: "Finite state machine core" },
      ]}
      features={[
        {
          icon: Inbox,
          title: "Stage 1: Intent Ingestion",
          description: "Incoming requests from emails, intake forms, or webhooks are registered as unverified work items awaiting input.",
          badge: "INGEST",
        },
        {
          icon: Workflow,
          title: "Stage 2: Information Gathering",
          description: "Avenra calculates missing data and dispatches tokenized magic links to external clients with adaptive reminders.",
          badge: "COLLECT",
        },
        {
          icon: FileCheck,
          title: "Stage 3: Verification & Execution",
          description: "Submitted inputs pass through deterministic rule gates and sandboxed AI parsing, surfacing exceptions to human operators.",
          badge: "VERIFY",
        },
        {
          icon: FolderLock,
          title: "Stage 4: Evidence Delivery",
          description: "All documents, check logs, and approvals are compiled into a SHA-256 sealed ZIP and archived directly to your cloud S3.",
          badge: "PROVE",
        },
      ]}
    >
      <div className="space-y-24">
        {/* Interactive Visual Execution Simulator */}
        <div>
          <VisualWorkflowSimulator />
        </div>

        {/* Core Architectural Blueprints Navigation Grid */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Technical Specifications
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Explore the 9 Core Architectural Blueprints
              </h2>
            </div>
            <p className="text-sm text-text-secondary max-w-md">
              Each blueprint documents our low-level design invariants, database isolation models, and recovery protocols.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                href: "/how-it-works/state-machines",
                title: "Finite State Machines",
                code: "ADR-001",
                desc: "Transition graphs, guard rules, and atomic database commits replacing brittle trigger chains.",
                icon: GitBranch,
              },
              {
                href: "/how-it-works/architecture",
                title: "Spring Modulith Topology",
                code: "ADR-002",
                desc: "Strict domain encapsulation, architectural boundary tests, and zero circular dependencies.",
                icon: Cpu,
              },
              {
                href: "/how-it-works/intent-capture",
                title: "Intent Capture & Ingestion",
                code: "ADR-003",
                desc: "Normalizing messy emails, intake portals, and webhooks into structured, schema-validated work items.",
                icon: Inbox,
              },
              {
                href: "/how-it-works/information-gathering",
                title: "Information Gathering",
                code: "ADR-004",
                desc: "Zero-friction tokenized magic portals, dynamic requirements, and automated cadence escalations.",
                icon: Workflow,
              },
              {
                href: "/how-it-works/verification",
                title: "Verification Pipeline",
                code: "ADR-006",
                desc: "Multi-layer inspection combining deterministic regex, schema checks, virus scans, and LLM extraction.",
                icon: FileCheck,
              },
              {
                href: "/how-it-works/evidence-delivery",
                title: "Evidence Locker & Delivery",
                code: "ADR-007",
                desc: "SHA-256 sealed ZIP packages, auditor custody manifests, and automated cloud S3 archival.",
                icon: FolderLock,
              },
              {
                href: "/how-it-works/human-in-the-loop",
                title: "Human-in-the-Loop Governance",
                code: "ADR-009",
                desc: "Exception escalation, confidence thresholds, and immutable operator sign-off audit trails.",
                icon: ShieldCheck,
              },
              {
                href: "/how-it-works/idempotency",
                title: "Idempotency & Locks",
                code: "ADR-011",
                desc: "Distributed locks, PostgreSQL SKIP LOCKED queues, and exactly-once execution semantics.",
                icon: Lock,
              },
              {
                href: "/how-it-works/ai-safety",
                title: "AI Safety & Isolation",
                code: "ADR-012",
                desc: "Air-gapped Python microservices, strict Pydantic schemas, and zero data persistence policies.",
                icon: Terminal,
              },
            ].map((bp) => {
              const Icon = bp.icon;
              return (
                <Link
                  key={bp.href}
                  href={bp.href}
                  className="group relative rounded-2xl border border-border bg-canvas-subtle p-6 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-canvas hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-text-tertiary group-hover:text-indigo-400 transition-colors">
                      {bp.code}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-text-primary group-hover:text-indigo-400 transition-colors">
                    {bp.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {bp.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                    Read Architecture Blueprint <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section: The Problem with Trigger Tools */}
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
              <ZapOff className="h-3.5 w-3.5" />
              The Failure Mode of Trigger Loops
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">
              Why Enterprise Deliverables Cannot Rely on Fragile Automations
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Tools like Zapier, Make, and native email triggers treat enterprise operations as a sequence of blind calls.
              When a webhook drops, an API rate-limits, or a client uploads an invalid PDF:
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  ✕
                </div>
                <span><strong>Silent Half-States:</strong> Records stay marked in-progress indefinitely while staff assume automated completion.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  ✕
                </div>
                <span><strong>No Reversible State:</strong> If step 4 of 6 fails, steps 1-3 have already fired with no rollback mechanism.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  ✕
                </div>
                <span><strong>Zero Auditor Evidence:</strong> Logs are scattered across 6 SaaS dashboards with no single cryptographic proof ledger.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-canvas-subtle p-8">
            <h3 className="font-bold text-text-primary text-lg">The Avenra Invariant Guarantee</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Every deliverable runs on a formal mathematical State Machine with atomic rollbacks and cryptographic proofs.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-indigo-500/20 bg-canvas p-4">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
                  <Database className="h-4 w-4" /> GUARANTEE 1: TRANSACTIONAL ATOMICITY
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  Database state advance and audit log insertion happen in the same serializable PostgreSQL transaction. It is impossible to advance state without a corresponding audit entry.
                </p>
              </div>
              <div className="rounded-xl border border-indigo-500/20 bg-canvas p-4">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
                  <ShieldCheck className="h-4 w-4" /> GUARANTEE 2: EXPLICIT GUARD GATES
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  Every transition requires preconditions (e.g. all required items uploaded, ClamAV clean, schema validated). Unchecked transitions are rejected at the database level.
                </p>
              </div>
              <div className="rounded-xl border border-indigo-500/20 bg-canvas p-4">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
                  <Lock className="h-4 w-4" /> GUARANTEE 3: DISTRIBUTED RECOVERY
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  Scheduled workers use `SELECT FOR UPDATE SKIP LOCKED` to safely claim timed retries without duplicate processing across cluster instances.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Comparison Matrix */}
        <div>
          <EnterpriseComparisonTable />
        </div>

        {/* Interactive Architecture Diagram */}
        <div>
          <EnterpriseArchitectureDiagram />
        </div>

        {/* Architectural FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Architectural & Mechanics FAQ"
            subtitle="Engineered answers to common questions about state persistence, idempotency guarantees, and enterprise security."
            items={FAQ_ITEMS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
