"use client";

import {
  Calculator,
  FolderLock,
  Receipt,
  ShieldCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const ACCOUNTING_FAQS = [
  {
    category: "Audit Defense",
    question: "How do Avenra Evidence Packs protect CPAs and audit firms during PCAOB and peer review inspections?",
    answer: "Avenra compiles every completed tax return, compilation, and audit binder into an immutable, self-contained Evidence Pack. Each pack contains a machine-readable `manifest.json` and human-readable `audit-summary.html` recording the exact SHA-256 fingerprint of each source bank statement, general ledger extract, and workpaper, along with the operator verification trace. Peer reviewers can verify that workpapers were not altered after sign-off.",
    technicalDetails: "Meets AICPA Statement on Standards for Attestation Engagements (SSAE No. 18) and PCAOB AS 1215 audit documentation standards.",
  },
  {
    category: "Reconciliation Automation",
    question: "Can Avenra's verification engine automatically calculate and reconcile multi-currency balances?",
    answer: "Yes. Verification rules evaluate mathematical relationships across extracted tables. For example, the engine verifies that ending bank statement balances match general ledger cash accounts, that sales tax schedules tie to line items, and that equity distributions sum to exactly 100.00%. If numbers fail to reconcile within configured tolerances, an exception is immediately routed to the preparer.",
    technicalDetails: "Supports configurable floating-point tolerances and automatic currency conversion cross-referencing daily central bank fixings.",
  },
  {
    category: "Client Tax Portals",
    question: "How does Avenra handle complex 1099, K-1, and W-2 collection during peak tax season?",
    answer: "Clients receive a personalized Magic Portal displaying an interactive checklist of required schedules. As clients upload files, Avenra's air-gapped AI identifies document types (e.g. distinguishing a 1099-B from a 1099-DIV), extracts key box totals, and checks them off in real-time. If an expected schedule is missing, adaptive reminders nudge the client automatically.",
    technicalDetails: "Zero portal login friction leads to 4x faster tax document turnaround during Q1 filing deadlines.",
  },
];

export function AccountingHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/solutions/accounting.jpg"
      alt="CPA Workpaper and PBC Audit Reconciliation"
      title="CPA Workpaper Reconciliation"
      subtitle="Complete PBC workpaper binders, ending cash balance reconciliation, and certified tax packages"
      badge="BALANCED 100%"
      badgeVariant="success"
      highlights={[
        { label: "PBC Collection", value: "100% Verified" },
        { label: "Cash Balance Diff", value: "$0.00 Variance" },
        { label: "Missing Workpapers", value: "0 Invariant" },
      ]}
    />
  );
}

export default function AccountingSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Industry Solution"
      badge="Accounting & Audit Networks"
      title="Automated Month-End Close & Tax Audit Work Execution"
      subtitle="Eliminate the chaos of missing client receipts and unverified ledgers. Avenra gathers financial documents, evaluates reconciliation checks, and archives tamper-proof binders."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Accounting & Audit" },
      ]}
      heroVisual={<AccountingHeroVisual />}
      stats={[
        { value: "4x", label: "Faster Closing", detail: "Automated document gathering" },
        { value: "100%", label: "Workpaper Integrity", detail: "Deterministic check evaluation" },
        { value: "Zero", label: "Missing Receipts", detail: "Intelligent reminder cadence" },
        { value: "S3 Direct", label: "Binder Archival", detail: "Self-contained workpapers" },
      ]}
      features={[
        {
          icon: Receipt,
          title: "Receipt & Statement Gathering",
          description: "Clients receive clean mobile-friendly drop links to provide bank statements, 1099s, and expense receipts.",
          badge: "COLLECTION",
        },
        {
          icon: Calculator,
          title: "Reconciliation Checks",
          description: "Automated checks confirm that ending balances, total expenses, and VAT declarations match source attachments.",
          badge: "VERIFICATION",
        },
        {
          icon: FolderLock,
          title: "Permanent Audit Trail",
          description: "Every tax filing and audit binder is archived with cryptographic checksums, satisfying IRS and HMRC documentation standards.",
          badge: "AUDIT BINDER",
        },
        {
          icon: ShieldCheck,
          title: "Strict Tenant Isolation",
          description: "Keep client financial data strictly separated with PostgreSQL Row-Level Security and dedicated S3 access boundaries.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Accounting Close Lifecycle */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Verified Close Lifecycle
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              How Avenra Compresses 2 Weeks of Month-End Close into 48 Hours
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Accounting teams waste hundreds of billable hours sending repetitive emails for bank statements, payroll summaries, and missing invoices. Avenra turns tax season and monthly closes into a predictable state machine:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Targeted Intake</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Automated Magic Links dispatch to client controllers with exact document slots for bank accounts, merchant statements, and inventory summaries.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Automated Ingestion</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                ClamAV antivirus scans incoming files in-memory, while stateless AI parses balance statements, extracting opening and closing values.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Ledger Reconciliation</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Deterministic rules check that bank balances match general ledger trial balances within 0.001 tolerance, flagging discrepancies.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 04</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Sealed Audit Binder</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Once reviewed by a CPA, a permanent, self-contained Evidence Pack is compiled with SHA-256 checksums and archived to firm S3 storage.
              </p>
            </div>
          </div>
        </div>

        {/* Accounting Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Accounting & Advisory"
            clientType="Regional Top 50 CPA Practice"
            badge="4X FASTER TAX SEASON CLOSE"
            title="Automating 1,200 Annual Corporate Tax Binders with Zero Extension Penalties"
            challenge="During annual tax filing season, 45 CPAs and staff accountants spent more than 60% of their daily time calling and emailing 1,200 corporate clients for missing K-1s, fixed asset invoices, and payroll summaries. Over 200 clients were forced into costly extensions solely due to document chase delays."
            solution="The CPA firm deployed Avenra. Clients received personalized Magic Link portals detailing their custom tax document checklist. Avenra's automated reminder cadence gently nudged clients every 72 hours until files were uploaded. The verification engine validated EIN matching and compiled immutable workpaper binders upon review."
            outcomes={[
              { metric: "4.2 Days", label: "Average Intake Time", detail: "Down from 21 days previously" },
              { metric: "99.2%", label: "On-Time Filings", detail: "Virtually eliminated emergency extensions" },
              { metric: "$410,000", label: "Recovered Billable Time", detail: "Reclaimed administrative hours across 45 CPAs" },
              { metric: "100%", label: "Audit Defense Ready", detail: "All workpapers sealed in sovereign S3" },
            ]}
            quote={{
              text: "Avenra eliminated the chaos of tax season. We closed 1,200 corporate binders weeks ahead of deadline without hiring temporary seasonal staff.",
              author: "David Chen, CPA",
              role: "Managing Partner, Tax & Attestation",
              firm: "Chen, Morrison & Sterling CPAs",
            }}
            beforeAfter={[
              {
                before: "Staff accountants spent 3 hours every morning manually sorting through emails and downloading PDF attachments into shared Windows folders.",
                after: "Clients upload directly into categorized matter slots; files are virus-scanned, parsed, and logged automatically.",
              },
              {
                before: "Clients frequently uploaded corrupted scans or truncated bank statements, discovered weeks later during final review.",
                after: "Avenra's AI reading immediately validates PDF page counts, statement date ranges, and entity name matching upon upload.",
              },
              {
                before: "IRS and state tax audit inquiries required days of digging through archived email backups to reconstruct workpaper trails.",
                after: "Standalone Evidence Packs open offline with full cryptographic chain of custody, satisfying auditors in 5 minutes.",
              },
            ]}
          />
        </div>

        {/* Accounting FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Accounting & Audit Practice FAQ"
            subtitle="Understand PCAOB workpaper compliance, multi-currency verification, and client adoption."
            items={ACCOUNTING_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
