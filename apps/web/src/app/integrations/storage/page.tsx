/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Cloud,
  Database,
  HardDrive,
  Server,
  ArrowRight,
  ShieldCheck,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function StorageHeroVisual() {
  const [provider, setProvider] = useState<"aws" | "r2" | "minio" | "wasabi">("aws");

  const configs = {
    aws: {
      name: "Amazon Web Services (AWS S3)",
      endpoint: "https://s3.us-east-1.amazonaws.com",
      kms: "aws:kms (arn:aws:kms:us-east-1:...)",
      features: "Object Lock Compliance Mode • Glacier Instant Retrieval",
      code: `PUT /mat-2026/evidence.zip HTTP/1.1\nHost: myfirm-vault.s3.us-east-1.amazonaws.com\nx-amz-server-side-encryption: aws:kms\nx-amz-object-lock-mode: COMPLIANCE\nx-amz-object-lock-retain-until-date: 2033-11-09T00:00:00Z`,
    },
    r2: {
      name: "Cloudflare R2 Object Storage",
      endpoint: "https://<accountid>.r2.cloudflarestorage.com",
      kms: "AES-256 (Server-Side Encryption)",
      features: "Zero Egress Fees • Global Low-Latency Anycast Edge",
      code: `PUT /mat-2026/evidence.zip HTTP/1.1\nHost: <accountid>.r2.cloudflarestorage.com\nx-amz-server-side-encryption: AES256\n# 0 Egress Bandwidth Fees on Auditor Downloads`,
    },
    minio: {
      name: "Self-Hosted / On-Premise MinIO",
      endpoint: "https://minio.internal.yourfirm.com",
      kms: "HashiCorp Vault / KES Integrated",
      features: "100% Air-Gapped Sovereign Infrastructure",
      code: `PUT /mat-2026/evidence.zip HTTP/1.1\nHost: minio.internal.yourfirm.com\n# Local Bare-Metal Storage Vault (NVMe RAID-10)`,
    },
    wasabi: {
      name: "Wasabi Hot Cloud Storage",
      endpoint: "https://s3.wasabisys.com",
      kms: "S3 Export with Manifest",
      features: "11 Nines Durability • Zero API Egress Charges",
      code: `PUT /mat-2026/evidence.zip HTTP/1.1\nHost: s3.wasabisys.com\n# High-Density Secondary Evidence Archive`,
    },
  };

  const curr = configs[provider];

  return (
    <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            S3 PROTOCOL HANDSHAKE
          </span>
        </div>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400 border border-amber-500/20">
          ADR-019 S3 PROTOCOL
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {(["aws", "r2", "minio", "wasabi"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`rounded-lg py-2 font-mono text-xs uppercase tracking-wider transition-colors border ${
              provider === p
                ? "bg-amber-500 text-white border-amber-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-bold text-text-primary">Provider:</span>
          <span className="font-mono text-amber-400 font-bold">{curr.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Key Feature:</span>
          <span className="font-mono text-text-primary">{curr.features}</span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-28 w-full overflow-hidden bg-black/40">
          <img src="/images/integrations/storage.jpg"
            alt="Presigned S3 Storage Cloud Upload"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Direct Storage Engine: {curr.name}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Zero Intermediary Server Storage
        </span>
        <span className="font-mono">Direct S3 Stream</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Presigned URLs",
    question: "How do client uploads reach S3 without overloading our web application servers?",
    answer: "Avenra generates temporary, presigned S3 PUT URLs with 15-minute expiration windows. The client browser uploads bytes directly to your bucket over encrypted HTTPS. Avenra servers never buffer the raw upload payload, allowing your system to handle multi-gigabyte client files with zero RAM bloat.",
  },
  {
    category: "IAM Permissions",
    question: "What minimum IAM policy permissions does Avenra need in our AWS account?",
    answer: "Avenra requires least-privilege IAM permissions restricted strictly to your designated bucket: `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket`. We never request bucket deletion, billing, or account administration privileges.",
  },
  {
    category: "Evidence Integrity",
    question: "How does Avenra verify evidence package integrity in S3?",
    answer: "When exporting evidence, Avenra streams the completion manifest and accepted documents, then immediately verifies the uploaded objects by reading back their checksums (ADR-034). The manifest contains SHA-256 digests for independent offline verification.",
  },
  {
    category: "CORS Setup",
    question: "How do we configure CORS for direct browser-to-S3 uploads?",
    answer: "We provide an automated Terraform / AWS CLI script that applies the required CORS rules allowing `PUT` requests originating from your firm's custom portal domain with headers `Content-Type` and `x-amz-*`.",
  },
];

export default function StorageIntegrationsPage() {
  return (
    <MarketingLayout
      category="Storage Integrations"
      badge="ADR-019 S3 Standard"
      variant="integrations"
      title="S3-Compatible Cloud Storage Integration"
      subtitle="Connect Avenra directly to your designated AWS S3, Cloudflare R2, MinIO, Wasabi, or Backblaze B2 bucket for sovereign data custody."
      breadcrumbs={[
        { label: "Integrations", href: "/integrations" },
        { label: "Cloud Storage" },
      ]}
      heroVisual={<StorageHeroVisual />}
      stats={[
        { value: "S3 API", label: "Protocol Standard", detail: "Universal object storage compatibility" },
        { value: "0 Storage", label: "On Avenra Servers", detail: "Files go straight to your bucket" },
        { value: "Presigned", label: "Direct Uploads", detail: "Secure temporary PUT/GET URLs" },
        { value: "Multi-Cloud", label: "Provider Freedom", detail: "AWS, Cloudflare, MinIO, Wasabi" },
      ]}
      features={[
        {
          icon: Cloud,
          title: "Amazon Web Services (AWS S3)",
          description: "Connect your enterprise AWS bucket with KMS server-side encryption and automated lifecycle archival policies.",
          badge: "AWS S3",
        },
        {
          icon: Database,
          title: "Cloudflare R2",
          description: "Enjoy zero egress fees and global low-latency access by pairing Avenra with Cloudflare R2 object storage.",
          badge: "R2",
        },
        {
          icon: Server,
          title: "Self-Hosted MinIO",
          description: "For strictly on-premise or sovereign deployments: connect to high-performance local MinIO clusters with full S3 compatibility.",
          badge: "MINIO",
        },
        {
          icon: HardDrive,
          title: "Backblaze B2 & Wasabi",
          description: "Cost-effective, high-reliability secondary cloud archives with automated daily evidence package synchronization.",
          badge: "WASABI / B2",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Deep Architecture Section */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              Direct-to-Object Protocol
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Zero Intermediary Storage Architecture
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Traditional SaaS vendors route file uploads through their application servers, creating massive security and scalability bottlenecks. Avenra decouples data storage from application compute.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-amber-400">Step 1: Authorization</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Token Request</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Client portal requests a short-lived presigned upload URL from Avenra backend, authenticated by session token.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-amber-400">Step 2: Transmission</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Direct Presigned PUT</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Client browser streams raw encrypted bytes directly into your AWS S3 bucket over TLS 1.3 with checksum verification.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-amber-400">Step 3: Sealing</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Manifest Verification</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                S3 bucket triggers ClamAV virus scanning worker; if clean, object is locked under SEC Rule 17a-4 compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Cloud Storage Integration FAQ"
            subtitle="Deep engineering answers on presigned uploads, IAM policies, and manifest integrity verification."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-amber-400">Next Integration Category</div>
            <div className="text-base font-bold text-text-primary">Workflow Automation: Zapier, Make & n8n</div>
          </div>
          <Link
            href="/integrations/automation"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            Explore Automation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
