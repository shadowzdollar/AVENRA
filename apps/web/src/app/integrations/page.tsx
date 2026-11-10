/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Code2,
  Database,
  Mail,
  Workflow,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Send,
  Terminal,
  Layers,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { VisualPartnerOrbit } from "@/components/enterprise/VisualPartnerOrbit";
import { EnterpriseSectionImage } from "@/components/enterprise/EnterpriseImageCard";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function IntegrationsHeroVisual() {
  const [activeConnector, setActiveConnector] = useState<"storage" | "automation" | "email" | "api">("storage");

  return (
    <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            INTEGRATION EVENT BUS
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          ALL CONNECTORS HEALTHY
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {(["storage", "automation", "email", "api"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setActiveConnector(c)}
            className={`rounded-lg py-2 font-mono text-xs uppercase tracking-wider transition-colors border ${
              activeConnector === c
                ? "bg-amber-500 text-white border-amber-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-28 w-full overflow-hidden bg-black/40">
          <img src={
              activeConnector === "storage"
                ? "/images/integrations/storage.jpg"
                : activeConnector === "automation"
                ? "/images/integrations/webhook-bus.jpg"
                : activeConnector === "email"
                ? "/images/platform/reminders.jpg"
                : "/images/integrations/openapi-sdk.jpg"
            }
            alt="Integration Connector Telemetry"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            CONNECTED · 100% RELIABILITY
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Active Subsystem: {activeConnector.toUpperCase()} Dispatcher
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Signed Payloads with Idempotency
        </span>
        <span className="font-mono">Open Standards</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Architecture",
    question: "Do Avenra integrations require deploying custom on-premise gateway software?",
    answer: "No. Avenra integrates via standard REST APIs, signed webhooks, S3-compatible storage protocols, and standard SMTP/IMAP email interfaces. No proprietary proxies or bespoke agents are required inside your infrastructure.",
  },
  {
    category: "Security",
    question: "How are webhook payloads authenticated between Avenra and external systems?",
    answer: "Every outgoing webhook carries an `X-Avenra-Signature-SHA256` header containing the HMAC-SHA256 hash of the payload generated with your tenant's secret signing key. Inbound webhooks similarly require cryptographic signature validation and timestamp replay verification.",
  },
  {
    category: "SDKs",
    question: "What client SDKs are available for custom developer integrations?",
    answer: "We publish official, strictly typed SDKs for TypeScript (Node.js/browser), Python 3.10+, and Java 21+. All SDKs are generated directly from our OpenAPI v1 contract, ensuring 100% type safety and zero drift.",
  },
  {
    category: "Rate Limits",
    question: "What are the default API rate limits for enterprise tenants?",
    answer: "Standard enterprise plans include 10,000 requests per minute with burst capability up to 25,000 requests per minute. Custom dedicated instances support unlimited throughput with zero throttling.",
  },
];

export default function IntegrationsHubPage() {
  return (
    <MarketingLayout
      category="Ecosystem & Connectivity"
      badge="10+ Native Connectors"
      variant="integrations"
      title="Connect Avenra to the Systems Your Firm Already Runs"
      subtitle="From S3-compatible cloud storage to automated webhook triggers and email inboxes. Avenra integrates seamlessly with your existing stack without lock-in."
      breadcrumbs={[{ label: "Integrations" }]}
      heroVisual={<IntegrationsHeroVisual />}
      stats={[
        { value: "S3 Native", label: "Cloud Storage", detail: "AWS S3, R2, MinIO, Wasabi, B2" },
        { value: "HMAC", label: "Signed Webhooks", detail: "Zapier, Make, and self-hosted n8n" },
        { value: "Gmail & SMTP", label: "Email Ingestion", detail: "SPF, DKIM, and DMARC verified" },
        { value: "OpenAPI v1", label: "REST Endpoints", detail: "Full typed SDK generation" },
      ]}
      features={[
        {
          icon: Database,
          title: "S3-Compatible Cloud Storage",
          description: "Archive evidence binders directly to your designated AWS S3, Cloudflare R2, MinIO, or Wasabi bucket with presigned URLs.",
          badge: "STORAGE",
        },
        {
          icon: Workflow,
          title: "Workflow Automation Tools",
          description: "Connect to Zapier, Make, and n8n to ingest new work items and dispatch notifications on verified completion.",
          badge: "AUTOMATION",
        },
        {
          icon: Mail,
          title: "Email Ingestion & Gmail",
          description: "Receive client attachments and replies directly via incoming webhook or Gmail integration with spam and malware scanning.",
          badge: "INBOX",
        },
        {
          icon: Code2,
          title: "Developer REST API",
          description: "Full programmatic access to work creation, check evaluation, evidence retrieval, and audit streams.",
          badge: "API",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive Ecosystem Orbital Stage */}
        <div>
          <VisualPartnerOrbit />
        </div>

        {/* Core Subsystem Directory */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
                Integration Categories
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Explore the Four Connector Pillars
              </h2>
            </div>
            <p className="text-sm text-text-secondary max-w-md">
              Connect your storage vaults, business automation pipelines, communication channels, and custom code.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/integrations/storage",
                title: "Cloud S3 Storage",
                code: "S3 / R2 / MINIO",
                desc: "Streaming ClamAV upload and sealed manifest export to your S3 bucket.",
                icon: HardDrive,
              },
              {
                href: "/integrations/automation",
                title: "Workflow Automation",
                code: "ZAPIER / MAKE / N8N",
                desc: "Trigger work creation from CRM leads and broadcast completion webhooks.",
                icon: Workflow,
              },
              {
                href: "/integrations/communications",
                title: "Communications Hub",
                code: "EMAIL / SLACK / SES",
                desc: "Inbound MIME parsing, adaptive reminder dispatch, and operator alerts.",
                icon: Send,
              },
              {
                href: "/integrations/api",
                title: "Developer REST API",
                code: "OPENAPI V1",
                desc: "Contract-first OpenAPI endpoints, typed SDKs, and developer sandbox keys.",
                icon: Terminal,
              },
            ].map((conn) => {
              const Icon = conn.icon;
              return (
                <Link
                  key={conn.href}
                  href={conn.href}
                  className="group rounded-2xl border border-border bg-canvas-subtle p-6 transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/40 hover:bg-canvas hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-text-tertiary group-hover:text-amber-400 transition-colors">
                      {conn.code}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-text-primary group-hover:text-amber-400 transition-colors">
                    {conn.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {conn.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    Explore Integration <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Enterprise Integration Ecosystem Visual */}
        <div>
          <EnterpriseSectionImage
            src="/images/integrations/ecosystem.jpg"
            alt="Connected Enterprise Integration Ecosystem"
            badge="Unified Ecosystem"
            title="Sovereign Enterprise Integration Ecosystem"
            description="Seamlessly bridge client onboarding, document intake, and sealed compliance packaging into your existing tech stack with zero vendor lock-in."
            bullets={[
              "Native connectors for AWS S3, Cloudflare R2, Azure Blob, and SeaweedFS",
              "Bi-directional webhook synchronization with Zapier, Slack, and practice management tools",
              "Type-safe OpenAPI 3.1 code-generated SDKs in TypeScript, Python, and Java",
              "High-reliability delivery queues with automatic retry schedules across 72 hours",
            ]}
          />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Integrations & Connectors FAQ"
            subtitle="Deep engineering answers on webhook signatures, rate limits, and custom connector development."
            items={FAQ_ITEMS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
