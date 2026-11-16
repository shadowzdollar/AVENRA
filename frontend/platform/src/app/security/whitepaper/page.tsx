"use client";

import { useState } from "react";
import {
  Key,
  Lock,
  Server,
  ShieldCheck,
  ArrowRight,
  FileText,
  Download,
  BookOpen,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function WhitepaperHeroVisual() {
  const [activeChapter, setActiveChapter] = useState<number>(0);

  const chapters = [
    {
      num: "01",
      title: "Threat Modeling & Attack Surfaces",
      summary: "STRIDE analysis of professional services data pipelines; boundary demarcation between untrusted client uploads and enterprise system of record.",
    },
    {
      num: "02",
      title: "Kernel-Level Tenant Segregation",
      summary: "Mathematical verification of PostgreSQL Row-Level Security; eliminating application-layer human error via session derivation (ADR-005).",
    },
    {
      num: "03",
      title: "Cryptographic Evidence Sealing",
      summary: "SHA-256 package compilation, S3-compatible storage export with manifest sealing, and offline POSIX auditor verification.",
    },
    {
      num: "04",
      title: "Air-Gapped AI Runtime Isolation",
      summary: "Zero data retention contracts, stateless Python microservices, strict Pydantic validation, and RAM zeroization protocols.",
    },
  ];

  const curr = chapters[activeChapter] ?? chapters[0]!;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            SECURITY WHITEPAPER INDEX
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          DOC VER: 2026.4
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-text-primary">Table of Contents (Selected Chapter)</div>
          <span className="font-mono text-xs text-emerald-400 font-bold">Chapter {curr.num}</span>
        </div>
        <h4 className="mt-2 text-sm font-bold text-text-primary">{curr.title}</h4>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">{curr.summary}</p>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {chapters.map((ch, i) => (
          <button
            key={ch.num}
            onClick={() => setActiveChapter(i)}
            className={`rounded-lg py-2 font-mono text-xs font-bold transition-colors border ${
              activeChapter === i
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            Ch {ch.num}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <FileText className="h-3.5 w-3.5 text-emerald-400" /> 42 Pages • Peer Reviewed
        </span>
        <span className="font-mono">PDF / Markdown</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Whitepaper",
    question: "Who is the primary audience for the Avenra Security Whitepaper?",
    answer: "The whitepaper is designed for Chief Information Security Officers (CISOs), Enterprise Security Architects, Compliance Officers, and Lead Security Engineers evaluating Avenra for deployment in regulated environments (banking, healthcare, legal, accounting).",
  },
  {
    category: "Peer Review",
    question: "Was the architecture in the whitepaper independently reviewed?",
    answer: "Yes. The cryptographic primitives, PostgreSQL Row-Level Security model, and air-gapped AI isolation boundaries were reviewed by independent security researchers and CREST-certified penetration testing teams.",
  },
  {
    category: "Questionnaires",
    question: "Can our infosec team submit custom SIG or CAIQ security questionnaires?",
    answer: "Yes. Our enterprise security engineering team supports completed Standard Information Gathering (SIG) Core, SIG Lite, and Cloud Security Alliance CAIQ questionnaires for qualified enterprise prospects.",
  },
  {
    category: "Updates",
    question: "How frequently is the security whitepaper updated?",
    answer: "The whitepaper is updated quarterly to incorporate new regulatory requirements (e.g. EU AI Act, DORA), updated penetration test findings, and ongoing architectural enhancements.",
  },
];

export default function SecurityWhitepaperPage() {
  return (
    <MarketingLayout
      category="Technical Publication"
      badge="Engineering Whitepaper"
      variant="security"
      title="Avenra Architecture & Security Whitepaper"
      subtitle="A detailed technical exploration of our multi-tenant PostgreSQL Row-Level Security, air-gapped AI isolation, and cryptographic evidence sealing."
      breadcrumbs={[
        { label: "Security & Trust", href: "/security" },
        { label: "Whitepaper" },
      ]}
      heroVisual={<WhitepaperHeroVisual />}
      stats={[
        { value: "40+ Pages", label: "Technical Depth", detail: "Formal architectural proofs" },
        { value: "ADR-005", label: "Isolation Protocol", detail: "PostgreSQL RLS specification" },
        { value: "ADR-019", label: "S3 Architecture", detail: "Decoupled cloud storage design" },
        { value: "ADR-021", label: "Malware Defenses", detail: "ClamAV stream pipeline" },
      ]}
      features={[
        {
          icon: ShieldCheck,
          title: "Defense-in-Depth Specification",
          description: "Explore the full layer-by-layer security model from TLS termination to database storage encryption.",
          badge: "ARCHITECTURE",
        },
        {
          icon: Lock,
          title: "Tenant Isolation Formal Proof",
          description: "Review how database session configuration variables prevent cross-tenant data leaks even under compromised application code.",
          badge: "ISOLATION",
        },
        {
          icon: Key,
          title: "Cryptographic Key Lifecycles",
          description: "Detailed protocols for AES-256-GCM envelope encryption, key rotation triggers, and zero-knowledge secret storage.",
          badge: "CRYPTO",
        },
        {
          icon: Server,
          title: "Supply Chain & CI Hardening",
          description: "All GitHub Actions pinned to immutable commit SHAs, with 7-day dependency cooldowns and automated OSV vulnerability scanning.",
          badge: "SUPPLY CHAIN",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Whitepaper Executive Summary & Download Box */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
            <div className="max-w-2xl">
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Publication Summary
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                The Invariant Systems of Record Whitepaper
              </h2>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                Download the complete architectural specification detailing how Avenra replaces probabilistic trigger chains with mathematically verified finite state machines and sovereign data storage.
              </p>
            </div>
            <a
              href="#download"
              onClick={(e) => {
                e.preventDefault();
                alert("The complete 42-page Avenra Security Whitepaper (PDF) is compiled for enterprise compliance teams. Contact security@avenra.com for instant distribution.");
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
            >
              <Download className="h-4 w-4" /> Download Whitepaper (PDF)
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <h4 className="font-bold text-text-primary text-sm">Part I: The State Model</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Formal state transition algebra, closed transition graphs, guard conditions, and database transaction atomicity proofs.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <h4 className="font-bold text-text-primary text-sm">Part II: Data Isolation</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Kernel-level PostgreSQL Row-Level Security, connection pool safety, and direct S3 presigned URL streaming mechanics.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <h4 className="font-bold text-text-primary text-sm">Part III: Compliance Proofs</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Mapping Avenra architectural controls to standard access control, encryption, and audit frameworks.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Security Whitepaper FAQ"
            subtitle="Frequently asked questions regarding whitepaper contents, independent audits, and compliance reviews."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-emerald-400">Developer Ecosystem</div>
            <div className="text-base font-bold text-text-primary">Explore Integrations & Webhook Hub</div>
          </div>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Explore Integrations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
