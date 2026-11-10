/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Clock,
  Key,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileText,
  UploadCloud,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function InformationGatheringHeroVisual() {
  const [items, setItems] = useState([
    { id: 1, label: "2025 Form 1065 K-1 Schedules", status: "UPLOADED", size: "2.4 MB", virus: "CLEAN" },
    { id: 2, label: "Articles of Incorporation (Delaware)", status: "UPLOADED", size: "840 KB", virus: "CLEAN" },
    { id: 3, label: "Certificate of Good Standing", status: "PENDING", size: "—", virus: "—" },
  ]);

  const toggleUpload = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? item.status === "PENDING"
            ? { ...item, status: "UPLOADED", size: "1.1 MB", virus: "CLEAN" }
            : { ...item, status: "PENDING", size: "—", virus: "—" }
          : item
      )
    );
  };

  const uploadedCount = items.filter((i) => i.status === "UPLOADED").length;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            TOKENIZED CLIENT PORTAL SIMULATOR
          </span>
        </div>
        <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-400 border border-indigo-500/20">
          ZERO-LOGIN ACCESS
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-text-primary">Acme Private Equity Holdings</div>
            <div className="font-mono text-[10px] text-text-tertiary">Token: sec_mag_99f2b8 (TTL 7d)</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-indigo-400 font-mono">
              {uploadedCount} / {items.length} COMPLETED
            </span>
            <div className="mt-1 h-1.5 w-24 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full bg-indigo-500 transition-all duration-300 ${
                  uploadedCount === 0
                    ? "w-0"
                    : uploadedCount === 1
                      ? "w-1/3"
                      : uploadedCount === 2
                        ? "w-2/3"
                        : "w-full"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleUpload(item.id)}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-canvas-subtle p-3 cursor-pointer hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-text-tertiary" />
                <div>
                  <div className="text-xs font-semibold text-text-primary">{item.label}</div>
                  <div className="font-mono text-[10px] text-text-tertiary">
                    {item.size} • ClamAV: <span className="text-emerald-400">{item.virus}</span>
                  </div>
                </div>
              </div>

              {item.status === "UPLOADED" ? (
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <UploadCloud className="h-3 w-3" /> CLICK TO UPLOAD
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-28 w-full overflow-hidden bg-black/40">
          <img src="/images/platform/reminders.jpg"
            alt="Automated Reminder Cadence Daemon"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            AUTO-PAUSE ACTIVE
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Smart Cadence: T+48h, T+96h · Suppressed on Client Activity
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Presigned S3 Direct Upload
        </span>
        <span className="font-mono">ADR-004 Compliant</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Security",
    question: "Are magic links secure enough for sensitive corporate tax documents and legal contracts?",
    answer: "Yes. Avenra magic link tokens are generated using 256 bits of cryptographic entropy (CSPRNG). In the database, only the salted SHA-256 hash of the token is persisted; the plaintext token is never stored. Furthermore, magic links are strictly single-purpose: a client token grants access solely to upload the requested documents for that specific work item and cannot query other clients or matters.",
  },
  {
    category: "Client Friction",
    question: "Why not require clients to register with a username and password?",
    answer: "Industry telemetry shows that over 42% of client turnaround delays are caused by password reset requests, lost credentials, and corporate SSO friction. Magic links eliminate 100% of login friction while maintaining higher security than weak, reused user passwords.",
  },
  {
    category: "Antivirus",
    question: "What happens if a client accidentally uploads an infected macro-enabled spreadsheet?",
    answer: "Files upload directly to a quarantine S3 bucket via presigned URL. Before the work engine recognizes the file as present, an asynchronous worker executes ClamAV virus scanning. If malware is detected, the file is immediately expunged, the client portal displays a friendly warning, and the firm operator receives an instant security notification.",
  },
  {
    category: "Reminders",
    question: "How does Avenra prevent clients from getting spammed with reminders after they've answered?",
    answer: "The reminder engine evaluates real-time state machine guards before dispatching any email. As soon as the client uploads the final required document and the state advances to VERIFYING, all pending escalation timers are atomically cleared from the Redis queue.",
  },
];

export default function InformationGatheringPage() {
  return (
    <MarketingLayout
      category="Lifecycle Stage 2"
      badge="Automated Collection Engine"
      variant="how-it-works"
      title="Dynamic Information Gathering & Request Links"
      subtitle="Ask external clients only for what is missing. Generate tokenized magic links with automated validation, file scanning, and smart reminder schedules."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "Stage 2: Information Gathering" },
      ]}
      heroVisual={<InformationGatheringHeroVisual />}
      stats={[
        { value: "0 Logins", label: "Client Friction", detail: "Single-use magic access tokens" },
        { value: "Dynamic", label: "Form Schema", detail: "Asks only for missing documents" },
        { value: "Inline", label: "Antivirus Scanning", detail: "ClamAV stream protection" },
        { value: "Adaptive", label: "Follow-up Cadence", detail: "Halts immediately on answer" },
      ]}
      features={[
        {
          icon: Key,
          title: "Tokenized Magic Request Links",
          description: "High-entropy, temporary access URLs allow clients to submit files and answers without creating passwords.",
          badge: "MAGIC LINK",
        },
        {
          icon: ShieldCheck,
          title: "Stream Malware Protection",
          description: "All uploaded documents stream through ClamAV before permanent write to cloud storage.",
          badge: "MALWARE FREE",
        },
        {
          icon: Clock,
          title: "Automated Escalation Cadence",
          description: "Reminders dispatch automatically on schedule, preventing client delays from blocking team throughput.",
          badge: "CADENCE",
        },
        {
          icon: Lock,
          title: "Single-Purpose Scoping",
          description: "A request link exposes only the specific questions and file dropzones requested by the operator.",
          badge: "SCOPED",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Magic Link Lifecycle Breakdown */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Security & Experience
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Zero-Friction Client Experience with Zero Compromise on Security
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Client delays are the number one operational bottleneck in professional services. Avenra replaces static portals with instant, branded magic dropzones.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Cryptographic Tokenization</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Tokens use CSPRNG 256-bit entropy with 7-day TTL. Only the salted SHA-256 hash is stored in the database, preventing token leakage from database dumps.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <UploadCloud className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Direct Presigned S3 Upload</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Files upload directly from the client browser to your private S3 bucket via presigned PUT URLs with exact content-length and content-type enforcement.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Adaptive Escalation Cadence</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Automated reminders ping the client at T+48h and T+96h with personalized email copy. Timers immediately self-terminate upon full document receipt.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Information Gathering & Magic Links FAQ"
            subtitle="Deep engineering answers on token security, file upload streaming, and reminder automation."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Stage 3: Deterministic & AI Verification Pipeline</div>
          </div>
          <Link
            href="/how-it-works/verification"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Verification Pipeline <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
