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
import { EnterpriseImageCard, EnterpriseSectionImage } from "@/components/enterprise/EnterpriseImageCard";

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
    <EnterpriseImageCard
      src="/images/platform/evidence-locker.jpg"
      alt="Avenra Sealed Evidence Package"
      title="Sealed Evidence Package"
      subtitle="Cryptographically sealed deliverable package with standalone offline viewer"
      badge="SHA-256 SEALED"
      badgeVariant="cyan"
      highlights={[
        { label: "Manifest Root", value: "SHA-256 Digest" },
        { label: "Storage Custody", value: "Sovereign S3" },
        { label: "Verification", value: "100% Offline" },
      ]}
    />
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

          <div className="mt-8">
            <EnterpriseSectionImage
              src="/images/platform/evidence-s3.jpg"
              alt="Sovereign S3 Custody and Offline Verification"
              badge="Sovereign Custody"
              title="Direct S3 Storage Custody & Offline Verification"
              description="When a government regulator, financial auditor, or corporate acquirer conducts due diligence on a completed deliverable, they do not need to trust Avenra servers. They verify proof on an air-gapped machine directly from your private S3 bucket using standard cryptographic utilities."
              bullets={[
                "Institutional private AWS S3 / SeaweedFS storage guarantees complete custody",
                "Root ZIP checksum matches signed completion notice byte-for-byte",
                "Individual document SHA-256 hashes verified deterministically against manifest.json",
                "Zero vendor lock-in with standalone air-gapped HTML audit viewer included",
              ]}
            />
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
