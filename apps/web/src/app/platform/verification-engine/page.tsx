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
import { EnterpriseImageCard, EnterpriseSectionImage } from "@/components/enterprise/EnterpriseImageCard";

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
    <EnterpriseImageCard
      src="/images/platform/verification-engine.jpg"
      alt="Avenra Verification Engine Rule Evaluator"
      title="Deterministic Rule Evaluation"
      subtitle="Sub-millisecond verification rules evaluated with zero hallucinations"
      badge="ALL RULES PASSED"
      badgeVariant="success"
      highlights={[
        { label: "Execution Mode", value: "Deterministic" },
        { label: "Malware Scan", value: "ClamAV 1.5.4" },
        { label: "Audit Trace", value: "Tamper-Evident" },
      ]}
    />
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

        {/* Verification Evidence Ledger Walkthrough */}
        <div className="mt-8">
          <EnterpriseSectionImage
            src="/images/platform/verification-ledger.jpg"
            alt="Sample checks-log.json Generated in Sealed Evidence Package"
            badge="Tamper-Evident Audit Trace"
            title="Sample checks-log.json Sealed Trace"
            description="Every verification check records its millisecond duration, deterministic input parameters, exact engine version, and cryptographic hash directly into the sealed evidence package."
            bullets={[
              "Stream antivirus analysis scans payload before committing to persistent storage",
              "Mathematical invariants checked without probabilistic large language model drift",
              "Individual check outcomes stamped with ISO 8601 UTC microsecond timestamps",
              "100% offline verifiable by independent auditors and regulators without cloud dependencies",
            ]}
          />
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
