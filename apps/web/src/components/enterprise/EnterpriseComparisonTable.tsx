"use client";

import { Check, X, Scale } from "lucide-react";
import { useState } from "react";

interface ComparisonItem {
  feature: string;
  category: "execution" | "security" | "compliance" | "data";
  traditional: string;
  traditionalBad: boolean;
  avenra: string;
  avenraProof: string;
}

const COMPARISONS: ComparisonItem[] = [
  {
    feature: "Workflow State Model",
    category: "execution",
    traditional: "Mutable string labels ('In Progress', 'Done') modifiable by any user or integration script without validation.",
    traditionalBad: true,
    avenra: "Mathematical Finite State Machine with compile-time state transitions and server-enforced guard conditions.",
    avenraProof: "PostgreSQL check constraints & Spring Modulith state machine invariants enforce zero illegal transitions.",
  },
  {
    feature: "Tenant Data Isolation",
    category: "security",
    traditional: "Application-level WHERE clauses reliant on developer discipline. Vulnerable to query injection and accidental cross-tenant leaks.",
    traditionalBad: true,
    avenra: "Native PostgreSQL Row-Level Security (RLS) policies evaluated inside the database kernel on every query.",
    avenraProof: "Tenant ID derived strictly from cryptographic session cookie; HTTP tenant headers rejected at gateway (ADR-005).",
  },
  {
    feature: "Client Document Collection",
    category: "data",
    traditional: "Unencrypted email attachments, public shared Google Drive folders, or generic unauthenticated web forms.",
    traditionalBad: true,
    avenra: "Ephemeral single-use Magic Request links with automated HMAC verification, TTL expiration, and inline virus scanning.",
    avenraProof: "ClamAV virus stream check before byte storage; presigned ephemeral S3 URLs that expire in 15 minutes.",
  },
  {
    feature: "Verification & Quality Gates",
    category: "compliance",
    traditional: "Manual checklist on paper or spreadsheet. Easy for busy staff to skip steps or mark complete without verification.",
    traditionalBad: true,
    avenra: "Automated deterministic verification checks (schema, regex, AI OCR reading, mathematical tolerances, sanity bounds).",
    avenraProof: "Deliberately decoupled verification engine records JSON trace of every rule evaluation into audit log.",
  },
  {
    feature: "Audit Trail & Provenance",
    category: "compliance",
    traditional: "Fragmented application logs rotated out after 30 days. No cryptographic proof that records were not altered.",
    traditionalBad: true,
    avenra: "Tamper-proof, append-only audit ledgers and sealed Evidence Locker packages with SHA-256 package checksums.",
    avenraProof: "Self-contained ZIP packages containing manifest.json, audit-summary.html, and raw attachments verifiable offline.",
  },
  {
    feature: "Data Custody & Storage",
    category: "data",
    traditional: "Opaque multi-tenant SaaS vendor database. Vendor owns files and often trains AI models on client data.",
    traditionalBad: true,
    avenra: "Sovereign private cloud storage. Files stream directly to your firm's own AWS S3, Cloudflare R2, or MinIO bucket.",
    avenraProof: "Customer-managed KMS keys with AES-256-GCM envelope encryption. Zero training on customer documents.",
  },
  {
    feature: "Idempotency & Race Conditions",
    category: "execution",
    traditional: "Repeated webhook retries or parallel double-clicks cause duplicate work items, double billing, or broken state.",
    traditionalBad: true,
    avenra: "Cryptographic idempotency keys on all mutating endpoints. Database unique constraints guarantee exactly-once processing.",
    avenraProof: "Redis atomic reservation followed by PostgreSQL transactional lock protects against duplicate executions.",
  },
  {
    feature: "Human-in-the-Loop Sign-off",
    category: "security",
    traditional: "Generic administrator roles where any staff member can bypass checks and approve deliverables without attribution.",
    traditionalBad: true,
    avenra: "Granular, capability-based RBAC requiring explicit permissions (`work.approve`) with individual biometric/OAuth attribution.",
    avenraProof: "Audit trail records exact actor ID, timestamp, IP address, and cryptographic signature of the approving operator.",
  },
];

export function EnterpriseComparisonTable({
  title = "The Architecture Gap: Traditional Tools vs. Avenra Deterministic Engine",
  subtitle = "Why leading law firms, accounting practices, and regulated enterprises replace brittle Zapier/Make loops and Jira boards with Avenra.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = activeCategory === "all"
    ? COMPARISONS
    : COMPARISONS.filter((item) => item.category === activeCategory);

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      {/* Table Header */}
      <div className="border-b border-border bg-background px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Architectural Benchmark
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              {title}
            </h3>
            <p className="mt-1 text-xs text-text-secondary md:text-sm max-w-3xl">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-canvas p-1">
            {[
              { id: "all", label: "All Benchmarks" },
              { id: "execution", label: "Execution" },
              { id: "security", label: "Security" },
              { id: "compliance", label: "Compliance" },
              { id: "data", label: "Data Custody" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === tab.id
                    ? "bg-brand text-background shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="divide-y divide-border">
        {filtered.map((item, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 hover:bg-background/40 transition-colors">
            {/* Feature Name */}
            <div className="p-5 md:p-6 md:col-span-3 border-b md:border-b-0 md:border-r border-border bg-background/30 flex flex-col justify-between">
              <div>
                <span className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                  {item.category}
                </span>
                <h4 className="mt-2 text-sm font-bold text-text-primary">
                  {item.feature}
                </h4>
              </div>
            </div>

            {/* Traditional Systems */}
            <div className="p-5 md:p-6 md:col-span-4 border-b md:border-b-0 md:border-r border-border bg-danger-surface/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <X className="size-3.5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-danger">
                  Traditional Workflow Tools
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {item.traditional}
              </p>
            </div>

            {/* Avenra Deterministic Monolith */}
            <div className="p-5 md:p-6 md:col-span-5 bg-success-surface/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-success/20 text-success">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-success">
                    Avenra Invariant Monolith
                  </span>
                </div>
                <p className="text-xs font-medium text-text-primary leading-relaxed">
                  {item.avenra}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-success/30 bg-background/80 p-3">
                <span className="text-[10px] font-bold text-success uppercase tracking-wider block">
                  Proof Mechanism
                </span>
                <span className="text-[11px] text-text-secondary leading-snug font-mono mt-0.5 block">
                  {item.avenraProof}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
