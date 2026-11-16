/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Inbox,
  Mail,
  Server,
  ShieldCheck,
  ArrowRight,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function CommunicationsHeroVisual() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 0,
      title: "1. SPF / DKIM / DMARC Check",
      status: "PASS",
      detail: "Cryptographic signature matches google._domainkey.acmecorp.com. Sender identity verified.",
    },
    {
      id: 1,
      title: "2. Thread Token Resolution",
      status: "MATCHED",
      detail: "In-Reply-To matched work item `wrk_01HZX8934A` (Matter 2026-B: Cross-Border Tax Filing).",
    },
    {
      id: 2,
      title: "3. ClamAV Stream Inspection",
      status: "CLEAN",
      detail: "Attached `Schedule_K1_Final.pdf` (1.4MB) scanned against virus definitions. 0 infections.",
    },
    {
      id: 3,
      title: "4. State Advance & Alert",
      status: "COMPLETED",
      detail: "Work item transitioned to VERIFYING. Escalation reminder cron automatically canceled.",
    },
  ];

  return (
    <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            INBOUND EMAIL INGESTION ENGINE
          </span>
        </div>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400 border border-amber-500/20">
          ADR-015 MIME PARSER
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((s) => (
          <div
            key={s.id}
            onClick={() => setActiveStep(s.id)}
            className={`rounded-xl border p-3 cursor-pointer transition-colors ${
              activeStep === s.id
                ? "border-amber-500 bg-amber-500/15"
                : "border-border/60 bg-canvas hover:border-border hover:bg-canvas-subtle"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">{s.title}</span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                {s.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-28 w-full overflow-hidden bg-black/40">
          <img src="/images/platform/reminders.jpg"
            alt="Automated Reminder Dispatch Telemetry"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            RESPONSE RECEIVED
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Escalation Timer T+48h Terminated · State Advanced in 12ms
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> SPF/DKIM Authentication Strict Pass
        </span>
        <span className="font-mono">Zero Spam Leakage</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Email Ingestion",
    question: "Can clients simply reply to notification emails with attachments?",
    answer: "Yes. Every client notification email includes a cryptographically unique reply-to address (e.g. `reply+sec_tok_9918@intake.yourfirm.com`). When the client attaches their requested PDF or spreadsheet and clicks reply, Avenra parses the inbound MIME message, screens attachments with ClamAV, and attaches the files to the deliverable without requiring the client to open a portal.",
  },
  {
    category: "Custom Domains",
    question: "Do outbound emails come from an Avenra address or our firm's custom domain?",
    answer: "Outbound emails dispatch exclusively from your firm's verified domain (e.g. `notifications@yourfirm.com`). You can connect your Amazon SES, SendGrid, Postmark, or Google Workspace SMTP credentials with your own DKIM and SPF records for 100% brand white-labeling.",
  },
  {
    category: "Deliverability",
    question: "How do you ensure reminders do not end up in corporate spam filters?",
    answer: "Avenra enforces strict email hygiene: custom DKIM keys with 2048-bit RSA signatures, DMARC alignment, clean plain-text fallback MIME parts, and zero tracking pixels or third-party marketing redirects that trigger corporate spam filters.",
  },
  {
    category: "Attachment Limits",
    question: "What is the maximum attachment size supported via email ingestion?",
    answer: "Inbound email attachments up to 25 MB are accepted via standard SMTP. For larger files (up to 5 GB), the client is automatically directed to the high-speed presigned S3 upload portal link included in the email.",
  },
];

export default function CommunicationsIntegrationsPage() {
  return (
    <MarketingLayout
      category="Communications Integrations"
      badge="ADR-015 Inbound Mail"
      variant="integrations"
      title="Gmail, SMTP & Secure Email Ingestion"
      subtitle="Turn client emails into structured work items. Send tokenized magic request links and intelligent reminders directly from your firm's domain."
      breadcrumbs={[
        { label: "Integrations", href: "/integrations" },
        { label: "Communications" },
      ]}
      heroVisual={<CommunicationsHeroVisual />}
      stats={[
        { value: "SPF/DKIM", label: "Email Authentication", detail: "Full DMARC verification" },
        { value: "0 Setup", label: "Client Requirements", detail: "Clients reply directly from their mail app" },
        { value: "ClamAV", label: "Attachment Scanning", detail: "Every inbound attachment scanned" },
        { value: "Local Mail", label: "Dev Isolation", detail: "Mailpit captures all local test emails" },
      ]}
      features={[
        {
          icon: Mail,
          title: "Gmail Workspace Ingestion",
          description: "Connect your firm's Google Workspace inbox to automatically capture client requests and parse incoming attachments.",
          badge: "GMAIL",
        },
        {
          icon: Server,
          title: "Custom Domain SMTP / SendGrid",
          description: "Dispatch client request links and follow-up reminders using your firm's verified domain and brand identity.",
          badge: "BRANDED",
        },
        {
          icon: ShieldCheck,
          title: "Inbound DMARC & Virus Scanning",
          description: "Incoming emails are validated against SPF, DKIM, and DMARC records to protect against spoofing, with ClamAV attachment scanning.",
          badge: "CLAMAV SCAN",
        },
        {
          icon: Inbox,
          title: "Thread-Aware Conversation Matching",
          description: "Client email replies automatically associate with the corresponding work deliverable, preserving context in the timeline.",
          badge: "THREADED",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Deep Dive Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              Mail Protocol Architecture
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Turn Unstructured Inboxes into Deterministic Systems
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Email remains the primary communication channel in enterprise professional services. Avenra wraps email in strict cryptographic validation and automated state machines.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-amber-400">Channel 1</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Inbound Intake Addresses</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Publish addresses like `filings@yourfirm.com`. Incoming emails initialize new DRAFT deliverables with extracted client entities.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-amber-400">Channel 2</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Threaded Magic Replies</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                When reminders ping a client, their direct reply attaches documents directly to the matter without operator intervention.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-amber-400">Channel 3</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Internal Team Alerts</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Dispatch instant in-app and email notifications to practitioner inboxes when rule exceptions require human review.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Communications Hub FAQ"
            subtitle="Deep engineering answers on email deliverability, custom SMTP gateways, and attachment security."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-amber-400">Next Integration Category</div>
            <div className="text-base font-bold text-text-primary">OpenAPI v1 Developer REST API & SDKs</div>
          </div>
          <Link
            href="/integrations/api"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            Explore Developer API <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
