"use client";

import {
  Cpu,
  FileSearch,
  FolderLock,
  Workflow,
  ArrowRight,
  } from "lucide-react";
import Link from "next/link";
import { VisualWorkflowSimulator } from "@/components/enterprise/VisualWorkflowSimulator";
import { VisualDocumentScannerMockup } from "@/components/enterprise/VisualDocumentScannerMockup";
import { EnterpriseArchitectureDiagram } from "@/components/enterprise/EnterpriseArchitectureDiagram";
import { EnterpriseComparisonTable } from "@/components/enterprise/EnterpriseComparisonTable";
import { EnterpriseSectionImage } from "@/components/enterprise/EnterpriseImageCard";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const PLATFORM_FAQS = [
  {
    category: "Architecture",
    question: "Why does Avenra use a Java 25 Modular Monolith instead of distributed microservices?",
    answer: "Microservices introduce network partitioning risks, distributed transaction race conditions, and complex eventual consistency that violate the mathematical state guarantees required by law, accounting, and compliance practices. By implementing Spring Modulith on Java 25, Avenra enforces strict compile-time architectural boundaries while guaranteeing immediate ACID transactional consistency across all state transitions and audit events in a single high-throughput runtime.",
    technicalDetails: "Module boundaries are enforced with Spring Modulith test verifications. Every state transition executes inside a single database transaction with zero cross-network RPC latency.",
  },
  {
    category: "Data Isolation",
    question: "How does Avenra guarantee multi-tenant data isolation at scale?",
    answer: "Avenra rejects client-supplied tenant identifiers from HTTP headers (ADR-005). Tenant identity is established strictly from cryptographic server session cookies. Every database query executed by the application sets the PostgreSQL session context `app.current_organization_id`, and native PostgreSQL Row-Level Security (RLS) policies filter records inside the database kernel before any data touches application memory.",
    technicalDetails: "PostgreSQL 18 RLS policies: CREATE POLICY tenant_isolation_policy ON <table> USING (organization_id = current_setting('app.current_organization_id')::uuid). Zero possibility of SQL WHERE injection bypass.",
  },
  {
    category: "AI Safety",
    question: "Can client documents be used to train external AI models?",
    answer: "No. Avenra enforces an air-gapped, zero-persistence architecture for its Python AI engine (ADR-006). Document bytes stream into an isolated container that performs OCR and schema extraction strictly in ephemeral RAM buffers. No document content is stored on disk or in the database, and zero client data is ever transmitted to public AI training datasets.",
    technicalDetails: "FastAPI inference service operates statelessly with zero database connections and immediate buffer deallocation after JSON serialization.",
  },
  {
    category: "Storage Custody",
    question: "Can our firm retain sovereign custody over all client files and evidence packages?",
    answer: "Yes. Avenra supports direct customer-managed object storage on AWS S3, Cloudflare R2, MinIO, or Wasabi (ADR-007). Uploaded files and sealed Evidence Locker packages write directly into your dedicated private bucket using your firm's KMS encryption keys. You retain full cryptographic ownership and can export or audit records offline at any time without vendor lock-in.",
    technicalDetails: "S3 API abstraction generates short-lived presigned URLs (15-minute TTL). All completed deliverables generate downloadable self-contained ZIP packages containing audit-summary.html, manifest.json, and native files.",
  },
  {
    category: "Reliability",
    question: "How does Avenra handle duplicate webhook events and network retries?",
    answer: "Every mutating endpoint in the Avenra API requires a unique idempotency key. When an external system or webhook sender retries a request, Redis performs an atomic check-and-set reservation followed by a database transactional lock. If a duplicate key is detected, Avenra returns the previously committed result without re-executing any business state transitions.",
    technicalDetails: "Guarantees exactly-once delivery across webhooks, payment captures, client notifications, and evidence compilation.",
  },
];

export default function PlatformPage() {
  return (
    <MarketingLayout
      category="The Work Execution Platform"
      badge="Invariant Architecture"
      variant="platform"
      title="The Platform Designed for High-Consequence Execution"
      subtitle="Say goodbye to brittle trigger chains and messy client email chasing. Avenra provides deterministic finite state machines, air-gapped document intelligence, and cryptographic evidence sealing."
      breadcrumbs={[{ label: "Platform" }]}
      heroVisual={<VisualDocumentScannerMockup />}
      stats={[
        { value: "0", label: "Silent Failures", detail: "Mathematical finite state core" },
        { value: "100%", label: "Audit Provenance", detail: "Every transition audited in DB" },
        { value: "Sovereign S3", label: "Private Storage", detail: "Files go directly to your bucket" },
        { value: "Air-Gapped", label: "AI Reading", detail: "Zero training & zero disk writes" },
      ]}
      features={[
        {
          icon: Workflow,
          title: "Work State Machine",
          description: "Replaces fragile triggers with a formal state machine where deliverables cannot advance without passing verification.",
          badge: "FSM CORE",
        },
        {
          icon: FileSearch,
          title: "Verification Engine",
          description: "Five sequential gates enforce format rules, regex checksums, virus scans, and arithmetic reconciliation.",
          badge: "5 GATES",
        },
        {
          icon: FolderLock,
          title: "Evidence Locker",
          description: "Seals every input, approval, and check log into a SHA-256 tamper-evident archive stored directly in your cloud S3.",
          badge: "SHA-256 SEAL",
        },
        {
          icon: Cpu,
          title: "Document Intelligence",
          description: "Air-gapped Python microservice extracts structured data into strict Pydantic models in ephemeral memory.",
          badge: "AIR-GAPPED",
        },
      ]}
    >
      <div className="space-y-24">
        {/* Interactive Visual Execution Simulator */}
        <div>
          <VisualWorkflowSimulator />
        </div>

        {/* 9 Invariant Subsystems Bento Grid */}
        <section className="rounded-3xl border border-border bg-canvas p-8 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <span className="font-mono text-xs font-bold text-cyan-500 uppercase tracking-widest">
                Platform Subsystems
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Explore the 8 Core Invariant Engines
              </h2>
            </div>
            <p className="text-sm text-text-secondary max-w-md">
              Each subsystem enforces mathematical correctness, kernel tenant isolation, and verifiable evidence.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/platform/work-engine",
                title: "Work State Engine",
                badge: "FSM CORE",
                desc: "Finite state machine with atomic rollback guarantees and closed transition graphs.",
              },
              {
                href: "/platform/verification-engine",
                title: "Verification Engine",
                badge: "5 CHECK GATES",
                desc: "Deterministic rule execution, virus scanning, and mathematical cross-footing.",
              },
              {
                href: "/platform/evidence-locker",
                title: "Evidence Locker",
                badge: "SEALED MANIFEST",
                desc: "SHA-256 sealed completion manifests, auditor custody records, and S3 export.",
              },
              {
                href: "/platform/document-intelligence",
                title: "Document AI",
                badge: "AIR-GAPPED",
                desc: "Stateless PyMuPDF OCR extraction, strict Pydantic schemas, and zero data training.",
              },
              {
                href: "/platform/agent-execution",
                title: "Autonomous Agents",
                badge: "HUMAN-IN-THE-LOOP",
                desc: "Sandboxed agent execution boundaries with mandatory human approval gates.",
              },
              {
                href: "/platform/client-portal",
                title: "Client Magic Portals",
                badge: "ZERO-LOGIN",
                desc: "High-entropy tokenized magic links and streaming malware inspection dropzones.",
              },
              {
                href: "/platform/reminders",
                title: "Adaptive Reminders",
                badge: "SKIP LOCKED",
                desc: "Automated escalation cadence that terminates instantly upon client submission.",
              },
              {
                href: "/platform/compliance",
                title: "Compliance Engine",
                badge: "AUDIT READY",
                desc: "Continuous automated audit evidence with PostgreSQL RLS and append-only audit logging.",
              },
            ].map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-canvas-subtle p-6 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-canvas hover:shadow-lg"
              >
                <div>
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {sub.badge}
                  </span>
                  <h3 className="mt-3 font-bold text-text-primary group-hover:text-cyan-500 transition-colors">
                    {sub.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {sub.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-500">
                  Explore Engine <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 8-Dimension Comparison Matrix */}
        <div>
          <EnterpriseComparisonTable />
        </div>

        {/* Interactive System Architecture Topology */}
        <div>
          <EnterpriseArchitectureDiagram />
        </div>

        {/* Platform Command Center Visual */}
        <div>
          <EnterpriseSectionImage
            src="/images/platform/command-center.jpg"
            alt="Avenra Unified Enterprise Platform Command Center"
            badge="Unified Platform"
            title="Unified Enterprise Operations & Delivery Command Center"
            description="Manage client intake, automated verification rules, continuous compliance ledgers, and sovereign evidence lockers across your entire firm through a unified high-throughput control plane."
            bullets={[
              "End-to-end auditability from initial client engagement to final sealed archive",
              "Sub-second deterministic rule execution without human bottlenecks",
              "PostgreSQL Row-Level Security ensuring strict multi-tenant boundary isolation",
              "Direct sovereign cloud export to AWS S3, Azure Blob, or on-premise storage",
            ]}
          />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12 shadow-sm">
          <EnterpriseFaqAccordion
            title="Platform Architecture & Compliance FAQ"
            subtitle="Engineered answers to common questions about Java 25 performance, PostgreSQL RLS, and air-gapped AI isolation."
            items={PLATFORM_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
