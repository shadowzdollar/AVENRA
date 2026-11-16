"use client";

import {
  FolderLock,
  Scale,
  ShieldCheck,
  UserCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const LEGAL_FAQS = [
  {
    category: "Court Admissibility",
    question: "Are Avenra Evidence Packs admissible in court or regulatory enforcement hearings?",
    answer: "Yes. Federal Rules of Evidence 901 and 902(13)/(14) permit the self-authentication of electronic records that have been certified by a qualified person and validated through a cryptographic process. Avenra Evidence Packs include the complete SHA-256 package hash, file-level checksums, verified client IP attribution, UTC timestamps, and tamper-proof audit manifests that establish an unbroken chain of custody.",
    technicalDetails: "Meets NIST Special Publication 800-88 and ISO/IEC 27037 standards for digital evidence preservation.",
  },
  {
    category: "Client Privilege",
    question: "Does using Avenra waive Attorney-Client Privilege or Work Product Doctrine protections?",
    answer: "No. Avenra acts strictly as a confidential software infrastructure provider under formal Data Protection Agreements (DPA) and confidentiality covenants. Client documents live exclusively in your firm's sovereign cloud storage bucket encrypted with your private KMS key. Avenra engineers never access client documents, and our air-gapped AI service retains zero document bytes in memory or training datasets.",
    technicalDetails: "Preserves Rule 1.6 confidentiality standards under the ABA Model Rules of Professional Conduct.",
  },
  {
    category: "Conflict Clearance",
    question: "How does Avenra integrate with existing practice management software (Clio, NetDocuments, iManage)?",
    answer: "Avenra features contract-first OpenAPI v1 endpoints and signed outbound webhooks. When a matter completes in Avenra, the sealed Evidence Pack and metadata sync directly into matter folders in iManage, NetDocuments, or SharePoint, while billing milestones update your practice ERP.",
    technicalDetails: "Webhooks carry HMAC-SHA256 signatures for zero-trust perimeter verification.",
  },
];

export function LegalHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/solutions/legal.jpg"
      alt="Legal Evidentiary Provenance and Closing Binders"
      title="Legal Evidentiary Provenance"
      subtitle="Complete closing binders, KYC declarations, and verified legal chain of custody"
      badge="COURT ADMISSIBLE"
      badgeVariant="success"
      highlights={[
        { label: "Closing Binders", value: "SHA-256 Certified" },
        { label: "Signatures", value: "Tamper-Evident" },
        { label: "Missing Exhibits", value: "0 Invariant" },
      ]}
    />
  );
}

export default function LegalSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Industry Solution"
      badge="Legal & Corporate Counsel"
      title="Streamline Client Intake & Legal Closing Deliverables"
      subtitle="From corporate entity onboarding and KYC collection to multi-party closing binders. Avenra eliminates manual email ping-pong and produces court-admissible audit trails."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Legal & Corporate Practice" },
      ]}
      heroVisual={<LegalHeroVisual />}
      stats={[
        { value: "78%", label: "Faster Intake", detail: "Automated document gathering" },
        { value: "0", label: "Lost Files", detail: "Direct presigned S3 upload" },
        { value: "100%", label: "Court Admissible", detail: "SHA-256 evidence package" },
        { value: "48h → 3h", label: "KYC Turnaround", detail: "Automated schema extraction" },
      ]}
      features={[
        {
          icon: Scale,
          title: "Matter Onboarding & Intake",
          description: "Clients receive a passwordless magic portal to upload passports, incorporation certificates, and sign fee disclosures.",
          badge: "INTAKE",
        },
        {
          icon: ShieldCheck,
          title: "Automated KYC Verification",
          description: "Verification rules validate registry numbers, extract entity officers, and ensure all mandatory declarations are provided.",
          badge: "COMPLIANCE",
        },
        {
          icon: FolderLock,
          title: "Audit-Ready Binder Assembly",
          description: "Completed matters compile into sealed evidence packs with timestamps, SHA-256 hashes, and client confirmations.",
          badge: "EVIDENCE",
        },
        {
          icon: UserCheck,
          title: "Partner Sign-Off Gates",
          description: "Partners retain full control. No matter progresses to active billing without explicit partner approval.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Legal Lifecycle Breakdown */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Legal Workflow Architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              End-to-End Matter Intake to Closing Binder Preservation
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              In most law firms, matter intake involves multiple associates emailing back and forth with clients, losing track of corporate resolution versions, and assembling closing binders over weeks of non-billable weekend work. Avenra replaces chaos with deterministic state:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Engagement Intake</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Client receives a single-use tokenized Magic Portal to upload certified formation documents, shareholder registers, and beneficial ownership filings.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Automated Verification</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Rules inspect state registry numbers, check signatory corporate authorizations, and verify that ID documents are within legal validity windows.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Partner Review Gate</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Senior attorneys review verified entity abstracts, confirm conflict clearances, and sign off with cryptographic attribution.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 04</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Sealed Binder Archival</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                All exhibits compile into an immutable, offline-verifiable ZIP package signed with SHA-256 and stored in your private AWS S3 bucket.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Corporate Legal Practice"
            clientType="Commercial Real Estate & Finance Practice"
            badge="ZERO LOST EXHIBITS ACROSS 350 MATTERS"
            title="Accelerating Commercial Real Estate Syndication Closings"
            challenge="Managing 40+ syndicated loan closings per quarter across dozens of borrower entities was drowning real estate associates in unverified title policies, expired entity certificates, and missing flood hazard declarations. Closing dates slipped, leading to partner frustration and client write-down demands."
            solution="The firm implemented Avenra for all commercial loan intake. Borrowers were dispatched single-use Magic Portals requesting survey plats, title binders, and operating agreements. Avenra automatically flagged expired certificates of good standing and compiled court-admissible evidence packages upon escrow disbursement."
            outcomes={[
              { metric: "14 Days → 3 Days", label: "Closing Preparation", detail: "Turnaround time reduced by 78%" },
              { metric: "0", label: "Defective Loan Files", detail: "Zero secondary market loan audit exceptions" },
              { metric: "18.5 Hours", label: "Partner Hours Saved", detail: "Reclaimed per syndicated real estate loan" },
              { metric: "100%", label: "Court Admissibility", detail: "Self-authenticating FRE 902 evidence" },
            ]}
            quote={{
              text: "Avenra eliminated the panic of missing closing exhibits. We know with mathematical certainty that every loan file is complete, verified, and sealed before funds move.",
              author: "Engagement Lead",
              role: "Practice Group Leader",
              firm: "Representative Syndicated Finance Practice",
            }}
            beforeAfter={[
              {
                before: "Paralegals spent 3 days per closing manually checking off PDF exhibits on printed paper sheets.",
                after: "Avenra verification rules automatically validate file types, entity matching, and freshness in under 1 second.",
              },
              {
                before: "Borrowers emailed sensitive corporate tax returns and bank wires as unencrypted attachments.",
                after: "Borrowers upload directly through encrypted, tokenized Magic Links with instant in-memory malware scanning.",
              },
              {
                before: "Post-closing binders took 3 weeks to compile and burn to DVDs for lenders.",
                after: "Self-contained Evidence Packs export directly to firm S3 storage and iManage matter folders in 400ms.",
              },
            ]}
          />
        </div>

        {/* Legal Practice FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Legal & Corporate Practice FAQ"
            subtitle="Understand court admissibility, confidentiality safeguards, and practice management integrations."
            items={LEGAL_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
