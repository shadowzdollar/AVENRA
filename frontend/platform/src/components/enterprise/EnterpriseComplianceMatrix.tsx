"use client";

import {
  Check,
  CheckCircle2,
  Scale,
} from "lucide-react";
import { useState } from "react";

interface ComplianceStandard {
  id: string;
  name: string;
  badge: string;
  description: string;
  controls: {
    control: string;
    requirement: string;
    avenraImplementation: string;
    status: "IMPLEMENTED" | "ENFORCED";
  }[];
}

const STANDARDS: ComplianceStandard[] = [
  {
    id: "soc2",
    name: "SOC 2 Trust Criteria",
    badge: "TRUST CRITERIA",
    description: "Evaluates security, availability, confidentiality, and processing integrity across the entire application stack.",
    controls: [
      {
        control: "CC6.1 - Logical Access Controls",
        requirement: "Restrict access to sensitive tenant records and administrative controls.",
        avenraImplementation: "PostgreSQL Row-Level Security (RLS) policies enforce strict tenant boundaries on every SQL query. Explicit RBAC capabilities required.",
        status: "ENFORCED",
      },
      {
        control: "CC6.6 - Boundary Protection",
        requirement: "Protect against unauthorized network penetration and cross-service compromise.",
        avenraImplementation: "Air-gapped Python AI service owns no database credentials. Only Spring Boot API coordinates data access.",
        status: "ENFORCED",
      },
      {
        control: "CC7.2 - System Monitoring & Audit",
        requirement: "Detect unauthorized attempts and maintain immutable audit records.",
        avenraImplementation: "Append-only audit ledger records actor, timestamp, client IP, and payload changes for all state transitions.",
        status: "ENFORCED",
      },
      {
        control: "CC8.1 - Change Management",
        requirement: "Ensure all software releases pass strict vulnerability scanning and peer reviews.",
        avenraImplementation: "All CI actions pinned to full commit SHAs, 7-day cooldown on new dependencies, and automated OSV vulnerability scanning.",
        status: "ENFORCED",
      },
    ],
  },
  {
    id: "hipaa",
    name: "HIPAA Technical Safeguards",
    badge: "HEALTHCARE DATA",
    description: "Safeguards electronic Protected Health Information (ePHI) across transmission, storage, and processing.",
    controls: [
      {
        control: "§164.312(a)(1) - Access Control",
        requirement: "Unique user identification and automatic emergency session logoff.",
        avenraImplementation: "Zero generic shared credentials. Ephemeral tokenized client request portals with automated 72h expiration.",
        status: "ENFORCED",
      },
      {
        control: "§164.312(a)(2)(iv) - Encryption & Decryption",
        requirement: "Encrypt ePHI at rest and in transit across public networks.",
        avenraImplementation: "TLS 1.3 in transit with strict HSTS. AES-256-GCM envelope encryption at rest with multi-generation key rotation.",
        status: "ENFORCED",
      },
      {
        control: "§164.312(c)(1) - Data Integrity",
        requirement: "Protect ePHI from improper alteration or destruction.",
        avenraImplementation: "SHA-256 package manifests verify byte-level file integrity. Discrepancies raise immediate exceptions.",
        status: "ENFORCED",
      },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR & Privacy Frameworks",
    badge: "EU PRIVACY REGULATION",
    description: "Upholds the fundamental rights of data subjects regarding personal data processing and erasure.",
    controls: [
      {
        control: "Article 17 - Right to Erasure",
        requirement: "Erase personal data without undue delay upon valid subject request.",
        avenraImplementation: "Automated purge workflows remove client records and clear associated S3 bucket objects across private storage.",
        status: "ENFORCED",
      },
      {
        control: "Article 25 - Data Protection by Design",
        requirement: "Implement technical measures ensuring only necessary personal data is processed.",
        avenraImplementation: "Request links ask only for missing fields. Dynamic forms prevent over-collection of unnecessary client data.",
        status: "ENFORCED",
      },
      {
        control: "Article 28 - Processor Obligations",
        requirement: "Process client data strictly upon documented customer instructions.",
        avenraImplementation: "Avenra models are strictly zero-retention. Zero customer data is sold, mined, or used for AI model training.",
        status: "ENFORCED",
      },
    ],
  },
  {
    id: "sec",
    name: "Recordkeeping Safeguards",
    badge: "FINANCIAL BOOKS & RECORDS",
    description: "Mandates that electronic records be preserved in an immutable, tamper-evident format.",
    controls: [
      {
        control: "Rule 17a-4(f) - Immutable Storage",
        requirement: "Store records in non-erasable, non-rewriteable storage formats.",
        avenraImplementation: "Evidence lockers are archived directly into customer S3 buckets enabled with S3 Object Lock (Compliance Mode).",
        status: "ENFORCED",
      },
      {
        control: "Immediate Verification",
        requirement: "Verify the quality and accuracy of the storage recording process.",
        avenraImplementation: "Automated SHA-256 hash comparison between the local manifest and the cloud object ETag upon archival.",
        status: "ENFORCED",
      },
    ],
  },
];

export function EnterpriseComplianceMatrix() {
  const [activeStandardId, setActiveStandardId] = useState("soc2");
  const standard = (STANDARDS.find((s) => s.id === activeStandardId) ?? STANDARDS[0])!;

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      {/* Top Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Scale className="size-5 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            Enterprise Regulatory & Compliance Alignment Matrix
          </span>
        </div>
        <span className="rounded-full bg-success-surface px-2.5 py-0.5 text-[10px] font-bold text-success flex items-center gap-1">
          <CheckCircle2 className="size-3" /> CONTINUOUS AUDIT EVIDENCE
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-background/50">
        {STANDARDS.map((item) => {
          const isSelected = item.id === activeStandardId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveStandardId(item.id)}
              className={`p-4 text-left transition-all border-r border-border last:border-r-0 ${
                isSelected
                  ? "bg-canvas border-b-2 border-b-brand"
                  : "hover:bg-canvas/60 opacity-75 hover:opacity-100"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand block mb-1">
                {item.badge}
              </span>
              <span className={`text-xs font-bold ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{standard.name} Framework Alignment</h3>
          <p className="mt-1.5 text-xs text-text-secondary leading-relaxed max-w-3xl">
            {standard.description}
          </p>
        </div>

        {/* Controls Table */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-canvas text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 w-[24%]">Standard Control</th>
                <th className="p-4 w-[36%]">Requirement Summary</th>
                <th className="p-4 w-[40%]">Avenra Architectural Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {standard.controls.map((ctrl, idx) => (
                <tr key={idx} className="hover:bg-canvas/40 transition-colors">
                  <td className="p-4 align-top">
                    <span className="font-bold text-text-primary block font-mono text-[11px]">
                      {ctrl.control}
                    </span>
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-success">
                      <Check className="size-3" /> {ctrl.status}
                    </span>
                  </td>
                  <td className="p-4 align-top text-text-secondary leading-relaxed">
                    {ctrl.requirement}
                  </td>
                  <td className="p-4 align-top text-text-primary leading-relaxed font-medium">
                    {ctrl.avenraImplementation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
