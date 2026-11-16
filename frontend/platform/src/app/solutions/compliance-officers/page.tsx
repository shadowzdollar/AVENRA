"use client";

import {
  Fingerprint,
  FolderLock,
  ShieldCheck,
  UserCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseComplianceMatrix } from "@/components/enterprise/EnterpriseComplianceMatrix";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const COMPLIANCE_OFFICER_FAQS = [
  {
    category: "Policy Enforcement",
    question: "How does Avenra prevent employees from cutting corners under tight deadlines?",
    answer: "In traditional firms, compliance policies exist in 100-page employee handbooks that busy operators ignore during high-stress closing deadlines. Avenra converts written compliance policies into executable software invariants. If a mandatory policy requires dual-operator sign-off, certified identity extraction, and negative sanctions screening, the deliverable state machine physically rejects the transition to COMPLETED until every invariant has been mathematically satisfied.",
    technicalDetails: "Enforced via Java domain entities and database CHECK constraints that reject invalid status writes.",
  },
  {
    category: "Audit Defense",
    question: "How much time does it take to prepare for an unexpected regulatory audit examination with Avenra?",
    answer: "Under 5 minutes. Rather than spending weeks panicking and searching through employee emails and shared network folders, compliance officers export self-contained Evidence Packages directly from sovereign S3 storage. Each package contains the full audit trail, original attachments, and an offline-viewable `audit-summary.html` report ready for regulatory examiners.",
    technicalDetails: "Eliminates 95% of administrative audit preparation labor.",
  },
  {
    category: "Attribution",
    question: "How does Avenra eliminate the compliance risk of shared administrative credentials?",
    answer: "Avenra enforces strict capability-based RBAC. Every action requires explicit permission grants tied to individual authenticated user sessions (via authenticated server sessions and TOTP two-step verification). Generic 'Admin' accounts with blanket override authority are architecturally prohibited, ensuring complete personal attribution in regulatory audit logs.",
    technicalDetails: "Audit ledger records exact actor UUID, IP address, user agent, and cryptographic signature for every event.",
  },
];

export function ComplianceOfficersHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/solutions/compliance-officers.jpg"
      alt="Regulatory Invariant Enforcement and Compliance Architecture"
      title="Regulatory Invariant Enforcement"
      subtitle="Transform policy documents into executable database constraints and unmodifiable audit records"
      badge="100% PASSING"
      badgeVariant="success"
      highlights={[
        { label: "Policy Invariant", value: "Code-Level Guard" },
        { label: "Audit Ledger", value: "Append-Only Stream" },
        { label: "Policy Bypasses", value: "0 Invariant" },
      ]}
    />
  );
}

export default function ComplianceOfficersSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Role Solutions"
      badge="Compliance & Risk Officers"
      title="Uncompromising Policy Enforcement for Risk & Compliance Officers"
      subtitle="Transform policy documents into executable system constraints. Guarantee that no deliverable completes without mandatory checks, operator sign-offs, and immutable evidence."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Compliance Officers" },
      ]}
      heroVisual={<ComplianceOfficersHeroVisual />}
      stats={[
        { value: "0", label: "Skipped Policies", detail: "Enforced at code and DB level" },
        { value: "100%", label: "Actor Attribution", detail: "Zero shared admin credentials" },
        { value: "SHA-256", label: "Evidence Provenance", detail: "Cryptographic tamper proofing" },
        { value: "1-Click", label: "Audit Binder Export", detail: "Full regulatory documentation" },
      ]}
      features={[
        {
          icon: ShieldCheck,
          title: "System-Enforced Policies",
          description: "Rules are not optional guidelines in an employee handbook. They are code-level preconditions that physically block invalid transitions.",
          badge: "ENFORCEMENT",
        },
        {
          icon: Fingerprint,
          title: "Immutable Event Ledger",
          description: "Every file upload, rule check, approval, and rejection is permanently recorded in an append-only audit trail.",
          badge: "PROVENANCE",
        },
        {
          icon: UserCheck,
          title: "Granular Role-Free RBAC",
          description: "Permissions are granted per specific capability (`work.approve`, `evidence.export`), eliminating dangerous generic admin roles.",
        },
        {
          icon: FolderLock,
          title: "Cryptographic Evidence Binders",
          description: "Export full audit packages containing every document, verification trace, and client confirmation in an offline-verifiable ZIP.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Policy to Code Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Regulatory Architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Converting Written Policies into Mathematical Invariants
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              When regulatory bodies penalize professional firms, the defense &apos;our policy required it, but an employee forgot&apos; never holds up. Avenra ensures policies are active code guards, not passive text:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Policy Rule Definition</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Compliance teams configure mandatory checkpoints: OFAC sanctions clearance, certified entity extracts, and secondary partner review.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Code Guard Enforcement</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                The state machine enforces these rules at the Java entity and PostgreSQL constraint layer. No user interface button can bypass the gate.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Cryptographic Proof</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Every rule evaluation is permanently recorded in an append-only audit trail and compiled into an offline-verifiable Evidence Pack.
              </p>
            </div>
          </div>
        </div>

        {/* Live Regulatory Alignment Matrix */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Regulatory Standards Alignment
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Automated Code Controls Mapped to Global Frameworks
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Inspect how Avenra satisfies specific audit control requirements across security, access control, integrity, and privacy frameworks.
            </p>
          </div>
          <EnterpriseComplianceMatrix />
        </div>

        {/* Compliance Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Financial Risk & Compliance"
            clientType="Cross-Border Wealth Advisory Firm"
            badge="100% CLEAN REGULATORY AUDIT"
            title="Passing Stringent SEC & FINRA Examinations with Zero Missing Checkpoint Deficiencies"
            challenge="Managing high-net-worth foreign investor onboarding across 40 jurisdictions was exposing the firm to severe AML regulatory risk. Compliance officers discovered that account managers frequently marked files 'Approved' before receiving certified translations of passport declarations, relying on promises that files would be sent later."
            solution="The Chief Compliance Officer deployed Avenra across all investor onboarding. Avenra made document verification a non-negotiable prerequisite in the deliverable state machine. Accounts could not be opened in the clearing system until all beneficial ownership documents passed schema validation and compliance officer sign-off."
            outcomes={[
              { metric: "0 Deficiencies", label: "SEC Examination Results", detail: "Clean regulatory bill of health" },
              { metric: "100%", label: "Check Enforcement", detail: "Zero unverified accounts opened" },
              { metric: "5 Minutes", label: "Audit Package Generation", detail: "Down from 3 weeks of frantic manual prep" },
              { metric: "Full Attribution", label: "Operator Trace", detail: "Every sign-off cryptographically certified" },
            ]}
            quote={{
              text: "Avenra gave us total control. I sleep soundly knowing that our staff cannot cut compliance corners even under intense commercial pressure.",
              author: "Victoria Sterling",
              role: "Chief Compliance Officer",
              firm: "Apex Sovereign Wealth Advisors",
            }}
            beforeAfter={[
              {
                before: "Account managers used paper checklists and marked items complete based on verbal promises from clients.",
                after: "State machine physically blocks account transition until certified documents are uploaded and verified.",
              },
              {
                before: "Regulatory examinations required hiring temporary paralegals to sift through archived employee email threads.",
                after: "All files, timestamps, and checks export into an offline-verifiable Evidence Pack in under 5 minutes.",
              },
              {
                before: "Shared admin credentials made it impossible to determine which operator approved an exception.",
                after: "Explicit capability-based RBAC logs exact operator biometric identity and timestamp for every action.",
              },
            ]}
          />
        </div>

        {/* Compliance FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Compliance Officer & Regulatory FAQ"
            subtitle="Understand how Avenra protects your firm from regulatory sanctions, fines, and reputational risk."
            items={COMPLIANCE_OFFICER_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
