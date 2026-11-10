/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Database,
  HardDrive,
  Lock,
  Server,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseArchitectureDiagram } from "@/components/enterprise/EnterpriseArchitectureDiagram";
import { InteractiveApiExplorer } from "@/components/enterprise/InteractiveApiExplorer";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function ArchitectureHeroVisual() {
  const [activeTab, setActiveTab] = useState<"modules" | "verification" | "isolation">("modules");

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            SPRING MODULITH VERIFIER
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" /> 0 BOUNDARY VIOLATIONS
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setActiveTab("modules")}
          className={`flex-1 rounded-lg py-2 font-mono text-xs transition-colors border ${
            activeTab === "modules"
              ? "bg-indigo-500 text-white border-indigo-500 font-bold"
              : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
          }`}
        >
          Domain Modules (6)
        </button>
        <button
          onClick={() => setActiveTab("verification")}
          className={`flex-1 rounded-lg py-2 font-mono text-xs transition-colors border ${
            activeTab === "verification"
              ? "bg-indigo-500 text-white border-indigo-500 font-bold"
              : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
          }`}
        >
          Boundary Test
        </button>
        <button
          onClick={() => setActiveTab("isolation")}
          className={`flex-1 rounded-lg py-2 font-mono text-xs transition-colors border ${
            activeTab === "isolation"
              ? "bg-indigo-500 text-white border-indigo-500 font-bold"
              : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
          }`}
        >
          Tenant Session
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-black/60 p-4 font-mono text-xs text-indigo-300">
        {activeTab === "modules" && (
          <div className="space-y-2 text-[11px]">
            <div className="text-text-tertiary"># Explicit Java 25 Domain Packages</div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>avenra.identity</span>
              <span className="text-text-tertiary">Session / RBAC / MagicLink</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>avenra.work</span>
              <span className="text-text-tertiary">FSM / Deliverable Core</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>avenra.information</span>
              <span className="text-text-tertiary">Client Gathering & Portals</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>avenra.verification</span>
              <span className="text-text-tertiary">Rule Gates / AI Bridge</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>avenra.evidence</span>
              <span className="text-text-tertiary">SHA-256 Manifest / S3 Export</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>avenra.audit</span>
              <span className="text-text-tertiary">Append-Only Event Ledger</span>
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="space-y-3">
            <div className="relative h-28 w-full overflow-hidden rounded-lg">
              <img src="/images/how-it-works/spring-modulith.jpg"
                alt="Spring Modulith Analysis"
                className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white uppercase tracking-wider">
                Spring Modulith 1.3 · Compile-Time Boundary Proof
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-canvas-subtle p-2 rounded-lg border border-border">
                <span className="text-text-tertiary block text-[10px]">Domain Modules</span>
                <span className="font-bold text-emerald-400">6 Discovered</span>
              </div>
              <div className="bg-canvas-subtle p-2 rounded-lg border border-border">
                <span className="text-text-tertiary block text-[10px]">Circular Dependencies</span>
                <span className="font-bold text-emerald-400">0 Invariant Pass</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "isolation" && (
          <div className="space-y-3">
            <div className="relative h-28 w-full overflow-hidden rounded-lg">
              <img src="/images/how-it-works/kernel-rls.jpg"
                alt="PostgreSQL Kernel Tenant Isolation"
                className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white uppercase tracking-wider">
                PostgreSQL 18 Kernel RLS Enforced
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-canvas-subtle p-2 rounded-lg border border-border">
                <span className="text-text-tertiary block text-[10px]">Client Headers</span>
                <span className="font-bold text-amber-400">Stripped by Reverse Proxy</span>
              </div>
              <div className="bg-canvas-subtle p-2 rounded-lg border border-border">
                <span className="text-text-tertiary block text-[10px]">Session Context</span>
                <span className="font-bold text-emerald-400">SET LOCAL Verified</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Monolith Safety with Microservice Boundaries
        </span>
        <span className="font-mono">ADR-002 Certified</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Architecture",
    question: "Why choose a Modular Monolith instead of distributed Microservices?",
    answer: "Microservices introduce distributed transaction failure modes (2PC, saga rollbacks), network latency serialization overhead, and eventual consistency dilemmas that are unacceptable for legal and financial compliance workflows. Spring Modulith enforces microservice-grade boundaries at compile time through ArchUnit while running within a single transactional boundary that guarantees atomic rollbacks.",
  },
  {
    category: "Security",
    question: "How does Avenra prevent tenant data leakage at the architectural layer?",
    answer: "We adhere strictly to ADR-005. Client headers like `X-Tenant-Id` are stripped and discarded by the API gateway. The tenant ID is derived exclusively from the cryptographically verified JWT / session cookie. Upon establishing a connection pool session, Spring issues `SET LOCAL app.current_tenant_id = :tenantId`, binding all subsequent PostgreSQL queries to database-level Row-Level Security (RLS) policies.",
  },
  {
    category: "AI Service",
    question: "Why is the AI worker written in Python while the system of record is in Java?",
    answer: "Python provides the richest ecosystem for machine learning, OCR, and document parsing (PyMuPDF, Pydantic, Docling). However, the Python service is completely stateless and air-gapped from direct database access. It only accepts file streams and JSON schemas over internal mTLS, returns structured extracted data, and immediately wipes RAM.",
  },
  {
    category: "Contracts",
    question: "How do you ensure the Next.js frontend and Java backend stay perfectly in sync?",
    answer: "We follow ADR-008 contract-first design. All endpoints are defined in OpenAPI v1 specification files in `packages/contracts`. TypeScript types and client SDKs are auto-generated from this schema during the build, guaranteeing that breaking API changes cause compile-time failures in both web and backend repositories.",
  },
];

export default function ArchitectureDeepDivePage() {
  return (
    <MarketingLayout
      category="Engineering Blueprint"
      badge="Full Stack Specification"
      variant="how-it-works"
      title="The Avenra System Architecture"
      subtitle="An uncompromising technical breakdown: Java 25 modular monolith system of record, Next.js client, stateless Python AI reader, and PostgreSQL 18 Row-Level Security."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "System Architecture" },
      ]}
      heroVisual={<ArchitectureHeroVisual />}
      stats={[
        { value: "Java 25", label: "System of Record", detail: "Spring Boot 4 modular monolith" },
        { value: "Next.js", label: "Web Client", detail: "App Router & Turbopack" },
        { value: "Python 3.14", label: "AI Worker", detail: "Stateless FastAPI service" },
        { value: "PostgreSQL 18", label: "Database", detail: "Native Row-Level Security" },
      ]}
      features={[
        {
          icon: Server,
          title: "Modular Monolith Backend",
          description: "Built on Spring Modulith. Explicit module boundaries (identity, work, verification, information, billing, audit) prevent spaghetti architecture.",
          badge: "ADR-001",
        },
        {
          icon: Lock,
          title: "Contract-First OpenAPI v1",
          description: "All client-server contracts are strictly defined in `packages/contracts` using OpenAPI v1 specs before any controller or UI code is written.",
          badge: "ADR-008",
        },
        {
          icon: Database,
          title: "Server-Set Tenant Context",
          description: "Tenant context is derived strictly from the authenticated session. Client-supplied tenant headers are discarded.",
          badge: "ADR-005",
        },
        {
          icon: HardDrive,
          title: "S3-Compatible Object Store",
          description: "Evidence archives and client uploads live in SeaweedFS S3 storage with SHA-256 integrity checks and completion manifest sealing.",
          badge: "ADR-007",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Architectural Principles Breakdown */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Design Tenets
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Engineered for Auditability, Correctness, and Zero Drift
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Unlike typical SaaS products built as brittle trigger pipelines or chaotic microservice meshes,
              Avenra was architected from the foundation as an immutable system of record.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm">Compile-Time Boundary Enforcement</h3>
                  <span className="font-mono text-[11px] text-text-tertiary">Spring Modulith & ArchUnit</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Module boundaries are verified during unit testing. If the `work` module attempts to import internal classes from `billing` or execute unauthorized direct queries, the build fails immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm">Kernel-Enforced Tenant Isolation</h3>
                  <span className="font-mono text-[11px] text-text-tertiary">PostgreSQL Row-Level Security</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Developers cannot accidentally leak data across organizations by forgetting a `WHERE tenant_id = :id` clause. PostgreSQL rejects queries that do not match the session-level tenant context.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Architecture Topology */}
        <div>
          <EnterpriseArchitectureDiagram />
        </div>

        {/* Interactive Contract Explorer */}
        <div>
          <InteractiveApiExplorer />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="System Architecture FAQ"
            subtitle="Deep engineering answers on deployment topology, Java 25 performance, and data layer isolation."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Intent Capture & Ingestion Pipelines</div>
          </div>
          <Link
            href="/how-it-works/intent-capture"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Intent Capture <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
