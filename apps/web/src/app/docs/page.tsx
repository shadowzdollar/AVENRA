/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Code2,
  Key,
  Server,
  Terminal,
  ArrowRight,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveApiExplorer } from "@/components/enterprise/InteractiveApiExplorer";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function DocsHeroVisual() {
  const [tab, setTab] = useState<"quickstart" | "auth" | "webhooks">("quickstart");
  const [copied, setCopied] = useState(false);

  const snippets = {
    quickstart: `# 1. Clone repository & initialize environment
git clone https://github.com/avenra/avenra.git && cd avenra
cp .env.example .env

# 2. Start all infra (Postgres, Redis, SeaweedFS S3, ClamAV, Mailpit)
docker compose up -d

# 3. Launch Java 25 Monolith + Next.js Web + Python AI
./mvnw -f apps/api spring-boot:run &
pnpm --filter @avenra/web run dev &
uv run --directory apps/ai uvicorn avenra_ai.main:create_app --port 8090

# Stack healthy at http://localhost:3000`,
    auth: `// Server-Side TypeScript API Client
import { AvenraClient } from '@avenra/sdk';

const avenra = new AvenraClient({
  apiKey: process.env.AVENRA_API_KEY, // sec_live_...
  endpoint: 'https://api.avenra.yourfirm.com'
});

// Authenticate session and retrieve organization metadata
const me = await avenra.identity.getMe();
console.log('Logged in to organization:', me.organizationId);`,
    webhooks: `# Verifying Webhook Signature in Python FastAPI
from fastapi import Request, HTTPException
import hmac, hashlib

async def verify_signature(request: Request, secret: str):
    sig = request.headers.get("X-Avenra-Signature-SHA256")
    ts = request.headers.get("X-Avenra-Timestamp")
    raw_body = await request.body()
    
    expected = hmac.new(
        secret.encode(), f"{ts}.{raw_body.decode()}".encode(), hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(sig, expected):
        raise HTTPException(status_code=401, detail="Invalid signature")`,
  };

  const code = snippets[tab];

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-purple-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-purple-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            DEVELOPER QUICKSTART TERMINAL
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 font-mono text-[11px] text-purple-400 hover:text-purple-300"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-4 flex gap-1.5">
        {(["quickstart", "auth", "webhooks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 font-mono text-xs uppercase tracking-wider transition-colors border ${
              tab === t
                ? "bg-purple-500 text-white border-purple-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-32 w-full overflow-hidden bg-black/40">
          <img src="/images/docs/developer-workspace.jpg"
            alt="Developer Contract SDK and Workspace"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 rounded-full bg-purple-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            {tab.toUpperCase()}
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Developer Spec: {tab === "quickstart" ? "Work Ingestion" : tab === "auth" ? "Bearer Token" : "HMAC Webhook"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Contract Version: v1.0.4
        </span>
        <span className="font-mono">OpenAPI 3.1 Truth</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Architecture",
    question: "Where are the official API contract definitions stored in the repository?",
    answer: "All OpenAPI 3.1 contracts are centrally maintained in `packages/contracts/`. Frontend TypeScript types and Spring Boot DTOs are generated automatically during `pnpm build` and `mvn compile`, ensuring zero drift between client and server code.",
  },
  {
    category: "Local Dev",
    question: "Can I run the entire Avenra stack locally without internet access?",
    answer: "Yes! Running `docker compose up -d` boots PostgreSQL 18, Redis 7, SeaweedFS (local S3), ClamAV (antivirus), and Mailpit (local SMTP). The Java API, Python AI reader, and Next.js frontend run entirely on localhost with zero cloud dependencies required.",
  },
  {
    category: "Testing",
    question: "How do I run the automated architectural verification test suites?",
    answer: "You can execute `mvn test` in `apps/api` to run all Spring Modulith architectural boundary tests (ArchUnit) and negative tenant isolation integration tests, or `pnpm --filter @avenra/web run check` for web lint and TypeScript typecheck.",
  },
  {
    category: "Webhooks",
    question: "How do I simulate incoming webhooks in local development?",
    answer: "The local development environment includes mock webhook triggers accessible via the `/api/v1/dev/simulate-webhook` endpoint, allowing you to trigger client submissions and verification cycles without configuring external services.",
  },
];

export default function DocsPage() {
  return (
    <MarketingLayout
      category="Developer Documentation"
      badge="Contract-First OpenAPI v1"
      variant="docs"
      title="Avenra Developer & Integration Documentation"
      subtitle="Complete guides, OpenAPI specifications, typed SDKs, and architectural whitepapers for integrating Avenra into your firm's workflows."
      breadcrumbs={[{ label: "Documentation" }]}
      heroVisual={<DocsHeroVisual />}
      stats={[
        { value: "OpenAPI v1", label: "Spec Standard", detail: "Strict single source of truth" },
        { value: "TypeScript", label: "Client SDK", detail: "Fully typed request & response DTOs" },
        { value: "HMAC", label: "Signed Webhooks", detail: "Cryptographic payload verification" },
        { value: "Local Dev", label: "Complete Stack", detail: "Docker Compose with 1-click boot" },
      ]}
      features={[
        {
          icon: Code2,
          title: "Contract-First Architecture",
          description: "All endpoints, request payloads, and response bodies are defined in open YAML contracts in `packages/contracts`.",
          badge: "ADR-008",
        },
        {
          icon: Terminal,
          title: "Local Development Tooling",
          description: "`docker compose up` starts PostgreSQL, Redis, SeaweedFS S3, ClamAV, Jaeger UI, Mailpit, and all services locally.",
          badge: "OFFLINE READY",
        },
        {
          icon: Key,
          title: "API Authentication & Tokens",
          description: "Integrate external services using high-entropy bearer API tokens with explicit granular permission scopes.",
          badge: "SCOPES",
        },
        {
          icon: Server,
          title: "Webhook Delivery & Retries",
          description: "Receive signed HTTP callbacks on work completion with automatic exponential backoff and idempotency protection.",
          badge: "IDEMPOTENT",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Core Architecture Documentation Links */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
                Developer Guides
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Explore the Developer Guides
              </h2>
            </div>
            <p className="text-sm text-text-secondary max-w-md">
              From finite state machine algebra to OpenAPI schema definitions and S3 vault setup.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                href: "/how-it-works/architecture",
                title: "System Topology & Modulith",
                desc: "Spring Boot 4, ArchUnit compile boundaries, and event-driven modular architecture.",
              },
              {
                href: "/how-it-works/state-machines",
                title: "Finite State Machine Engine",
                desc: "Closed transition graphs, database guards, and atomic rollback semantics.",
              },
              {
                href: "/how-it-works/idempotency",
                title: "Idempotency & Concurrency",
                desc: "Redis Redlock, PostgreSQL SKIP LOCKED queues, and exactly-once delivery.",
              },
              {
                href: "/security/tenant-isolation",
                title: "PostgreSQL Row-Level Security",
                desc: "Kernel-level tenant segregation, session variables, and header-discarding invariants.",
              },
              {
                href: "/integrations/api",
                title: "REST API & Typed SDKs",
                desc: "Full OpenAPI v1 reference with TypeScript, Python, and Java code samples.",
              },
              {
                href: "/security/whitepaper",
                title: "Security & Trust Whitepaper",
                desc: "42-page formal security specification for enterprise CISOs and compliance auditors.",
              },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-2xl border border-border bg-canvas-subtle p-6 transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-canvas hover:shadow-lg"
              >
                <h3 className="font-bold text-text-primary group-hover:text-purple-400 transition-colors">
                  {guide.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  {guide.desc}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-purple-400">
                  Read Technical Guide <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Embedded Interactive OpenAPI Explorer */}
        <div>
          <InteractiveApiExplorer />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Developer Documentation FAQ"
            subtitle="Answers to common questions regarding local development setup, OpenAPI contracts, and test suites."
            items={FAQ_ITEMS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
