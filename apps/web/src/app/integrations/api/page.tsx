"use client";

import { useState } from "react";
import {
  Code2,
  Key,
  Server,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveApiExplorer } from "@/components/enterprise/InteractiveApiExplorer";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function ApiHeroVisual() {
  const [lang, setLang] = useState<"curl" | "ts" | "python" | "java">("curl");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST https://api.avenra.yourfirm.com/api/v1/work \\
  -H "Authorization: Bearer sec_live_99a81f" \\
  -H "Idempotency-Key: idemp_99182a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "cli_9912",
    "title": "2026 Q3 Statutory Audit Binder",
    "priority": "HIGH"
  }'`,
    ts: `import { AvenraClient } from '@avenra/sdk';

const avenra = new AvenraClient({ apiKey: process.env.AVENRA_API_KEY });

const work = await avenra.work.create({
  clientId: 'cli_9912',
  title: '2026 Q3 Statutory Audit Binder',
  priority: 'HIGH',
  idempotencyKey: 'idemp_99182a',
});

console.log('Work Item Created:', work.id, work.status);`,
    python: `from avenra import AvenraClient

client = AvenraClient(api_key="sec_live_99a81f")

work = client.work.create(
    client_id="cli_9912",
    title="2026 Q3 Statutory Audit Binder",
    priority="HIGH",
    idempotency_key="idemp_99182a"
)

print(f"Created Work ID: {work.id}")`,
    java: `import com.avenra.sdk.AvenraClient;
import com.avenra.sdk.models.WorkItem;

AvenraClient client = AvenraClient.builder()
    .apiKey("sec_live_99a81f")
    .build();

WorkItem work = client.work().create(CreateWorkRequest.builder()
    .clientId("cli_9912")
    .title("2026 Q3 Statutory Audit Binder")
    .priority(Priority.HIGH)
    .idempotencyKey("idemp_99182a")
    .build());`,
  };

  const code = snippets[lang];

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            OFFICIAL SDK EXAMPLES
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 font-mono text-[11px] text-amber-400 hover:text-amber-300"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy Code"}
        </button>
      </div>

      <div className="mt-4 flex gap-1.5">
        {(["curl", "ts", "python", "java"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`flex-1 rounded-lg py-1.5 font-mono text-xs uppercase tracking-wider transition-colors border ${
              lang === l
                ? "bg-amber-500 text-white border-amber-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-black/70 p-4 font-mono text-xs text-amber-300 overflow-x-auto">
        <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed">{code}</pre>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Contract-First OpenAPI v1
        </span>
        <span className="font-mono">ADR-008 Certified</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Contract-First",
    question: "What is contract-first API development under ADR-008?",
    answer: "Under ADR-008, no controller or client code is written without a committed OpenAPI 3.1 specification in `packages/contracts`. The specification is the single source of truth: TypeScript interfaces, Python Pydantic models, and Java Spring interfaces are code-generated during the build, guaranteeing that client and backend stay perfectly in sync.",
  },
  {
    category: "Authentication",
    question: "How do API tokens authenticate and determine tenant context?",
    answer: "Avenra issues granular Bearer tokens prefixed with `sec_live_` or `sec_test_`. Under ADR-005, the API gateway validates the token signature, looks up the corresponding tenant ID, and sets the PostgreSQL session context (`SET LOCAL app.current_organization_id = :orgId`). Any client-provided `X-Tenant-Id` header is stripped and discarded.",
  },
  {
    category: "Error Format",
    question: "What error format does the API return on failure?",
    answer: "Avenra adheres strictly to RFC 7807 (Problem Details for HTTP APIs). Every 4xx/5xx response returns a JSON envelope containing `type`, `title`, `status`, `detail`, `instance`, and an array of `invalid_params` highlighting exact field-level validation errors.",
  },
  {
    category: "Deprecation",
    question: "What is your API versioning and deprecation policy?",
    answer: "Breaking changes are introduced exclusively via new major path versions (e.g. `/api/v2`). Deprecated endpoints remain supported for a minimum of 18 months with explicit `Sunset` and `Deprecation` HTTP headers and advance email notification.",
  },
];

export default function ApiIntegrationsPage() {
  return (
    <MarketingLayout
      category="Developer Integrations"
      badge="OpenAPI v1 Contract"
      variant="integrations"
      title="REST API, SDKs & Webhooks Reference"
      subtitle="Complete programmatic control over work creation, client request generation, verification checkpoints, and evidence locker exports."
      breadcrumbs={[
        { label: "Integrations", href: "/integrations" },
        { label: "Developer API" },
      ]}
      heroVisual={<ApiHeroVisual />}
      stats={[
        { value: "OpenAPI 3.1", label: "Specification", detail: "Strict contracts in packages/contracts" },
        { value: "TypeScript", label: "Client SDK", detail: "Typed models & request builders" },
        { value: "HMAC", label: "Webhook Signatures", detail: "Cryptographic SHA-256 header" },
        { value: "Sub-50ms", label: "Response Latency", detail: "High-performance Spring Boot API" },
      ]}
      features={[
        {
          icon: Code2,
          title: "Contract-First Architecture",
          description: "All endpoints follow ADR-008: interfaces and DTOs are generated directly from the central OpenAPI specification.",
          badge: "ADR-008",
        },
        {
          icon: Key,
          title: "Granular Bearer Tokens",
          description: "Create API keys scoped to explicit permissions (`work.read`, `work.create`, `evidence.export`) with configurable expiration.",
          badge: "SCOPES",
        },
        {
          icon: Server,
          title: "Cryptographically Signed Webhooks",
          description: "Verify webhook authenticity using the `X-Avenra-Signature` header computed using your organization's secret HMAC key.",
          badge: "HMAC",
        },
        {
          icon: Terminal,
          title: "Comprehensive Interactive Docs",
          description: "Explore the live Redocly specification, schema definitions, error catalogs, and code snippets.",
          badge: "DOCS",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive Contract Explorer */}
        <div>
          <InteractiveApiExplorer />
        </div>

        {/* RFC 7807 Error Catalog Specification */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              Standardized Error Envelopes
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              RFC 7807 Problem Details Specification
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Avenra APIs never return opaque 500 HTML error pages or ambiguous JSON strings. Every error is machine-readable and actionable.
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-black/70 p-6 font-mono text-xs text-amber-300 border border-white/5 overflow-x-auto">
            <pre>{`HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.avenra.com/errors/validation-failed",
  "title": "Document Verification Preconditions Failed",
  "status": 422,
  "detail": "Deliverable wrk_01HZX8934A failed 1 of 5 verification rules.",
  "instance": "/api/v1/work/wrk_01HZX8934A/verify",
  "invalid_params": [
    {
      "field": "ein_number",
      "reason": "EIN pattern must match ^[0-9]{2}-[0-9]{7}$, received '841928471'",
      "code": "REGEX_MISMATCH"
    }
  ],
  "timestamp": "2026-11-09T17:45:10.021Z"
}`}</pre>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Developer REST API FAQ"
            subtitle="Deep engineering answers on contract-first generation, token scoping, and error handling."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-amber-400">Documentation & Setup</div>
            <div className="text-base font-bold text-text-primary">View Full Documentation Hub</div>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            Go to Docs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
