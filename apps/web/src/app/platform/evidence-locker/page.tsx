"use client";

import {
  FileCheck2,
  FolderLock,
  HardDrive,
  Key,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveEvidenceInspector } from "@/components/enterprise/InteractiveEvidenceInspector";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const EVIDENCE_FAQS = [
  {
    category: "Audit Provenance",
    question: "Can an auditor inspect an Evidence Pack without having an Avenra login or internet access?",
    answer: "Yes. Every Evidence Pack is compiled into an open, self-contained ZIP archive. Inside, `audit-summary.html` opens directly in any web browser without internet access, stylesheets, or external API dependencies. Auditors can run standard command-line tools like `sha256sum` to independently verify that every single document matches the cryptographic signatures recorded at the moment of completion.",
    technicalDetails: "Zero vendor dependency. Follows open archival formats (HTML5, JSON, raw binary attachments) that remain readable 20+ years into the future.",
  },
  {
    category: "Cloud Custody",
    question: "How does Avenra stream files directly to our firm's private S3 bucket?",
    answer: "Avenra supports S3-compatible cloud storage including AWS S3, Cloudflare R2, MinIO, and Backblaze B2 (ADR-007). File uploads are streamed via presigned PUT URLs directly from the client browser to your designated bucket, or proxied in-memory through the API for inline ClamAV malware scanning. Avenra never stores client file binaries in an opaque multi-tenant database.",
    technicalDetails: "S3 export delivers completion manifests and accepted documents to your designated bucket with SHA-256 integrity verification (ADR-034).",
  },
  {
    category: "Tamper Evidence",
    question: "What happens if someone manually modifies an uploaded file in our S3 bucket?",
    answer: "Tampering is immediately exposed. The Evidence Pack manifest (`manifest.json`) records the exact SHA-256 hash of each original attachment alongside a root package signature. If a single byte in any PDF, image, or spreadsheet is altered, computing its SHA-256 hash yields a completely different digest, proving that the file was altered post-completion.",
    technicalDetails: "SHA-256 collision resistance mathematically guarantees that accidental or intentional alterations are detected instantly.",
  },
];

export function EvidenceLockerHeroVisual() {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Sealed Evidence Package</span>
        <span className="text-cyan-400 font-bold">SHA-256 SEALED</span>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="text-cyan-400">├── manifest.json (SHA-256 Root)</div>
        <div className="text-[#7ee787]">├── audit-summary.html (Zero Network)</div>
        <div className="text-[#7ee787]">├── checks-log.json (Verification Trace)</div>
        <div className="text-[#7ee787]">└── documents/</div>
        <div className="text-[#79c0ff] pl-4">├── signed_engagement_letter.pdf</div>
        <div className="text-[#79c0ff] pl-4">├── corporate_resolution.pdf</div>
        <div className="text-[#79c0ff] pl-4">└── shareholders_cap_table.xlsx</div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] flex justify-between">
        <span>Sovereign AWS S3 Custody</span>
        <span className="text-cyan-400 font-bold">100% Offline Verifiable</span>
      </div>
    </div>
  );
}

export default function EvidenceLockerPage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Audit Provenance"
      title="The Cryptographic Evidence Locker"
      subtitle="Complete, self-contained audit packages with SHA-256 cryptographic hashes. Stored directly inside your firm's own S3 storage bucket for permanent sovereign custody."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Evidence Locker" },
      ]}
      heroVisual={<EvidenceLockerHeroVisual />}
      stats={[
        { value: "SHA-256", label: "Cryptographic Hash", detail: "Tamper-evident checksum per item" },
        { value: "100%", label: "Your Storage", detail: "AWS S3, R2, MinIO, or Wasabi" },
        { value: "Self-Contained", label: "Evidence Pack", detail: "HTML, JSON, and source attachments" },
        { value: "Zero", label: "Vendor Lock-in", detail: "Downloadable ZIP packages" },
      ]}
      features={[
        {
          icon: FolderLock,
          title: "Cryptographically Sealed Packs",
          description: "Every completed work deliverable compiles all client inputs, verified documents, checks, and audit timestamps into a sealed evidence pack.",
          badge: "SEALED",
        },
        {
          icon: HardDrive,
          title: "Direct S3 Cloud Custody",
          description: "Evidence never sits in an opaque third-party database. Files upload directly to your S3-compatible cloud storage bucket.",
          badge: "SOVEREIGN",
        },
        {
          icon: FileCheck2,
          title: "Auditor-Ready Inspection",
          description: "Auditors can inspect evidence offline without needing an Avenra login. Verification hashes prove documents have not been modified.",
        },
        {
          icon: Key,
          title: "Presigned Access URLs",
          description: "Client files are retrieved via short-lived, presigned S3 URLs that expire in minutes, preventing link leakage.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive Evidence Package Inspector */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Live Package Inspector
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Inspect an Avenra Sealed Evidence Package
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Click through the package manifest, audit summary HTML, and checks trace to verify cryptographic hashes and chain of custody.
            </p>
          </div>
          <InteractiveEvidenceInspector />
        </div>

        {/* Offline Auditor Verification Guide */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Auditor Verification Protocol
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              How Regulators & External Auditors Verify Proof Offline
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              When a government regulator, financial auditor, or corporate acquirer conducts due diligence on a completed deliverable, they do not need to trust Avenra servers. They can verify proof on an air-gapped machine using standard shell utilities:
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#0d1117] p-6 text-[#c9d1d9] font-mono text-xs overflow-x-auto">
            <span className="text-[#8b949e]">{"// 1. Download Evidence Pack directly from your private AWS S3 bucket"}</span>
            <div className="text-cyan-400 mt-1">aws s3 cp s3://firm-vault/evidence/wrk_01HZX892KLA.zip ./</div>

            <span className="text-[#8b949e] block mt-4">{"// 2. Verify package root checksum against the original signed completion notice"}</span>
            <div className="text-cyan-400 mt-1">sha256sum wrk_01HZX892KLA.zip</div>
            <div className="text-[#7ee787]">8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a34b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e  wrk_01HZX892KLA.zip</div>

            <span className="text-[#8b949e] block mt-4">{"// 3. Unpack and verify all embedded document hashes against manifest.json"}</span>
            <div className="text-cyan-400 mt-1">unzip wrk_01HZX892KLA.zip && cd wrk_01HZX892KLA/</div>
            <div className="text-cyan-400">sha256sum -c manifest.json</div>
            <div className="text-[#7ee787]">documents/engagement_letter.pdf: OK</div>
            <div className="text-[#7ee787]">documents/shareholders_cap_table.xlsx: OK</div>
            <div className="text-[#7ee787]">checks-log.json: OK</div>
            <div className="text-[#7ee787]">audit-summary.html: OK</div>
          </div>
        </div>

        {/* Evidence Locker FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Evidence Locker & Cloud Storage FAQ"
            subtitle="Everything regarding S3 custody, KMS envelope encryption, long-term retention, and offline compliance."
            items={EVIDENCE_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
