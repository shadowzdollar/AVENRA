"use client";

import { useState } from "react";
import {
  Database,
  EyeOff,
  Lock,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Globe,
  Trash2,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function PrivacyHeroVisual() {
  const [region, setRegion] = useState<"eu" | "us" | "apac">("eu");

  const regions = {
    eu: {
      name: "Frankfurt (eu-central-1)",
      dpa: "GDPR Article 28 / German BDSG",
      residency: "100% European Sovereign Custody",
      retention: "Sealed Manifests + Erasure",
    },
    us: {
      name: "Northern Virginia (us-east-1)",
      dpa: "Standard DPA / Privacy Invariants",
      residency: "US Sovereign GovCloud Eligible",
      retention: "SEC Rule 17a-4 Compliant",
    },
    apac: {
      name: "Tokyo (ap-northeast-1)",
      dpa: "Japan APPI / Singapore PDPA",
      residency: "Asia-Pacific Regional Isolation",
      retention: "Multi-Zone Encrypted Archival",
    },
  };

  const curr = regions[region];

  return (
    <div className="w-full max-w-xl rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            SOVEREIGN DATA RESIDENCY ROUTER
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          ZERO THIRD-PARTY DATA MINING
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {(["eu", "us", "apac"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`flex-1 rounded-lg py-2 font-mono text-xs uppercase tracking-wider transition-colors border ${
              region === r
                ? "bg-emerald-500 text-white border-emerald-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {r} Zone
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-bold text-text-primary">Designated Region:</span>
          <span className="font-mono text-emerald-400 font-bold">{curr.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Statutory Governance:</span>
          <span className="font-mono text-text-primary">{curr.dpa}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Residency Bound:</span>
          <span className="font-mono text-text-primary">{curr.residency}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Archive Standard:</span>
          <span className="font-mono text-text-primary">{curr.retention}</span>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-black/70 p-3 font-mono text-[11px] text-emerald-300 border border-white/5 space-y-1">
        <div className="text-text-tertiary text-[10px]"># Contractual Privacy Guarantees</div>
        <div>Customer Data Used For AI Training: <strong className="text-red-400">NEVER (0%)</strong></div>
        <div>Customer Document Persistence on Avenra: <strong className="text-red-400">0 BYTES</strong></div>
        <div>Cloud S3 Bucket Ownership: <strong className="text-emerald-400">CUSTOMER-OWNED</strong></div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> GDPR Article 28 DPA Included
        </span>
        <span className="font-mono">100% Data Sovereignty</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Data Ownership",
    question: "Who legally owns the documents and deliverables processed through Avenra?",
    answer: "You and your clients retain 100% exclusive intellectual property and legal ownership of all files, inputs, extractions, and evidence deliverables. Avenra functions solely as a Data Processor under GDPR Article 28 and a Service Provider under CCPA, with no rights to copy, sell, or commercialize your information.",
  },
  {
    category: "Right to Erasure",
    question: "How do you reconcile GDPR Right to Erasure with statutory audit retention requirements?",
    answer: "Under GDPR Article 17(3)(b), the right to erasure does not apply when data retention is required by law (such as tax compliance, AML/KYC regulations, or SEC Rule 17a-4). For non-statutory records, Avenra provides programmatic erasure endpoints that purge records and cryptographic keys, rendering encrypted artifacts mathematically unrecoverable.",
  },
  {
    category: "Subprocessors",
    question: "What third-party subprocessors does Avenra use?",
    answer: "Avenra maintains a minimal, transparent subprocessor footprint consisting exclusively of enterprise infrastructure providers (AWS, Cloudflare). We do not send your data to untrusted third-party advertising or analytics networks.",
  },
  {
    category: "Employee Access",
    question: "Can Avenra engineering personnel view our confidential client documents?",
    answer: "No. Because files are encrypted using your private KMS keys and streamed directly into your S3 bucket, Avenra engineers possess neither the keys nor the network route to decrypt client files in production.",
  },
];

export default function PrivacySecurityPage() {
  return (
    <MarketingLayout
      category="Security & Governance"
      badge="Data Sovereignty"
      variant="security"
      title="Sovereign Data Custody & Privacy Architecture"
      subtitle="Your client documents, sensitive financial data, and contracts remain in your own private cloud storage. We never sell, mine, or train models on your data."
      breadcrumbs={[
        { label: "Security & Trust", href: "/security" },
        { label: "Privacy & Custody" },
      ]}
      heroVisual={<PrivacyHeroVisual />}
      stats={[
        { value: "100%", label: "Your Storage", detail: "Direct upload to your S3 bucket" },
        { value: "0", label: "Model Training", detail: "Explicit contractual model boundaries" },
        { value: "Ephemeral", label: "Processing Buffers", detail: "Memory cleared after extraction" },
        { value: "GDPR & CCPA", label: "Privacy Rights", detail: "Native data deletion & export" },
      ]}
      features={[
        {
          icon: Database,
          title: "Customer-Managed S3 Buckets",
          description: "All client attachments stream directly into an S3 bucket owned and controlled by your organization.",
          badge: "SOVEREIGNTY",
        },
        {
          icon: EyeOff,
          title: "Zero Model Fine-Tuning",
          description: "Avenra models are strictly zero-retention. Client files are analyzed in volatile memory and never used to train neural weights.",
          badge: "ZERO RETENTION",
        },
        {
          icon: Lock,
          title: "Strict No-Logging Policy for Secrets",
          description: "Building Guidelines §143 strictly enforces that sensitive fields, passwords, and document bodies are never dumped to application logs.",
          badge: "NO LOGGING",
        },
        {
          icon: UserCheck,
          title: "Complete Right-to-Erasure",
          description: "Purge client records and associated evidence packages in compliance with European GDPR and California CCPA guidelines.",
          badge: "ERASURE",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Core Sovereignty Framework */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Legal & Technical Architecture
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Architectural Guarantees, Not Just Legal Promises
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Many SaaS companies promise data privacy in their terms of service while storing everything in a giant shared cloud database. Avenra enforces privacy through physical infrastructure isolation.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Direct Bucket Ingestion</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Client uploads go straight from browser to your private AWS S3 bucket. Document bytes never touch Avenra disks.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">In-Memory Volatility</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Text parsing occurs in ephemeral memory buffers that are overwritten with zeros immediately upon completion.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Regional Data Pins</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Pin your workspace to EU, US, or APAC data centers. Data never crosses international borders without explicit policy approval.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Privacy & Data Sovereignty FAQ"
            subtitle="Deep engineering answers on GDPR compliance, subprocessor governance, and customer storage custody."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-emerald-400">Next Security Subsystem</div>
            <div className="text-base font-bold text-text-primary">Continuous Regulatory Compliance & Certifications</div>
          </div>
          <Link
            href="/security/compliance"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Explore Compliance <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
