"use client";

import { useState } from "react";
import {
  Database,
  Download,
  FileCheck2,
  FolderLock,
  ArrowRight,
  ShieldCheck,
  FileCode,
  HardDrive,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveEvidenceInspector } from "@/components/enterprise/InteractiveEvidenceInspector";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function EvidenceDeliveryHeroVisual() {
  const [copied, setCopied] = useState(false);

  const hash = "9f83ab204e12c5b36719e782d8c3f912b74051a83e02871f92e1049281a74e92";

  const copyHash = () => {
    void navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <FolderLock className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            SEALED EVIDENCE ARCHIVE
          </span>
        </div>
        <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-400 border border-indigo-500/20">
          SHA-256 MANIFEST SEALED
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border/70 bg-black/70 p-4 font-mono text-xs">
        <div className="flex items-center justify-between text-text-tertiary text-[11px]">
          <span>Root Package Checksum (SHA-256)</span>
          <button
            onClick={copyHash}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-1.5 break-all text-emerald-400 font-bold text-[11px]">
          {hash}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-canvas p-2.5">
          <span className="flex items-center gap-2 text-text-primary">
            <FileCode className="h-3.5 w-3.5 text-indigo-400" /> manifest.json
          </span>
          <span className="text-text-tertiary">Cryptographic signature & timestamps</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-canvas p-2.5">
          <span className="flex items-center gap-2 text-text-primary">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> clamav_scan.log
          </span>
          <span className="text-emerald-400">0 infections confirmed</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-canvas p-2.5">
          <span className="flex items-center gap-2 text-text-primary">
            <HardDrive className="h-3.5 w-3.5 text-indigo-400" /> audit_summary.html
          </span>
          <span className="text-text-tertiary">Zero-dependency offline browser report</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-indigo-400" /> S3 Object Lock (SEC 17a-4)
        </span>
        <span className="font-mono">ADR-007 Certified</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Evidence Archival",
    question: "How does Avenra fulfill permanent evidence preservation and export requirements?",
    answer: "Avenra compiles evidence archives into immutable completion manifests with SHA-256 cryptographic digests and exports them to your enterprise S3 bucket (ADR-028, ADR-034). Once committed, manifests contain the exact hashes of all accepted documents and verification traces for permanent offline custody.",
  },
  {
    category: "Sovereignty",
    question: "Do our client files remain stored in our own cloud infrastructure?",
    answer: "Yes. Avenra adheres strictly to sovereign data custody. You configure your own AWS S3, Cloudflare R2, MinIO, or Google Cloud Storage credentials. Avenra streams artifacts directly into your bucket using your KMS encryption keys; we never hold secondary unencrypted copies of your deliverables.",
  },
  {
    category: "Auditor Verification",
    question: "Can an external regulator inspect an archive if Avenra servers are completely offline?",
    answer: "Yes. Every evidence package includes a self-contained `audit-summary.html` and a machine-readable `manifest.json`. Regulators can verify package integrity locally in any terminal using standard Unix tools (`sha256sum -c manifest.json`) with zero internet connectivity or proprietary software.",
  },
  {
    category: "Tamper Proofing",
    question: "What happens if a malicious actor modifies a single byte inside an archived file?",
    answer: "Any modification immediately invalidates the package's SHA-256 root checksum and fails the cryptographic HMAC signature verification. The offline validator alerts the auditor with the exact file that suffered corruption or alteration.",
  },
];

export default function EvidenceDeliveryPage() {
  return (
    <MarketingLayout
      category="Lifecycle Stage 4"
      badge="Cryptographic Sealing"
      variant="how-it-works"
      title="Sealed Evidence Delivery & Cloud Storage Archival"
      subtitle="How Avenra seals completed work deliverables into tamper-evident packages with SHA-256 signatures, delivering sovereign proof directly to your S3 bucket."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "Stage 4: Evidence Delivery" },
      ]}
      heroVisual={<EvidenceDeliveryHeroVisual />}
      stats={[
        { value: "SHA-256", label: "Checksum Validation", detail: "Tamper-proof package seal" },
        { value: "Direct S3", label: "Cloud Archival", detail: "Writes to your bucket storage" },
        { value: "Offline", label: "Verification Ready", detail: "Self-contained HTML & JSON report" },
        { value: "Permanent", label: "Audit Retention", detail: "Preserved for regulatory audits" },
      ]}
      features={[
        {
          icon: FolderLock,
          title: "Sealed Package Generation",
          description: "Compiles all client uploads, OCR extractions, check logs, and operator approvals into an immutable archive.",
          badge: "SEALED",
        },
        {
          icon: Database,
          title: "Direct S3 Cloud Ingestion",
          description: "Archive packages directly into AWS S3, Cloudflare R2, MinIO, or Backblaze B2 under strict tenant key prefixes.",
          badge: "CUSTODY",
        },
        {
          icon: Download,
          title: "Auditor Offline Verification",
          description: "Auditors can unzip the bundle and open `audit-summary.html` in any browser to verify proof with zero internet connectivity.",
          badge: "OFFLINE",
        },
        {
          icon: FileCheck2,
          title: "Signed Delivery Notifications",
          description: "Webhooks dispatch completion payloads to your downstream billing and CRM tools with cryptographic HMAC signatures.",
          badge: "NOTIFY",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive Evidence Locker Inspector */}
        <div>
          <InteractiveEvidenceInspector />
        </div>

        {/* Offline Auditor Terminal Walkthrough */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Zero-Trust Verification
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Auditor Offline Verification Walkthrough
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Auditors do not need an Avenra account or internet access to verify a deliverable. Every package is completely self-proving using standard POSIX utilities.
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-black/70 p-6 font-mono text-xs text-indigo-300 border border-white/5 overflow-x-auto">
            <pre>{`# Step 1: Download package from your enterprise S3 bucket
aws s3 cp s3://myfirm-evidence-vault/matter-2026-091a/evidence_package.zip .

# Step 2: Unzip package contents
unzip evidence_package.zip -d evidence/
cd evidence/

# Step 3: Run standard SHA-256 integrity verification
sha256sum -c manifest.json

# Terminal Output:
# original_client_upload.pdf: OK
# clamav_scan_receipt.json:   OK
# pydantic_schema_output.json: OK
# operator_signoff.sig:       OK
# audit_summary.html:         OK
# All 5 files match cryptographic checksums! Zero tampering detected.`}</pre>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Evidence Delivery & Archival FAQ"
            subtitle="Deep engineering answers on evidence sealing, sovereign data custody, and offline verification."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Human-in-the-Loop Governance & Exceptions</div>
          </div>
          <Link
            href="/how-it-works/human-in-the-loop"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Human-in-the-Loop <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
