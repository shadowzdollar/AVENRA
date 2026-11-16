"use client";

import {
  Fingerprint,
  Lock,
  Scale,
  UserCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseComplianceMatrix } from "@/components/enterprise/EnterpriseComplianceMatrix";
import { EnterpriseSecurityAuditViewer } from "@/components/enterprise/EnterpriseSecurityAuditViewer";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const COMPLIANCE_FAQS = [
  {
    category: "Recordkeeping Standards",
    question: "How does Avenra guarantee unalterable recordkeeping and evidence custody?",
    answer: "Avenra pairs its append-only database audit ledgers with immutable completion manifests. Once a deliverable completes, a sealed manifest is written containing SHA-256 cryptographic digests of every accepted document, answer, and verification check, exportable directly to your firm's S3-compatible storage bucket.",
    technicalDetails: "SHA-256 package manifest integrity with direct S3 storage export (ADR-028, ADR-034).",
  },
  {
    category: "Audit Trailing",
    question: "What ensures that an internal database administrator cannot alter audit logs retroactively?",
    answer: "Avenra enforces database-level triggers that disallow UPDATE and DELETE commands on the `audit_ledger` table. Furthermore, each audit row incorporates a cryptographic hash of the prior row in the sequence, forming a Merkle hash chain. Any modification or deletion of a past event breaks the hash chain, immediately exposing the tampering to auditors.",
    technicalDetails: "PostgreSQL trigger: BEFORE UPDATE OR DELETE ON audit_ledger EXECUTE FUNCTION block_audit_mutation().",
  },
  {
    category: "Explicit RBAC",
    question: "Why does Avenra reject generic 'Admin' roles in favor of capability-based permissions?",
    answer: "Generic roles like 'Admin' or 'Manager' encourage privilege creep, where users are granted broad powers that violate the Principle of Least Privilege evaluated in standard security audits. Avenra evaluates granular, explicit action permissions (e.g. `work.create`, `work.approve`, `evidence.export`, `billing.manage`). An operator can be empowered to review documents without possessing the authority to approve completions or export customer data.",
    technicalDetails: "Spring Security capability evaluator: @PreAuthorize(\"hasAuthority('work.approve')\").",
  },
];

export function ComplianceHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/platform/compliance.jpg"
      alt="Continuous Compliance Ledger and Architectural Controls"
      title="Continuous Compliance Ledger"
      subtitle="Architectural controls enforced directly in database schemas and capability guards"
      badge="AUDIT READY"
      badgeVariant="success"
      highlights={[
        { label: "Tenant Isolation", value: "PostgreSQL RLS" },
        { label: "Capability RBAC", value: "Action-Level" },
        { label: "Audit Stream", value: "Append-Only" },
      ]}
    />
  );
}

export default function CompliancePlatformPage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Automated Governance"
      title="Immutable Audit & Compliance Governance Engine"
      subtitle="Complete traceability for every business decision. Every action, check evaluation, file upload, and state change produces an append-only audit event mapped to major regulatory frameworks."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Compliance Engine" },
      ]}
      heroVisual={<ComplianceHeroVisual />}
      stats={[
        { value: "Append-Only", label: "Audit Ledger", detail: "Events cannot be updated or deleted" },
        { value: "Explicit RBAC", label: "Permission Model", detail: "Zero generic admin roles" },
        { value: "Audit Ready", label: "Standard Controls", detail: "Comprehensive control evidence" },
        { value: "100%", label: "Actor Attribution", detail: "User ID or agent run ID logged" },
      ]}
      features={[
        {
          icon: Fingerprint,
          title: "Immutable Event Streams",
          description: "Every operation writes to an unalterable audit log with timestamps, client IP, actor identity, and payload changes.",
          badge: "IMMUTABLE",
        },
        {
          icon: UserCheck,
          title: "Explicit Action Permissions",
          description: "Authorization checks specific capabilities (e.g. `work.approve`, `client.create`) rather than broad, risky roles.",
          badge: "EXPLICIT RBAC",
        },
        {
          icon: Scale,
          title: "Regulatory Export Packs",
          description: "Export filtered audit logs and evidence binders in structured JSON or PDF for external compliance reviews.",
        },
        {
          icon: Lock,
          title: "Server-Bound Tenancy",
          description: "Tenant isolation is enforced strictly in database queries, preventing cross-tenant information disclosure.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Live Regulatory Alignment Matrix */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Framework Mapping
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Live Regulatory & Compliance Alignment Matrix
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Inspect how Avenra architectural code controls satisfy specific audit requirements across security, access control, integrity, and data protection frameworks.
            </p>
          </div>
          <EnterpriseComplianceMatrix />
        </div>

        {/* Continuous Security Audit Controls Ledger */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Continuous Verification
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Code-Level Security Controls Audit
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Controls are not checked off once a year during an audit review. They are verified by continuous integration tests running against real database kernels.
            </p>
          </div>
          <EnterpriseSecurityAuditViewer />
        </div>

        {/* Compliance FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Regulatory Compliance & Governance FAQ"
            subtitle="Straightforward answers for Compliance Officers, Legal Counsel, and Institutional Risk Reviewers."
            items={COMPLIANCE_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
