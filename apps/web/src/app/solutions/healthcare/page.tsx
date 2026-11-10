"use client";

import {
  FileCheck2,
  FolderLock,
  Lock,
  Stethoscope,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const HEALTHCARE_FAQS = [
  {
    category: "Technical Safeguards",
    question: "How does Avenra protect sensitive healthcare and clinician data?",
    answer: "Avenra enforces strict technical safeguards: (1) Access Controls: Explicit capability-based RBAC requires distinct permissions (`work.read`, `work.approve`); (2) Audit Controls: Append-only audit ledgers log every state change, document upload, and export; (3) Integrity Controls: SHA-256 hashes prove documents have not been modified post-upload; (4) Transmission & Storage: Traffic is encrypted in transit via TLS 1.3 and credentials sealed with AES-256-GCM.",
    technicalDetails: "Organizations assess their own regulatory obligations; Avenra provides strict technical data isolation.",
  },
  {
    category: "Clinician Credentialing",
    question: "Can Avenra track medical license and malpractice insurance expiration automatically?",
    answer: "Yes. Verification rules evaluate temporal bounds. When clinicians submit medical licenses, DEA registration certificates, and board certifications through Magic Portals, Avenra's AI extracts the expiration dates. The system sets automated reminders 90, 60, and 30 days prior to license lapse, preventing uncredentialed clinicians from practicing.",
    technicalDetails: "Rules enforce strict state-specific licensing requirements and board certification registries.",
  },
  {
    category: "Zero AI Retention",
    question: "Are patient medical records or clinical trial forms ever stored in AI training datasets?",
    answer: "Never. Avenra's Python AI engine runs statelessly in an air-gapped container with zero database connections and zero persistent disk volumes. Document bytes are processed exclusively in RAM memory buffers and deleted immediately after JSON extraction. Avenra maintains a strict Zero Data Retention policy.",
    technicalDetails: "Complies with HHS OCR guidelines on AI in Healthcare and GDPR Article 28 data processor obligations.",
  },
];

export function HealthcareHeroVisual() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Clinician Credentialing Dossier</span>
        <span className="text-emerald-400 font-bold">ISOLATED_DATA</span>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="text-emerald-400">Clinician: Dr. Alistair Finch, MD (wrk_med_0129)</div>
        <div className="text-[#7ee787]">✓ State Medical Board License Verified (Valid thru 2028)</div>
        <div className="text-[#7ee787]">✓ DEA Controlled Substance Registration Validated</div>
        <div className="text-[#7ee787]">✓ Malpractice Certificate of Insurance ($3M/$5M Verified)</div>
        <div className="text-cyan-400">✓ Sealed Credentialing Pack: evd_med_finch.zip (SHA-256)</div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] flex justify-between">
        <span>Sovereign S3 PHI Isolation</span>
        <span className="text-emerald-400 font-bold">Zero Data Leakage</span>
      </div>
    </div>
  );
}

export default function HealthcareSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Industry Solution"
      badge="Healthcare & Clinical Operations"
      title="Clinician Credentialing & Clinical Trial Operations"
      subtitle="Verify state medical licenses, gather multi-party patient consents, and maintain tamper-proof clinical trial binders with zero data leakage and strict data segregation boundaries."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Healthcare Operations" },
      ]}
      heroVisual={<HealthcareHeroVisual />}
      stats={[
        { value: "Strict RLS", label: "Data Segregation", detail: "Row-level tenant segregation" },
        { value: "0", label: "Expired Licenses", detail: "Automated license date checks" },
        { value: "Presigned", label: "Direct S3 Storage", detail: "PHI never cached in cleartext" },
        { value: "Audit-Ready", label: "Trial Binders", detail: "Immutable document lockers" },
      ]}
      features={[
        {
          icon: Stethoscope,
          title: "Clinician Credential Verification",
          description: "Collect state licenses, DEA certificates, and malpractice insurance with automated expiration date monitoring.",
          badge: "CREDENTIALING",
        },
        {
          icon: FileCheck2,
          title: "Consent & Patient Information",
          description: "Streamlined magic-link consent requests that patients can complete on mobile without downloading special apps.",
          badge: "CONSENT",
        },
        {
          icon: FolderLock,
          title: "Trial & Compliance Binders",
          description: "Archive regulatory packets with cryptographic timestamps, proving clinical protocols were adhered to without alteration.",
        },
        {
          icon: Lock,
          title: "Privacy-Preserving AI Reading",
          description: "Extract structured data from clinical forms with air-gapped AI models that never retain or train on patient records.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Healthcare Lifecycle Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Healthcare Operations Architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Deterministic Credentialing from Intake to Hospital Privileges
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Clinical operations cannot rely on paper credentialing binders or unsecured email exchanges containing sensitive personal identifiers. Avenra enforces end-to-end cryptographic integrity:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Clinician Intake</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Physicians receive tokenized Magic Links on mobile to photograph and submit medical degrees, board certs, and state licenses.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Automated OCR</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Air-gapped AI extracts license numbers, issue dates, and primary practice locations in ephemeral memory with zero data retention.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">License Date Checks</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Deterministic rules check that credentials have not expired and set automated renewal reminders 60 days prior to lapse.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 04</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Credential Committee</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Chief Medical Officer reviews verified dossier and signs off. A tamper-proof Evidence Pack archives to sovereign hospital S3 storage.
              </p>
            </div>
          </div>
        </div>

        {/* Healthcare Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Healthcare Systems & Clinical Networks"
            clientType="Multi-Hospital Health Network (1,800 Clinicians)"
            badge="90% REDUCTION IN CREDENTIALING DELAYS"
            title="Accelerating Physician Hospital Credentialing from 90 Days to 14 Days"
            challenge="Onboarding new specialist physicians across 6 regional hospitals took an average of 90 days. Staff coordinators spent hours manually tracking down state medical licenses, peer recommendation letters, and malpractice certificates. Lapsed credentials cost the network an estimated $1.8M in lost surgical billing annually."
            solution="The health network deployed Avenra. New physicians uploaded documentation through secure Magic Portals. Avenra verified state license freshness, matched National Provider Identifiers (NPI), and compiled sealed credentialing packages for Medical Executive Committee review."
            outcomes={[
              { metric: "90d → 14d", label: "Credentialing Cycle", detail: "84% faster time-to-practice" },
              { metric: "0 Lapses", label: "Medical License Expirations", detail: "Automated 60-day renewal alerts" },
              { metric: "$1.8 Million", label: "Preserved Surgical Revenue", detail: "Physicians start billing 2 months sooner" },
              { metric: "100%", label: "Joint Commission Ready", detail: "Audit-proof digital credential binders" },
            ]}
            quote={{
              text: "Avenra eliminated our biggest administrative headache. Our physicians are credentialed in a fraction of the time, and our compliance binders satisfy Joint Commission auditors on demand.",
              author: "Dr. Evelyn Reed, MD",
              role: "Chief Medical Officer",
              firm: "Cascade Regional Health System",
            }}
            beforeAfter={[
              {
                before: "Credentialing coordinators mailed physical paper packets or emailed unencrypted PDF applications.",
                after: "Physicians complete tokenized, mobile-friendly Magic Portals in under 15 minutes.",
              },
              {
                before: "Expired medical licenses were discovered weeks after deadlines during routine quarterly audits.",
                after: "Avenra verification rules automatically check license expiration dates and dispatch alerts 60 days ahead.",
              },
              {
                before: "Hospital privilege committees reviewed paper folders with missing peer review sign-offs.",
                after: "Committees review digital dossiers with 100% verified checklists and tamper-proof SHA-256 seals.",
              },
            ]}
          />
        </div>

        {/* Healthcare FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Healthcare Operations & Technical Safeguards FAQ"
            subtitle="Explore how Avenra protects sensitive health data while accelerating clinical operations."
            items={HEALTHCARE_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
