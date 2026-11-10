"use client";

import { useState } from "react";
import {
  Inbox,
  Mail,
  Workflow,
  Zap,
  CheckCircle2,
  ArrowRight,
  Code2,
  RefreshCw,
  FileText,
  Key,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function IntentCaptureHeroVisual() {
  const [source, setSource] = useState<"email" | "webhook" | "form">("webhook");

  const previews = {
    webhook: {
      channel: "REST Webhook / CRM Event",
      idemp: "idemp_crm_sync_99182a",
      raw: `POST /api/v1/work/ingest HTTP/1.1\nX-Signature-SHA256: 4f1a...8e02\nIdempotency-Key: idemp_crm_sync_99182a\n\n{\n  "client_tax_id": "84-1928471",\n  "engagement_type": "Q3_STATUTORY_AUDIT",\n  "contact_email": "cfo@acmecorp.com"\n}`,
      normalized: {
        title: "Q3 Statutory Audit Binder - Acme Corp",
        entity: "Acme Corp (ID: ent_99214)",
        requirementsProfile: "FIN_AUDIT_V3 (4 required artifacts)",
        slaDeadline: "T+14 Business Days",
      },
    },
    email: {
      channel: "Inbound Email Intake (MIME)",
      idemp: "idemp_msgid_d892ba",
      raw: `From: "Sarah Chen" <schen@globex.org>\nTo: filings@avenra.yourfirm.com\nSubject: Matter 2026-B: Cross-Border Tax Schedules\nDKIM: PASS | SPF: PASS\n\nHi Team,\nPlease find our initial drafts attached for the offshore filing...`,
      normalized: {
        title: "Cross-Border Tax Schedules - Globex Org",
        entity: "Globex Org (Matched by domain @globex.org)",
        requirementsProfile: "LEGAL_CROSS_BORDER_V1 (3 required artifacts)",
        slaDeadline: "T+7 Business Days",
      },
    },
    form: {
      channel: "External Client Intake Portal",
      idemp: "idemp_form_token_71e42",
      raw: `Client Portal Submission:\nSession: sess_guest_client_9182\nIP: 198.51.100.44 (Cloudflare Verified)\nFields: { "company_name": "Apex Holdings", "service": "Tax Prep" }`,
      normalized: {
        title: "Annual Corporate Tax Preparation - Apex Holdings",
        entity: "Apex Holdings (New Entity Pending Partner Approval)",
        requirementsProfile: "CPA_TAX_PREP_V2 (6 required artifacts)",
        slaDeadline: "T+21 Business Days",
      },
    },
  };

  const curr = previews[source];

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            INTAKE NORMALIZER & IDEMPOTENCY ENGINE
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-400 border border-indigo-500/20">
          <Key className="h-3 w-3" /> IDEMPOTENT INGEST
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["webhook", "email", "form"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`rounded-lg py-2 font-mono text-xs uppercase tracking-wider transition-colors border ${
              source === s
                ? "bg-indigo-500 text-white border-indigo-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/70 bg-black/70 p-3.5 font-mono text-[11px] text-indigo-200">
        <div className="text-[10px] text-text-tertiary mb-1"># Inbound Raw Protocol ({curr.channel})</div>
        <pre className="overflow-x-auto whitespace-pre font-mono">{curr.raw}</pre>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Normalized Avenra Work Item Created
          </span>
          <span className="font-mono text-[10px] text-emerald-300">Status: DRAFT</span>
        </div>
        <div className="mt-2.5 space-y-1.5 font-mono text-[11px] text-text-secondary">
          <div><strong className="text-text-primary">Title:</strong> {curr.normalized.title}</div>
          <div><strong className="text-text-primary">Entity:</strong> {curr.normalized.entity}</div>
          <div><strong className="text-text-primary">Profile:</strong> {curr.normalized.requirementsProfile}</div>
          <div><strong className="text-text-primary">SLA:</strong> {curr.normalized.slaDeadline}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <RefreshCw className="h-3.5 w-3.5 text-indigo-400" /> Key: {curr.idemp}
        </span>
        <span className="font-mono">ADR-003 Compliant</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Security",
    question: "How does Avenra prevent webhook spoofing or replay attacks?",
    answer: "Every inbound webhook is authenticated using HMAC-SHA256 signatures signed with your tenant's shared webhook secret. Furthermore, each request includes a timestamp header; requests older than 300 seconds are rejected to thwart replay attacks. Once processed, the idempotency key is cached in Redis with a 72-hour TTL to prevent duplicate execution.",
  },
  {
    category: "Email Parsing",
    question: "What happens if a spam email or phishing attack is sent to the intake address?",
    answer: "Inbound emails are evaluated against SPF, DKIM, and DMARC records before parsing. If validation fails or the sender domain does not match any recognized entity in your tenant client registry, the email is quarantined into an unverified intake queue without triggering downstream automations.",
  },
  {
    category: "Attachments",
    question: "Are attachments in inbound emails scanned for malware automatically?",
    answer: "Yes. Inbound email MIME parts and attachments are extracted directly into isolated temporary buffers and evaluated against ClamAV before any file metadata is persisted or shown to operators. Compromised files are immediately scrubbed and flagged with security alerts.",
  },
  {
    category: "Deduplication",
    question: "What happens if an external system fires the same webhook 5 times due to network timeouts?",
    answer: "Avenra enforces exact-once processing via Redis SETNX locks on the `Idempotency-Key` header. The first invocation claims the lock and creates the deliverable; subsequent requests return the exact same HTTP 201 response payload with the established work item ID, preventing duplicate work creation.",
  },
];

export default function IntentCapturePage() {
  return (
    <MarketingLayout
      category="Lifecycle Stage 1"
      badge="Intent Ingestion Engine"
      variant="how-it-works"
      title="Capturing Unstructured Business Intent"
      subtitle="How Avenra ingests requests from emails, webhooks, or client request links and structures them into formal, actionable work items."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "Stage 1: Intent Capture" },
      ]}
      heroVisual={<IntentCaptureHeroVisual />}
      stats={[
        { value: "Multi-Source", label: "Ingestion Channels", detail: "Email, Webhook, API, UI" },
        { value: "Automated", label: "Schema Initiation", detail: "Extracts title, client, and tags" },
        { value: "Zero Loss", label: "Deduplication", detail: "Idempotent external event keys" },
        { value: "Instant", label: "State Initialization", detail: "Sets initial DRAFT state" },
      ]}
      features={[
        {
          icon: Mail,
          title: "Inbound Email Parsing",
          description: "Incoming emails to your firm's intake address are automatically routed, parsed, and matched against existing client records.",
          badge: "EMAIL",
        },
        {
          icon: Zap,
          title: "API & Webhook Ingestion",
          description: "Trigger work creation directly from CRMs, ERPs, or custom web forms via signed OpenAPI v1 endpoints.",
          badge: "API",
        },
        {
          icon: Workflow,
          title: "Smart Task Scaffolding",
          description: "Assigns deliverable templates, required checklists, and deadline milestones based on the requested work type.",
          badge: "TEMPLATES",
        },
        {
          icon: Inbox,
          title: "Deduplication & Re-entry Prevention",
          description: "Idempotency tokens prevent the creation of duplicate work items if an external partner resends the same payload.",
          badge: "IDEMPOTENT",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Deep Channel Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Protocol Specifications
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Three Unified Channels, One Deterministic Ledger
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Enterprise firms receive client demands across chaotic channels. Avenra normalizes all incoming requests into standard, strongly-typed internal Work Deliverables.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Channel 1: Email Intake</h3>
              <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                <li>• SPF/DKIM cryptographic validation</li>
                <li>• Client entity domain resolution</li>
                <li>• Thread tracking & deduplication</li>
                <li>• Inbound attachment virus screening</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Channel 2: Signed Webhooks</h3>
              <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                <li>• HMAC-SHA256 signature verification</li>
                <li>• Replay attack window check (&lt; 300s)</li>
                <li>• Idempotency key Redis deduplication</li>
                <li>• Immediate HTTP 201 Created acknowledgment</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Channel 3: Client Portal Forms</h3>
              <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                <li>• Dynamic schema-driven UI forms</li>
                <li>• Client-side JSON schema validation</li>
                <li>• Instant draft auto-save sessions</li>
                <li>• Cloudflare Turnstile bot deterrence</li>
              </ul>
            </div>
          </div>
        </div>

        {/* OpenAPI v1 Endpoint Specification */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">OpenAPI v1 Ingestion Contract</h3>
              <p className="text-xs text-text-secondary">POST /api/v1/work/ingest</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-black/70 p-6 font-mono text-xs text-indigo-300 border border-white/5 overflow-x-auto">
            <pre>{`curl -X POST https://api.avenra.yourfirm.com/api/v1/work/ingest \\
  -H "Authorization: Bearer sec_tok_live_99218a" \\
  -H "Idempotency-Key: idemp_matter_2026_q3_01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "cli_992819",
    "template_id": "tmpl_corporate_tax_prep_v2",
    "title": "2026 Q3 Statutory Audit Binder",
    "priority": "HIGH",
    "due_date": "2026-11-30T17:00:00Z",
    "custom_fields": {
      "partner_in_charge": "u_81920a",
      "billing_code": "MAT-901-NYC"
    }
  }'

# Response: 201 Created
{
  "work_id": "wrk_01HZX8934A",
  "status": "DRAFT",
  "requirements_count": 4,
  "client_portal_url": "https://portal.avenra.yourfirm.com/c/sec_mag_99182a",
  "created_at": "2026-11-09T17:20:00.104Z"
}`}</pre>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Intent Capture & Ingestion FAQ"
            subtitle="Deep engineering answers on deduplication, channel authentication, and intake security."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Stage 2: Information Gathering & Magic Links</div>
          </div>
          <Link
            href="/how-it-works/information-gathering"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Information Gathering <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
