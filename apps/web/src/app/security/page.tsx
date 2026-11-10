"use client";

import {
  Database,
  FolderLock,
  Key,
  Lock,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  FileText,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { VisualSecurityVaultMockup } from "@/components/enterprise/VisualSecurityVaultMockup";
import { EnterpriseComplianceMatrix } from "@/components/enterprise/EnterpriseComplianceMatrix";
import { EnterpriseSecurityAuditViewer } from "@/components/enterprise/EnterpriseSecurityAuditViewer";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const FAQ_ITEMS = [
  {
    category: "Architecture",
    question: "How does Avenra prevent tenant data leakage at the database layer?",
    answer: "Unlike standard multi-tenant web applications that rely on application code developers remembering to write `WHERE tenant_id = :id`, Avenra enforces PostgreSQL Row-Level Security (RLS) directly at the database engine kernel level. Even if an engineer wrote `SELECT * FROM work_items`, the database engine filters and returns exclusively rows matching the authenticated session's tenant ID.",
  },
  {
    category: "Security Assessments",
    question: "How can our infosec team evaluate Avenra's architecture and technical controls?",
    answer: "We provide comprehensive security architecture documentation, threat model reviews, and control mappings against standard audit criteria. Our technical documentation and security whitepapers detail our database isolation, cryptographic proofs, and pipeline invariants.",
  },
  {
    category: "Custody",
    question: "Does Avenra ever store our confidential documents in a shared vendor cloud bucket?",
    answer: "No. Avenra supports Sovereign Data Custody. You can configure your own enterprise AWS S3 bucket, Cloudflare R2 bucket, or private MinIO cluster. Files stream directly to your infrastructure with your KMS keys; Avenra maintains zero persistent document copies.",
  },
  {
    category: "Vulnerability Management",
    question: "What is your vulnerability response SLA and patch deployment cadence?",
    answer: "Critical vulnerabilities (CVSS 9.0+) are triaged within 2 hours and remediated via emergency hotfix within 24 hours. High-severity issues are resolved within 72 hours. All application dependencies undergo automated daily Snyk and GitHub Dependabot SCA scanning.",
  },
];

export default function SecurityTrustCenterPage() {
  return (
    <MarketingLayout
      category="Enterprise Trust Center"
      badge="Zero-Trust Architecture"
      variant="security"
      title="Security & Trust Built From First Principles"
      subtitle="Security is not a checkbox added before launch. In Avenra, defense-in-depth, strict tenant isolation, and cryptographic provenance are architectural invariants."
      breadcrumbs={[{ label: "Security & Trust" }]}
      heroVisual={<VisualSecurityVaultMockup />}
      stats={[
        { value: "PostgreSQL RLS", label: "Tenant Isolation", detail: "Enforced at kernel database level" },
        { value: "AES-256-GCM", label: "Encryption at Rest", detail: "Authenticated multi-key rotation" },
        { value: "SHA-256", label: "Cryptographic Proof", detail: "Per-deliverable evidence hash" },
        { value: "ClamAV", label: "Malware Defense", detail: "Inline upload stream scanning" },
      ]}
      features={[
        {
          icon: Lock,
          title: "Multi-Tenant Row-Level Security",
          description: "Every tenant-owned table is protected by a PostgreSQL Row-Level Security (RLS) policy. Tenant IDs from HTTP headers are never trusted.",
          badge: "ADR-005",
        },
        {
          icon: FolderLock,
          title: "Cryptographic Evidence Locker",
          description: "Completed deliverables are compiled into tamper-proof proof packages with full chain-of-custody checksums.",
          badge: "PROOF",
        },
        {
          icon: Database,
          title: "Sovereign Cloud Data Custody",
          description: "Your client documents and evidence packages reside exclusively in your designated private S3 bucket.",
          badge: "CUSTODY",
        },
        {
          icon: ShieldCheck,
          title: "Strict Explicit RBAC",
          description: "Access controls are evaluated against explicit fine-grained capabilities (`work.approve`, `org.write`), never generic roles.",
          badge: "RBAC",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Deep Security Subsystems Grid */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Security Deep Dives
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Explore the 5 Pillars of Avenra Trust
              </h2>
            </div>
            <p className="text-sm text-text-secondary max-w-md">
              Review technical documentation, regulatory attestations, and cryptographic specifications.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                href: "/security/tenant-isolation",
                title: "Kernel Tenant Isolation",
                code: "ADR-005",
                desc: "PostgreSQL Row-Level Security, session derivation, and strict client header discarding.",
                icon: Database,
              },
              {
                href: "/security/cryptography",
                title: "Cryptography & Integrity",
                code: "NIST FIPS 140",
                desc: "AES-256-GCM envelope encryption, Ed25519 signatures, and SHA-256 evidence sealing.",
                icon: Key,
              },
              {
                href: "/security/privacy",
                title: "Data Sovereignty & Privacy",
                code: "GDPR / CCPA",
                desc: "Zero AI model training, client bucket custody, and strict data minimization.",
                icon: ShieldAlert,
              },
              {
                href: "/security/compliance",
                title: "Regulatory Compliance",
                code: "AUDIT READINESS",
                desc: "Architectural control mappings for access isolation, audit logging, and integrity verification.",
                icon: FileCheck2,
              },
              {
                href: "/security/whitepaper",
                title: "Security Whitepaper",
                code: "WHITE-PAPER-2026",
                desc: "Comprehensive 40-page architectural security whitepaper with executive summaries.",
                icon: FileText,
              },
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className="group rounded-2xl border border-border bg-canvas-subtle p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-canvas hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-text-tertiary group-hover:text-emerald-400 transition-colors">
                      {sub.code}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-text-primary group-hover:text-emerald-400 transition-colors">
                    {sub.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {sub.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    Read Architecture Pillar <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Regulatory Compliance Matrix */}
        <div>
          <EnterpriseComplianceMatrix />
        </div>

        {/* Continuous Security Audit Viewer */}
        <div>
          <EnterpriseSecurityAuditViewer />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Enterprise Security & Trust FAQ"
            subtitle="Deep engineering answers on penetration testing, tenant isolation, and regulatory certifications."
            items={FAQ_ITEMS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
