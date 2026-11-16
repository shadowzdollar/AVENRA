/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseComplianceMatrix } from "@/components/enterprise/EnterpriseComplianceMatrix";
import { EnterpriseSecurityAuditViewer } from "@/components/enterprise/EnterpriseSecurityAuditViewer";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function ComplianceHeroVisual() {
  const [activeControl, setActiveControl] = useState<number>(0);

  const controls = [
    {
      id: 0,
      name: "CC6.1 - Logical Access Isolation",
      framework: "Access Control & RLS",
      status: "ENFORCED",
      evidence: "PostgreSQL Row-Level Security active on 100% of tenant tables. Zero cross-tenant leaks in 14,200 automated daily CI tests.",
    },
    {
      id: 1,
      name: "45 CFR §164.312 - ePHI Transmission Security",
      framework: "Data Safeguards",
      status: "ENFORCED",
      evidence: "Mandatory TLS 1.3 in-transit; AES-256-GCM envelope encryption at rest. Audit ledger commits immutable actor logs.",
    },
    {
      id: 2,
      name: "Rule 17a-4(f) - Non-Rewriteable Storage",
      framework: "Evidence Integrity",
      status: "ENFORCED",
      evidence: "Evidence packages locked under S3 Object Lock Compliance Mode with SHA-256 tamper-evident manifest verification.",
    },
    {
      id: 3,
      name: "A.12.1.2 - Change Management",
      framework: "ISO/IEC 27001:2022",
      status: "COMPLIANT",
      evidence: "Protected Git main branch with required 2-engineer peer review, signed commits, and zero warnings ESLint/typecheck gates.",
    },
  ];

  const curr = controls[activeControl] ?? controls[0]!;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            CONTINUOUS COMPLIANCE ENGINE
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          4 / 4 FRAMEWORKS ACTIVE
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        {controls.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveControl(c.id)}
            className={`w-full flex items-center justify-between rounded-lg p-2.5 text-left transition-colors border ${
              activeControl === c.id
                ? "border-emerald-500 bg-emerald-500/15"
                : "border-border/60 bg-canvas hover:border-border hover:bg-canvas-subtle"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-text-primary">{c.name}</span>
            </div>
            <span className="font-mono text-[10px] text-text-tertiary">{c.framework}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-28 w-full overflow-hidden bg-black/40">
          <img src="/images/platform/compliance.jpg"
            alt="Automated Security Compliance Control Proof"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            {curr.status}
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Security Control: {curr.framework} · Continuous Telemetry
          </div>
        </div>
        <div className="p-3 text-xs text-text-secondary bg-canvas-subtle border-t border-border">
          {curr.evidence}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Real-Time Telemetry Feed
        </span>
        <span className="font-mono">Auditor Ready</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Audit Readiness",
    question: "How does Avenra support our firm's compliance reviews and audits?",
    answer: "Avenra is engineered with the technical controls institutional auditors evaluate: PostgreSQL Row-Level Security kernel isolation, append-only audit ledgers, explicit capability-based authorization, SHA-256 package verification, and ClamAV malware defense. All records are exportable in open, standard formats.",
  },
  {
    category: "Data Safeguards",
    question: "How does Avenra protect sensitive client and matter records?",
    answer: "Avenra enforces row-level database segregation where tenant context is derived strictly from server-side authenticated sessions. Client files stream through malware scanning before storage and are exportable directly to your firm's own private S3 storage.",
  },
  {
    category: "Auditor Access",
    question: "How do external auditors verify compliance during our annual reviews?",
    answer: "Avenra eliminates the chaos of taking screenshots and emailing spreadsheets. Auditors can be granted restricted read-only Auditor roles to review the continuous compliance dashboard, query the immutable audit log, and download cryptographically verified evidence packages directly.",
  },
  {
    category: "Penetration Testing",
    question: "Do you undergo regular third-party penetration testing?",
    answer: "Yes. Independent CREST-certified penetration testers conduct comprehensive black-box and grey-box security assessments on our web application, APIs, and cloud infrastructure annually. Executive summaries are available to customers under NDA.",
  },
];

export default function ComplianceStandardsSecurityPage() {
  return (
    <MarketingLayout
      category="Regulatory Governance"
      badge="Audit Readiness"
      variant="security"
      title="Security Controls & Audit Readiness"
      subtitle="Built to satisfy the most stringent institutional risk reviews. From append-only audit logs to kernel-level tenant segregation and explicit RBAC."
      breadcrumbs={[
        { label: "Security & Trust", href: "/security" },
        { label: "Compliance Standards" },
      ]}
      heroVisual={<ComplianceHeroVisual />}
      stats={[
        { value: "Audit-Ready", label: "Control Mapping", detail: "Automated control evidence" },
        { value: "Strict RLS", label: "Data Isolation", detail: "Row-level tenant segregation" },
        { value: "Append-Only", label: "Audit Ledger", detail: "Zero retroactive log alteration" },
        { value: "Role-Free", label: "Explicit RBAC", detail: "Least-privilege permission grants" },
      ]}
      features={[
        {
          icon: ShieldCheck,
          title: "Continuous Control Evidence",
          description: "All security controls produce real-time audit records, making external compliance audits simple and verifiable.",
          badge: "AUDIT READY",
        },
        {
          icon: Lock,
          title: "Strict Least-Privilege RBAC",
          description: "Every API operation requires an explicit granular permission (`work.read`, `work.approve`, `evidence.export`).",
          badge: "LEAST PRIVILEGE",
        },
        {
          icon: Scale,
          title: "Regulatory Archival Formats",
          description: "Evidence lockers are self-contained and formatted according to open long-term archival standards.",
          badge: "SEALED VAULT",
        },
        {
          icon: ShieldAlert,
          title: "Automated Vulnerability Scanning",
          description: "All CI pipelines run nightly Semgrep static analysis, Dependabot 7-day cooldowns, and full history secret scans.",
          badge: "AUTOMATED",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Compliance Matrix Component */}
        <div>
          <EnterpriseComplianceMatrix />
        </div>

        {/* Security Audit Viewer Component */}
        <div>
          <EnterpriseSecurityAuditViewer />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Regulatory Compliance FAQ"
            subtitle="Engineering answers on audit readiness, technical controls, and evidence verification."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-emerald-400">Download Official Documentation</div>
            <div className="text-base font-bold text-text-primary">Avenra Enterprise Security Whitepaper</div>
          </div>
          <Link
            href="/security/whitepaper"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Read Whitepaper <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
