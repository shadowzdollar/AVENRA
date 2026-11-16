/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Workflow,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function VerificationHeroVisual() {
  const [activeCheck, setActiveCheck] = useState<number>(0);

  const checks = [
    {
      id: 0,
      name: "1. ClamAV Antivirus Scanner",
      status: "PASS",
      type: "BINARY",
      latency: "18ms",
      details: "Streamed raw bytes scanned against daily virus signatures. Result: 0 malware definitions matched.",
      payload: `clamdscan /tmp/stream_01a: OK\nVirus signatures evaluated: 8,720,119\nInfected files: 0`,
    },
    {
      id: 1,
      name: "2. Magic Byte & Format Guard",
      status: "PASS",
      type: "DETERMINISTIC",
      latency: "2ms",
      details: "Enforces true PDF/A ISO 19005 specification. Rejects disguised executables or malformed file headers.",
      payload: `magic_bytes: 0x25 0x50 0x44 0x46 (%PDF-1.7)\nlinearized: true\npage_count: 14`,
    },
    {
      id: 2,
      name: "3. EIN / Tax ID Regex Matcher",
      status: "PASS",
      type: "DETERMINISTIC",
      latency: "1ms",
      details: "Regex pattern `^[0-9]{2}-[0-9]{7}$` verified against IRS corporate database entity matching.",
      payload: `regex_pattern: "^[0-9]{2}-[0-9]{7}$"\nextracted_ein: "84-1928471"\nentity_match: true`,
    },
    {
      id: 3,
      name: "4. Python AI Document Reader",
      status: "PASS",
      type: "STATISTICAL AI",
      latency: "180ms",
      details: "PyMuPDF text extraction + Pydantic v2 schema validation. Confidence score: 99.4% (> 95.0% threshold).",
      payload: `schema: Form1065Model\nconfidence: 0.994\npartner_capital_reconciliation: 1420500.00 USD\nthreshold_met: true`,
    },
    {
      id: 4,
      name: "5. Mathematical Cross-Foot Check",
      status: "PASS",
      type: "DETERMINISTIC",
      latency: "3ms",
      details: "Line 14 net income matches balance sheet retained earnings delta within $0.00 currency tolerance.",
      payload: `line_14_income: 1,420,500.00\nretained_earnings_delta: 1,420,500.00\ndiscrepancy: 0.00 USD (OK)`,
    },
  ];

  const curr = checks[activeCheck] ?? checks[0]!;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            VERIFICATION RULE PIPELINE
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          5 / 5 CHECKS PASSED
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        {checks.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCheck(c.id)}
            className={`w-full flex items-center justify-between rounded-lg p-2.5 text-left transition-colors border ${
              activeCheck === c.id
                ? "border-indigo-500 bg-indigo-500/15"
                : "border-border/60 bg-canvas hover:border-border hover:bg-canvas-subtle"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-text-primary">{c.name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-text-tertiary">{c.type}</span>
              <span className="text-indigo-400">{c.latency}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
        <div className="relative h-28 w-full overflow-hidden bg-black/40">
          <img src="/images/how-it-works/verification-pipeline.jpg"
            alt="Rule Execution Visual Inspection"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            {curr.status}
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
            Rule Execution: {curr.name} ({curr.latency})
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Zero Stochastic Fallback
        </span>
        <span className="font-mono">ADR-006 Certified</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Deterministic vs AI",
    question: "Why does Avenra prioritize deterministic rules over AI prompts?",
    answer: "Generative AI is probabilistic: it can hallucinate numbers, miscalculate sums, or omit subtle clauses without throwing an error. Avenra uses AI solely as a fast unstructured-to-structured parser. Once fields are extracted into Pydantic models, all compliance, arithmetic, and validation checks are executed by deterministic code that produces identical, provable results every time.",
  },
  {
    category: "Confidence Thresholds",
    question: "What happens if an OCR scan has low visual quality or low AI confidence?",
    answer: "If the AI confidence score drops below your configured threshold (e.g. 95%), the deliverable automatically pauses and diverts to the Exception Queue. An operator is presented with a side-by-side visual viewer showing the original PDF snippet alongside the extracted field, requiring explicit human sign-off before state advance.",
  },
  {
    category: "Audit Log",
    question: "Are the exact verification rules and outputs stored for auditors?",
    answer: "Yes. Every single check execution creates an immutable audit row containing the rule ID, input hash, execution timestamp, pass/fail result, and full JSON output. This ledger is cryptographically sealed into the deliverable's final evidence package.",
  },
  {
    category: "Custom Rules",
    question: "Can our compliance team write custom verification rules without engineering deploys?",
    answer: "Yes. Avenra supports declarative JSON schema rules, regex validation formulas, and Python-based calculation models that compliance officers can configure and test in a sandboxed staging simulator before publishing.",
  },
];

export default function HowVerificationWorksPage() {
  return (
    <MarketingLayout
      category="Lifecycle Stage 3"
      badge="Deterministic Checkpoints"
      variant="how-it-works"
      title="Multi-Point Rule Verification & Check Execution"
      subtitle="How Avenra rigorously validates all client submissions, documents, and calculations against deterministic rules before routing to approval."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "Stage 3: Verification & Execution" },
      ]}
      heroVisual={<VerificationHeroVisual />}
      stats={[
        { value: "0 Assumed", label: "Verification Status", detail: "Every condition explicitly checked" },
        { value: "Sub-Second", label: "Rule Evaluation", detail: "Evaluated in-memory against DB state" },
        { value: "Clear Codes", label: "Failure Transparency", detail: "Exact field & rule error reasons" },
        { value: "Immutable", label: "Audit Log Entry", detail: "Included in final evidence pack" },
      ]}
      features={[
        {
          icon: ShieldCheck,
          title: "Deterministic Rule Engines",
          description: "Rules check regex patterns, entity numbers, date validity, mathematical totals, and required attachments.",
          badge: "RULES",
        },
        {
          icon: ShieldAlert,
          title: "Exception Triage Queue",
          description: "When an external client submits corrupted data or a check fails, the item moves to EXCEPTIONS with clear diagnostics.",
          badge: "TRIAGE",
        },
        {
          icon: UserCheck,
          title: "Explicit Operator Override",
          description: "If an advisory check fails, an authorized operator can review the discrepancy and record a documented override.",
          badge: "RBAC OVERRIDE",
        },
        {
          icon: Workflow,
          title: "Gated Progression",
          description: "Work cannot transition to VERIFIED until every mandatory check passes with automated evidence.",
          badge: "GATED",
        },
      ]}
    >
      <div className="space-y-20">
        {/* The 5-Layer Rule Execution Spectrum */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Execution Spectrum
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Five Consecutive Gates of Truth
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              A deliverable is never marked verified based on gut feeling. Every file and calculation must pass through five isolated, sequential inspection gates.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                  01
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Binary & Malware Screening</h3>
                  <p className="text-xs text-text-secondary">ClamAV memory stream scanning detects trojans, ransomware, and malicious macros before disk persistence.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GATE 1: BINARY
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                  02
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Magic Byte & Spec Integrity</h3>
                  <p className="text-xs text-text-secondary">Enforces strict MIME and file header conformance, preventing file masquerading and buffer overrun vulnerabilities.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GATE 2: SPEC
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                  03
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Deterministic Regex & Format Validation</h3>
                  <p className="text-xs text-text-secondary">Validates corporate identifiers (EIN, CAGE, IBAN, SWIFT, SSN, NPI) against official country checksum formulas.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GATE 3: REGEX
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                  04
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Stateless AI Document Extraction</h3>
                  <p className="text-xs text-text-secondary">Extracts tabular financials and complex legalese into strict Pydantic schemas with confidence scoring.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GATE 4: AI PARSER
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                  05
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Mathematical Cross-Foot Verification</h3>
                  <p className="text-xs text-text-secondary">Reconciles figures across multiple documents (e.g. Schedule K-1 totals matching General Ledger balance sheets).</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GATE 5: ARITHMETIC
              </span>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Verification Engine FAQ"
            subtitle="Deep engineering answers on deterministic rule execution, AI confidence gating, and exception handling."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Stage 4: Sealed Evidence Delivery & Cloud S3 Custody</div>
          </div>
          <Link
            href="/how-it-works/evidence-delivery"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Evidence Delivery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
