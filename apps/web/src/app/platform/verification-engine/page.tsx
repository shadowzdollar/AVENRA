"use client";

import {
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const VERIFICATION_FAQS = [
  {
    category: "Rule Engine",
    question: "What types of verification rules can be evaluated automatically?",
    answer: "Avenra supports five classes of deterministic checks: (1) Schema Validation: JSON Schema and XSD structural validation; (2) Regex & Format Checks: IBANs, Tax IDs (EIN/TIN), VAT numbers, LEIs; (3) Mathematical Tolerances: Sum of invoice items matching total, shareholder percentages summing to 100.00%; (4) Temporal Freshness: Document issue date within the last 90 days; (5) AI Document Extraction: OCR-read values cross-referenced against client database records.",
    technicalDetails: "Rules execute in an isolated JVM evaluation context with sub-10ms latency per check.",
  },
  {
    category: "Exception Handling",
    question: "What happens when an external client uploads a document that fails verification?",
    answer: "The deliverable is immediately flagged with an EXCEPTION state. Avenra generates a specific, client-friendly explanation (e.g., 'The utility bill uploaded is dated 2024-03-12, exceeding the 90-day validity requirement') and automatically dispatches a targeted request link asking only for the corrected file. The operator inbox is simultaneously alerted with full context.",
    technicalDetails: "Zero vague error messages. Failure reason codes are stored in `checks-log.json` and linked to the specific document UUID.",
  },
  {
    category: "Audit Defense",
    question: "Can an auditor see who approved an exception or if a check was overridden?",
    answer: "Yes. In the rare event that an operator with explicit `work.override` permissions waives an advisory check, Avenra captures a mandatory rationale string, operator user ID, IP address, timestamp, and cryptographic signature. The waiver is prominently highlighted in the sealed Evidence Locker PDF/HTML summary.",
    technicalDetails: "Waivers are cryptographically tied to the operator's private session key and cannot be retroactively modified.",
  },
];

export function VerificationHeroVisual() {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Deterministic Rule Evaluation</span>
        <span className="text-success font-bold">ALL_RULES_PASSED</span>
      </div>
      <div className="mt-3 space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">chk_tin_ein_format</span>
          <span className="text-success font-bold">✓ PASSED (0.4ms)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">chk_cap_table_sum_100</span>
          <span className="text-success font-bold">✓ PASSED (1.2ms)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">chk_id_freshness_90d</span>
          <span className="text-success font-bold">✓ PASSED (0.8ms)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">chk_clamav_antivirus</span>
          <span className="text-success font-bold">✓ PASSED (14ms)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">chk_signatory_resolution</span>
          <span className="text-success font-bold">✓ PASSED (3.1ms)</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] flex justify-between">
        <span>Evaluated in Single Transaction</span>
        <span className="text-cyan-400 font-bold">0 Exceptions</span>
      </div>
    </div>
  );
}

export default function VerificationEnginePage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Deterministic Invariant Rules"
      title="The Deterministic Verification Engine"
      subtitle="Say goodbye to skipped checklists and assumed compliance. Avenra evaluates every deliverable against explicit multi-stage verification rules before signing off."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Verification Engine" },
      ]}
      heroVisual={<VerificationHeroVisual />}
      stats={[
        { value: "0", label: "Skipped Steps", detail: "Mandatory check satisfaction" },
        { value: "100%", label: "Rule Transparency", detail: "Explicit reason codes on failure" },
        { value: "Automated", label: "Check Execution", detail: "Regex, schema, and AI reading" },
        { value: "Immutable", label: "Evidence Proof", detail: "Included in final audit pack" },
      ]}
      features={[
        {
          icon: ShieldCheck,
          title: "Multi-Rule Checkpoints",
          description: "Define composite rules: file presence, date bounds, entity number matches, document freshness, and signature verification.",
          badge: "RULES",
        },
        {
          icon: ShieldAlert,
          title: "Exception Management",
          description: "When an external client submits invalid data or a check fails, an exception is immediately routed to the operator inbox with full context.",
          badge: "EXCEPTIONS",
        },
        {
          icon: Sliders,
          title: "Configurable Strictness",
          description: "Tailor rules per client, service line, or regulatory jurisdiction. Mandatory checks block completion; advisories flag warnings.",
        },
        {
          icon: FileCheck2,
          title: "Audit Provenance",
          description: "Every pass or fail result records the timestamp, rule snapshot, evaluation inputs, and operator overrides.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Verification Rule Matrix Showcase */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Rule Execution Spectrum
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Five Layers of Automated Deliverable Verification
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Most platforms rely on passive &apos;status update&apos; dropdowns where operators click &apos;Verified&apos; without performing checks. Avenra replaces subjective human memory with automated, multi-layered verification gates:
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                layer: "01",
                name: "Structural & Stream Invariants",
                description: "Verifies file format, MIME types, file size bounds, and runs ClamAV in-memory antivirus streaming to ensure zero infected or macro-containing documents enter storage.",
                type: "MANDATORY GATE",
                latency: "< 50ms",
              },
              {
                layer: "02",
                name: "Format & Identifier Validation",
                description: "Regex pattern evaluation for legal entities: Tax IDs (EIN/TIN), European VAT numbers, LEIs, SWIFT/BIC codes, passport numbers, and national identity checksum algorithms.",
                type: "MANDATORY GATE",
                latency: "< 2ms",
              },
              {
                layer: "03",
                name: "Mathematical & Balance Reconciliation",
                description: "Cross-checks numeric relationships: invoice line item totals against final invoices, cap table equity percentages summing to 100.00%, or payroll withholding tolerances.",
                type: "RECONCILIATION",
                latency: "< 5ms",
              },
              {
                layer: "04",
                name: "AI Document Intelligence Verification",
                description: "Extracts values from unstructured PDFs (W-9s, deeds, articles of incorporation) and cross-checks signatories against registered officer records without retaining document bytes.",
                type: "AI EXTRACTION",
                latency: "< 450ms",
              },
              {
                layer: "05",
                name: "Temporal & Freshness Checkpoints",
                description: "Enforces legal validity windows: utility bills must be less than 90 days old, corporate certificates of good standing within 30 days, and passports valid for at least 6 months.",
                type: "LEGAL FRESHNESS",
                latency: "< 1ms",
              },
            ].map((rule, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-border bg-background p-6 transition-all hover:border-brand/30"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-surface font-mono text-xs font-bold text-brand">
                    {rule.layer}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-text-primary">{rule.name}</h4>
                      <span className="rounded bg-canvas px-2 py-0.5 text-[9px] font-bold text-brand border border-border">
                        {rule.type}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                      {rule.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-success">
                  <CheckCircle2 className="size-4" /> Evaluates in {rule.latency}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification JSON Trace Walkthrough */}
        <div className="rounded-3xl border border-border bg-[#0d1117] p-8 md:p-12 text-[#c9d1d9] font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-[#30363d] pb-4 mb-6">
            <div>
              <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider block">
                Evidence Ledger Subsystem
              </span>
              <h3 className="text-lg font-bold text-white mt-1 font-sans">
                Sample checks-log.json Generated in Sealed Evidence Package
              </h3>
            </div>
            <span className="rounded-full bg-success/20 text-success border border-success/30 px-3 py-1 text-[11px] font-bold">
              TAMPER EVIDENT AUDIT TRACE
            </span>
          </div>

          <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#79c0ff]">
{`{
  "workId": "wrk_01HZX892KLA",
  "evaluatedAt": "2026-11-09T17:15:08.520Z",
  "overallOutcome": "PASSED",
  "totalDurationMs": 142,
  "checks": [
    {
      "checkId": "chk_clamav_antivirus",
      "ruleName": "Upload Stream Antivirus Scan",
      "targetFile": "shareholders_cap_table.xlsx",
      "outcome": "PASSED",
      "executionDurationMs": 42,
      "details": { "virusesFound": 0, "engineVersion": "ClamAV 1.5.4" }
    },
    {
      "checkId": "chk_cap_table_sum",
      "ruleName": "Equity Percentage Sum Equals 100.00%",
      "targetField": "shareholders.percentageSum",
      "outcome": "PASSED",
      "executionDurationMs": 18,
      "details": { "expected": 100.00, "actual": 100.00, "tolerance": 0.0001 }
    },
    {
      "checkId": "chk_w9_ein_format",
      "ruleName": "Federal EIN Format Validation",
      "targetField": "client.employerIdentificationNumber",
      "outcome": "PASSED",
      "executionDurationMs": 2,
      "details": { "regexPattern": "^\\\\d{2}-\\\\d{7}$", "normalizedMatch": true }
    }
  ],
  "auditSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}`}
          </pre>
        </div>

        {/* Verification Engine FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Verification Engine Architecture FAQ"
            subtitle="How automated rules, exception loops, and audit trails defend your firm from human error."
            items={VERIFICATION_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
