"use client";

import {
  FileSearch,
  Lock,
  Scan,
  ShieldCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { VisualDocumentScannerMockup } from "@/components/enterprise/VisualDocumentScannerMockup";
import { EnterpriseSectionImage } from "@/components/enterprise/EnterpriseImageCard";

const AI_DOC_FAQS = [
  {
    category: "AI Safety",
    question: "Why does Avenra treat all AI output as untrusted external input?",
    answer: "In professional legal, financial, and tax workflows, hallucinated numbers or missed clauses carry multi-million dollar liabilities. In Avenra, the AI engine is never granted direct write authority to alter database state or approve deliverables. Its extracted fields are treated with the exact same skepticism as user-submitted input: every field must pass downstream deterministic verification rules, regex sanity checks, and operator review.",
    technicalDetails: "Zero privilege escalation. AI service outputs Pydantic-validated JSON DTOs that are rejected if confidence scores fall below configurable thresholds.",
  },
  {
    category: "Zero Persistence",
    question: "How does the air-gapped Python AI sandbox guarantee zero data retention?",
    answer: "The `apps/ai` service is a stateless Python 3.14 FastAPI application running in an isolated container without a database connection or permanent disk volume. When a document is analyzed, bytes stream through RAM memory buffers, are parsed, and the buffer is immediately deallocated. Nothing is written to temp files or persistent logs.",
    technicalDetails: "Verified by container isolation profiles: read-only root filesystem, no attached persistent volumes, and mutual TLS token authentication (ADR-006).",
  },
  {
    category: "Model Choice",
    question: "Which models power Avenra's Document Intelligence and how is it isolated?",
    answer: "Avenra uses a provider-agnostic interface (ADR-003, ADR-029). The AI service runs as a stateless Python worker that parses inbound PDF streams, extracts structured fields using Pydantic models, and returns advisory data to the core API. AI reading is off by default until an organization owner explicitly turns it on (ADR-030).",
    technicalDetails: "Switchable via environment variables (`AI_PROVIDER=anthropic` or `fake` for local/CI). Zero code changes required.",
  },
];

export default function DocumentIntelligencePage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Stateless AI Inference"
      title="Privacy-First Document Intelligence"
      subtitle="Extract structured business data from client PDFs, spreadsheets, and scanned contracts with zero data retention and strict schema enforcement."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Document Intelligence" },
      ]}
      heroVisual={<VisualDocumentScannerMockup />}
      stats={[
        { value: "0 Days", label: "Model Retention", detail: "Zero training on your client data" },
        { value: "Schema-Bound", label: "Structured Output", detail: "Validated against Pydantic models" },
        { value: "Stateless", label: "AI Worker", detail: "Isolated Python microservice" },
        { value: "PDF & Images", label: "Multi-Format", detail: "OCR, scans, tables, and forms" },
      ]}
      features={[
        {
          icon: FileSearch,
          title: "Structured Schema Extraction",
          description: "Transform unstructured agreements, tax forms, and bank letters into typed JSON validated against strict schemas.",
          badge: "SCHEMA",
        },
        {
          icon: Lock,
          title: "Zero Data Ownership",
          description: "Our AI service stores no files or business records. It processes memory buffers and returns parsed JSON to the Spring Boot core.",
          badge: "AIR-GAPPED",
        },
        {
          icon: ShieldCheck,
          title: "Model Output is Not Authorization",
          description: "AI-extracted data is treated as untrusted external input. It must pass verification checks before affecting work state.",
        },
        {
          icon: Scan,
          title: "Native OCR & Table Parsing",
          description: "Handles skewed scans, low-resolution camera uploads, and multi-page nested financial statement tables.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Pipeline Architecture Breakdown */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Extraction Architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              How the Air-Gapped AI Pipeline Operates
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Unlike generic chatbot integrations that dump your sensitive client files into cloud vector databases, Avenra enforces a unidirectional, zero-persistence extraction lifecycle:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-brand">STEP 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">In-Memory Stream</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Document bytes stream directly from S3 or client upload over encrypted mTLS into ephemeral RAM. No temporary disk writing.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-brand">STEP 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Table & Text OCR</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Computer vision models identify document bounding boxes, key-value coordinate pairs, and nested tabular row structures.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-brand">STEP 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Schema Coercion</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Values are coerced into strict Pydantic DTOs. If required fields fail type or confidence thresholds, an error is returned.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-brand">STEP 04</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">RAM Destruction</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Extracted JSON is returned to the Java core. Memory buffers are immediately overwritten and destroyed. Zero residual data.
              </p>
            </div>
          </div>
        </div>

        {/* Python Pydantic Model Visual */}
        <div className="mt-8">
          <EnterpriseSectionImage
            src="/images/platform/document-intelligence.jpg"
            alt="Air-Gapped Document Intelligence & Typed Extraction"
            badge="Typed AI Extraction"
            title="Air-Gapped Document Intelligence & Typed Extraction"
            description="Unstructured legal PDFs, tax documents, and financial schedules are ingested through PyMuPDF and parsed strictly into verified, deterministic schemas without model hallucinations."
            bullets={[
              "Air-gapped OCR and parsing with zero retention or training on third-party models",
              "Pydantic v2 schemas reject malformed dates, mismatched EIN formats, or missing signatures",
              "Confidence scoring triggers human partner review whenever ambiguities arise",
              "Verified extractions feed directly into the deterministic verification rules engine",
            ]}
          />
        </div>

        {/* AI FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Document Intelligence & AI Privacy FAQ"
            subtitle="Understand our zero-training architecture, model options, and safety guardrails."
            items={AI_DOC_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
