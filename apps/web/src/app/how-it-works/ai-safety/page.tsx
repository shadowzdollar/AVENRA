"use client";

import { useState } from "react";
import {
  FileSearch,
  Lock,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Trash2,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function AiSafetyHeroVisual() {
  const [step, setStep] = useState<number>(3);

  const steps = [
    {
      id: 1,
      title: "1. Ephemeral In-Memory Stream",
      actor: "API GATEWAY",
      detail: "Presigned memory buffer delivered over mTLS. Zero local disk writes.",
      status: "PASS",
    },
    {
      id: 2,
      title: "2. PyMuPDF OCR & Extraction",
      actor: "PYTHON 3.14 WORKER",
      detail: "Air-gapped process with no internet egress. Isolated Linux cgroups sandbox.",
      status: "PASS",
    },
    {
      id: 3,
      title: "3. Pydantic v2 Schema Gate",
      actor: "VALIDATION ENGINE",
      detail: "Regex constraints & type bounds strictly enforced before returning to Java backend.",
      status: "PASS",
    },
    {
      id: 4,
      title: "4. Memory Wipe & Purge",
      actor: "RAM ZERO-FILL",
      detail: "Garbage collection + explicit memory buffer overwrite. 0 bytes retained on worker.",
      status: "COMPLETED",
    },
  ];

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            AI WORKER ISOLATION BOUNDARY
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          ZERO DISK PERSISTENCE
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((s) => (
          <div
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`rounded-xl border p-3 cursor-pointer transition-colors ${
              step === s.id
                ? "border-indigo-500 bg-indigo-500/15"
                : "border-border/60 bg-canvas hover:border-border hover:bg-canvas-subtle"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">{s.title}</span>
              <span className="font-mono text-[10px] text-text-tertiary">{s.actor}</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/70 bg-black/70 p-3 font-mono text-[11px] text-indigo-300">
        <div className="text-text-tertiary text-[10px] mb-1"># Python Isolation Invariant (ADR-012)</div>
        <div className="text-emerald-400">Database Access: DENIED (No JDBC/SQL driver installed)</div>
        <div className="text-emerald-400">Public Internet: DENIED (No egress route configured)</div>
        <div className="text-emerald-400">Retention Policy: 0 Seconds (In-memory pipeline only)</div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <Trash2 className="h-3.5 w-3.5 text-indigo-400" /> Explicit RAM Buffer Zeroization
        </span>
        <span className="font-mono">ADR-012 Certified</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Data Privacy",
    question: "Is our client data or confidential financial information used to train AI models?",
    answer: "No. Never. Avenra operates under strict zero-data retention agreements with model providers. Documents and extraction outputs are never retained, logged, cached, or used to fine-tune or train foundation models. Your data remains 100% sovereign.",
  },
  {
    category: "Air-Gapped Deployment",
    question: "Can the AI worker be hosted on-premise without calling any external cloud APIs?",
    answer: "Yes. For defense contractors, government entities, and ultra-high-security healthcare networks, Avenra supports on-premise self-hosted OCR and local open weights LLM inference (e.g. Docling, Mistral, Llama 3 via vLLM) entirely inside your air-gapped VPC.",
  },
  {
    category: "Data Privacy & Opt-In",
    question: "How is confidential client data protected when AI document reading is enabled?",
    answer: "AI reading is strictly opt-in per organization (ADR-030). When enabled, the stateless Python worker processes bytes in ephemeral RAM buffers, outputs Pydantic-validated JSON, and immediately frees memory. Zero document text is stored in AI invocation records, and models are never trained on your data.",
  },
  {
    category: "Hallucinations",
    question: "How does Avenra prevent hallucinations from corrupting verified records?",
    answer: "AI models in Avenra are never permitted to write directly to customer records. Output is parsed into strongly typed Pydantic models with strict regex and arithmetic bounds. If any field fails validation or confidence falls below threshold, the record is flagged for human operator review.",
  },
];

export default function AiSafetyPage() {
  return (
    <MarketingLayout
      category="AI Governance"
      badge="Air-Gapped Architecture"
      variant="how-it-works"
      title="Air-Gapped AI Isolation & Privacy Safeguards"
      subtitle="How Avenra harnesses state-of-the-art vision and language models for document reading while guaranteeing zero data retention and strict execution boundaries."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "AI Safety" },
      ]}
      heroVisual={<AiSafetyHeroVisual />}
      stats={[
        { value: "0 Days", label: "Model Retention", detail: "Zero training on your client files" },
        { value: "Stateless", label: "Python Service", detail: "Owns no persistent database tables" },
        { value: "Zero Trust", label: "Model Output", detail: "Validated against strict Pydantic schemas" },
        { value: "No Direct DB", label: "Network Isolation", detail: "API acts as strict intermediary" },
      ]}
      features={[
        {
          icon: Lock,
          title: "Stateless Microservice Isolation",
          description: "The AI service has no direct database access. It receives ephemeral document buffers from the API and returns typed JSON.",
          badge: "AIR-GAPPED",
        },
        {
          icon: ShieldAlert,
          title: "Zero Model Authority",
          description: "Model predictions are treated as untrusted suggestions. The core Spring Boot engine validates all values before modifying state.",
          badge: "ZERO TRUST",
        },
        {
          icon: FileSearch,
          title: "Strict Pydantic Schema Contracts",
          description: "All extracted values must conform to explicit types, regex bounds, and required field invariants before acceptance.",
          badge: "PYDANTIC",
        },
        {
          icon: ShieldCheck,
          title: "Zero Data Training Agreements",
          description: "Avenra enforces enterprise commercial terms with model providers: your documents are never logged or used for fine-tuning.",
          badge: "NO TRAINING",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Consumer AI vs Avenra AI Comparison */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Risk Mitigation
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Consumer AI vs. Avenra Enterprise Air-Gapped AI
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Feeding corporate tax returns or confidential merger documents into consumer chatbots is a severe compliance violation. Avenra provides an institutional-grade alternative.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-red-500/20 bg-canvas-subtle p-6">
              <h3 className="font-bold text-red-400 text-base">Consumer AI / Public Chatbots</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Prompts and uploaded files retained for future model training</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Hallucinations and false math passed directly to end users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>No granular access control or tenant isolation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Data stored on shared multi-tenant cloud storage</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6">
              <h3 className="font-bold text-emerald-400 text-base">Avenra Air-Gapped Document AI</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Contractual zero-retention guarantee: no training, no logging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Strict Pydantic schema validation & deterministic cross-footing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>PostgreSQL Row-Level Security, opt-in AI reading, SHA-256 evidence sealing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Air-gapped VPC or 100% on-premise local model inference</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="AI Safety & Governance FAQ"
            subtitle="Deep engineering answers on air-gapped deployments, zero data training policies, and hallucination prevention."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Complete Architecture Tour</div>
            <div className="text-base font-bold text-text-primary">Explore Avenra Security & Trust Center</div>
          </div>
          <Link
            href="/security"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Visit Security Center <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
