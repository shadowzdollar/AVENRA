"use client";

import {
  FolderLock,
  Landmark,
  Lock,
  ShieldCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const FIN_FAQS = [
  {
    category: "Regulatory Invariants",
    question: "How does Avenra support Bank Secrecy Act (BSA) and FinCEN Customer Due Diligence (CDD) compliance?",
    answer: "FinCEN's CDD Rule requires financial institutions to identify and verify the identity of beneficial owners holding 25% or more equity in legal entity customers. Avenra enforces this through mandatory verification checkpoints: entity formation documents and ownership structures must be extracted, verified against registries, and confirmed by compliance officers before an account or credit facility can transition to APPROVED status.",
    technicalDetails: "Zero exceptions without compliance principal override. All verification traces sealed in `checks-log.json`.",
  },
  {
    category: "Recordkeeping Integrity",
    question: "How does Avenra support investment fund recordkeeping and evidence custody?",
    answer: "Avenra compiles every completed underwriting dossier, investor subscription, and transaction log into an immutable completion manifest with SHA-256 cryptographic digests, exportable directly to your firm's private S3 storage (ADR-028, ADR-034).",
    technicalDetails: "Provides automated SHA-256 integrity proofs and audit trail logs required during regulatory examinations.",
  },
  {
    category: "Data Residency & KMS",
    question: "Can our financial institution manage its own encryption keys and maintain strict sovereign data custody?",
    answer: "Yes. Avenra supports direct integration with AWS KMS Customer Managed Keys (CMK), Azure Key Vault, or HashiCorp Vault. Your institution controls the master Key Encryption Key (KEK) and can revoke access instantly. All financial documents and evidence packs reside exclusively in your dedicated cloud tenant.",
    technicalDetails: "Envelope encryption with AES-256-GCM. Avenra has zero access to plaintext without your KMS authorization.",
  },
];

export function FinancialHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/solutions/financial-services.jpg"
      alt="Institutional Underwriting and KYC Due Diligence"
      title="Institutional Underwriting Dossier"
      subtitle="Commercial credit underwriting, borrower beneficial ownership verification, and sovereign S3 export"
      badge="BSA CDD VERIFIED"
      badgeVariant="success"
      highlights={[
        { label: "Beneficial Owners", value: "100% Verified" },
        { label: "Sanctions Clearance", value: "0 Hits Clear" },
        { label: "Underwriting Pack", value: "SHA-256 Sealed" },
      ]}
    />
  );
}

export default function FinancialServicesSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Industry Solution"
      badge="Financial Services & Funds"
      title="High-Integrity Dossier Assembly for Regulated Financial Operations"
      subtitle="From commercial credit underwriting packets to LP subscription onboarding. Avenra delivers verifiable AML/KYC checks, strict audit trails, and sovereign cloud custody."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Financial Services" },
      ]}
      heroVisual={<FinancialHeroVisual />}
      stats={[
        { value: "Audit Ready", label: "Evidence Integrity", detail: "Immutable event streams" },
        { value: "0 Leakage", label: "Tenant Isolation", detail: "Strict PostgreSQL RLS" },
        { value: "SHA-256", label: "Document Proof", detail: "Cryptographic hash per record" },
        { value: "10x", label: "Underwriting Velocity", detail: "Automated packet verification" },
      ]}
      features={[
        {
          icon: Landmark,
          title: "Loan & Due Diligence Dossiers",
          description: "Assemble multi-source borrower records: tax returns, bank letters, and collateral appraisals into structured folders.",
          badge: "DOSSIER",
        },
        {
          icon: ShieldCheck,
          title: "Automated AML/KYC Checkpoints",
          description: "Verify identity documents and company beneficial ownership against sanctions databases with deterministic rules.",
          badge: "VERIFICATION",
        },
        {
          icon: FolderLock,
          title: "Regulator-Ready Evidence Bundles",
          description: "Produce comprehensive proof archives with cryptographic signatures, satisfying stringent SEC and FINRA examinations.",
        },
        {
          icon: Lock,
          title: "Bank-Grade Encryption",
          description: "All client documents are encrypted at rest with AES-256-GCM and stored in private, customer-managed S3 buckets.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Underwriting Dossier Lifecycle */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Credit & Onboarding Architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Deterministic Underwriting from Intake to Credit Committee
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Financial institutions cannot afford manual checklist omissions or unencrypted document transfers. Avenra enforces an unbroken, mathematically verified pipeline:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Borrower Intake</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Borrowers receive single-use, high-entropy Magic Portals to submit certified financial statements, debt schedules, and identification.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Stream Anti-Malware</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Incoming uploads are inspected in-memory via ClamAV sockets before reaching storage, neutralizing macro-enabled financial spreadsheet threats.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Rule Verification</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Deterministic checks verify EIN formatting, calculate debt-service coverage ratio (DSCR) inputs, and cross-reference sanctions registries.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 04</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Credit Committee Seal</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Credit officers approve with granular RBAC permissions. The dossier is sealed into an sealed Evidence Pack in sovereign S3.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Services Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Private Credit & Commercial Lending"
            clientType="$2.4B Direct Lending Fund"
            badge="10X UNDERWRITING SPEEDUP"
            title="Accelerating Commercial Loan Dossier Underwriting with 100% FinCEN Compliance"
            challenge="Managing 60 simultaneous borrower underwriting files across multiple lending syndicates was causing severe operational delays. Credit analysts spent 14 hours per loan chasing updated tax transcripts and reconciling cap tables. Loan files frequently reached credit committee with unverified guarantor signatures."
            solution="The fund deployed Avenra across all borrower intake and underwriting workflows. Borrowers uploaded documentation through encrypted Magic Portals. Avenra's verification engine automatically validated tax ID formats, calculated equity ownership sums, and compiled sealed credit binders upon committee approval."
            outcomes={[
              { metric: "18 Days → 2 Days", label: "Underwriting Intake Time", detail: "89% compression in dossier assembly" },
              { metric: "0 Deficiencies", label: "External Regulatory Audits", detail: "100% compliance across SEC & FinCEN reviews" },
              { metric: "$620,000", label: "Annual Operational Savings", detail: "Reclaimed senior underwriter capacity" },
              { metric: "SHA-256", label: "Evidence Package Sealing", detail: "Tamper-evident manifest export" },
            ]}
            quote={{
              text: "Avenra gives our credit committee complete confidence. Every loan file that comes before us has been mathematically validated against our underwriting standards.",
              author: "Robert Sterling",
              role: "Chief Risk Officer",
              firm: "Apex Horizon Credit Partners",
            }}
            beforeAfter={[
              {
                before: "Borrowers emailed sensitive corporate tax returns and bank wires to individual analysts' personal inboxes.",
                after: "Borrowers upload directly into tokenized, encrypted Magic Portals with in-memory malware scanning.",
              },
              {
                before: "Underwriters manually checked whether corporate certificates were within 30 days of closing, frequently missing expired filings.",
                after: "Avenra verification rules automatically check document dates against legal freshness windows upon upload.",
              },
              {
                before: "Preparing audit packages for institutional investors took 3 weeks of manual folder compilation.",
                after: "Complete, self-contained Evidence Packs export in 1 click with verifiable SHA-256 checksums.",
              },
            ]}
          />
        </div>

        {/* Financial FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Financial Services Compliance & Architecture FAQ"
            subtitle="Understand BSA/AML rules, evidence packaging, and S3 storage export."
            items={FIN_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
