"use client";

import { useState } from "react";
import {
  RefreshCw,
  Server,
  Workflow,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Code2,
  Send,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function AutomationHeroVisual() {
  const [selectedEvent, setSelectedEvent] = useState<"created" | "verified" | "sealed">("verified");
  const [dispatched, setDispatched] = useState<boolean>(false);

  const events = {
    created: {
      type: "work.created",
      desc: "New work deliverable initialized from inbound intake",
      payload: `{\n  "event": "work.created",\n  "work_id": "wrk_01HZX8934A",\n  "client_id": "cli_99182",\n  "status": "DRAFT",\n  "timestamp": "2026-11-09T17:40:00Z"\n}`,
    },
    verified: {
      type: "work.verified",
      desc: "All deterministic rules & document extraction passed 100%",
      payload: `{\n  "event": "work.verified",\n  "work_id": "wrk_01HZX8934A",\n  "checks_passed": 5,\n  "virus_scan": "CLEAN",\n  "score": 1.0,\n  "timestamp": "2026-11-09T17:42:15Z"\n}`,
    },
    sealed: {
      type: "work.sealed",
      desc: "Package compiled into SHA-256 archive & uploaded to customer S3",
      payload: `{\n  "event": "work.sealed",\n  "work_id": "wrk_01HZX8934A",\n  "manifest_sha256": "4a2b9e...01c7",\n  "s3_vault_uri": "s3://firm-vault/matter-01.zip",\n  "timestamp": "2026-11-09T17:43:00Z"\n}`,
    },
  };

  const curr = events[selectedEvent];

  const handleTestDispatch = () => {
    setDispatched(true);
    setTimeout(() => setDispatched(false), 2500);
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            WEBHOOK EVENT DISPATCH SIMULATOR
          </span>
        </div>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400 border border-amber-500/20">
          HMAC-SHA256 SIGNED
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {(["created", "verified", "sealed"] as const).map((ev) => (
          <button
            key={ev}
            onClick={() => setSelectedEvent(ev)}
            className={`flex-1 rounded-lg py-2 font-mono text-xs transition-colors border ${
              selectedEvent === ev
                ? "bg-amber-500 text-white border-amber-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {ev}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-text-primary">{curr.type}</div>
          <button
            onClick={handleTestDispatch}
            className="rounded-lg bg-amber-500 px-3 py-1 font-mono text-xs font-bold text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5"
          >
            <Send className="h-3 w-3" /> Test Webhook Call
          </button>
        </div>
        <p className="mt-1 text-xs text-text-secondary">{curr.desc}</p>

        <div className="mt-3 rounded-lg bg-black/70 p-3 font-mono text-[11px] text-amber-300 border border-white/5">
          <div className="text-text-tertiary text-[10px] mb-1">
            Headers: X-Avenra-Signature-SHA256: 4f1a...8e02 • Idempotency-Key: idemp_99a81f
          </div>
          <pre className="overflow-x-auto whitespace-pre font-mono text-[10px]">{curr.payload}</pre>
        </div>

        {dispatched && (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 font-mono text-xs text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Delivered to https://hooks.zapier.com/...
            </span>
            <span className="font-bold">200 OK (38ms)</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Exponential Backoff Retries (Up to 72h)
        </span>
        <span className="font-mono">At-Least-Once Guarantee</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Signatures",
    question: "How do I verify the HMAC-SHA256 signature in our receiving application?",
    answer: "Every outgoing webhook carries the `X-Avenra-Signature-SHA256` header. You compute the HMAC of the raw request body using your tenant's shared secret key and the SHA-256 hash algorithm, then compare the two values using a constant-time comparison function to prevent timing attacks.",
  },
  {
    category: "Retries",
    question: "What happens if our automation endpoint or CRM is temporarily down?",
    answer: "Avenra uses classified retry logic: if your endpoint responds with 5xx or times out, we retry with exponential backoff and jitter (initial retry at 1s, doubling up to 24 hours, retained for up to 72 hours). 4xx client errors (e.g. 401 Unauthorized) are permanently logged without repeated retries.",
  },
  {
    category: "Replay Attacks",
    question: "How does Avenra prevent webhook replay attacks?",
    answer: "Every webhook includes an `X-Avenra-Timestamp` header. Your receiving endpoint should verify that the timestamp is within 300 seconds of current system time. Furthermore, the `Idempotency-Key` header allows your receiver to deduplicate repeated calls safely.",
  },
  {
    category: "No-Code",
    question: "Can non-technical team members set up Zapier and Make automations?",
    answer: "Yes. Avenra delivers signed webhook events (HMAC-SHA256) with automatic retry back-off. Automation platforms like Zapier, Make, and n8n can receive Avenra webhooks and route data to any downstream CRM or internal system with zero custom code.",
  },
];

export default function AutomationIntegrationsPage() {
  return (
    <MarketingLayout
      category="Workflow Integrations"
      badge="Webhooks & Events"
      variant="integrations"
      title="Zapier, Make & n8n Workflow Automation"
      subtitle="Trigger verified work items from your CRM and dispatch completed evidence packages downstream to accounting and billing tools."
      breadcrumbs={[
        { label: "Integrations", href: "/integrations" },
        { label: "Automation Tools" },
      ]}
      heroVisual={<AutomationHeroVisual />}
      stats={[
        { value: "HMAC", label: "Signed Payloads", detail: "SHA-256 webhook verification" },
        { value: "100%", label: "Idempotency", detail: "Prevent duplicate CRM triggers" },
        { value: "Instant", label: "Event Dispatch", detail: "Sub-second webhook delivery" },
        { value: "n8n Ready", label: "Self-Hosted", detail: "Full open-source workflow support" },
      ]}
      features={[
        {
          icon: Zap,
          title: "Zapier Native Connector",
          description: "Connect your automation tools (Zapier, Make, n8n) to Avenra work creation and completion events via signed webhooks.",
          badge: "ZAPIER",
        },
        {
          icon: Workflow,
          title: "Make (Integromat) Scenarios",
          description: "Build visual multi-branch routing scenarios that react to work exceptions and deliverable approvals.",
          badge: "MAKE",
        },
        {
          icon: Server,
          title: "Self-Hosted n8n Workflows",
          description: "For privacy-conscious firms: keep your workflow orchestrations inside your own private VPC using n8n.",
          badge: "N8N",
        },
        {
          icon: RefreshCw,
          title: "Idempotent Event Retries",
          description: "If your automation endpoint is temporarily offline, Avenra queues payloads with exponential backoff and unique event IDs.",
          badge: "RETRIES",
        },
      ]}
    >
      <div className="space-y-20">
        {/* HMAC Verification Code Examples */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">HMAC-SHA256 Signature Verification</h3>
              <p className="text-xs text-text-secondary">Node.js / Express implementation</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-black/70 p-6 font-mono text-xs text-amber-300 border border-white/5 overflow-x-auto">
            <pre>{`import crypto from 'node:crypto';

export function verifyAvenraWebhook(req, secret) {
  const signature = req.headers['x-avenra-signature-sha256'];
  const timestamp = req.headers['x-avenra-timestamp'];
  
  // Replay attack protection (reject older than 5 minutes)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    throw new Error('Webhook timestamp outside acceptable window');
  }

  // Calculate expected HMAC
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(\`\${timestamp}.\${req.rawBody}\`);
  const expected = hmac.digest('hex');

  // Constant-time comparison prevents timing attacks
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) throw new Error('Invalid HMAC signature');
  
  return true;
}`}</pre>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Workflow Automation FAQ"
            subtitle="Deep engineering answers on webhook payloads, signature validation, and retry guarantees."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-amber-400">Next Integration Category</div>
            <div className="text-base font-bold text-text-primary">Communications Hub: Inbound Email & Notifications</div>
          </div>
          <Link
            href="/integrations/communications"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            Explore Communications <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
