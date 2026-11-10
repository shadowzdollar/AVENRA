"use client";

import { useState } from "react";
import {
  Database,
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function TenantIsolationHeroVisual() {
  const [spoofHeader, setSpoofHeader] = useState<boolean>(true);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            POSTGRESQL RLS KERNEL PROOF
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          ADR-005 ISOLATION
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">Simulate Spoofed Tenant Header</span>
          <button
            onClick={() => setSpoofHeader(!spoofHeader)}
            className={`rounded-lg px-3 py-1 font-mono text-xs transition-colors ${
              spoofHeader ? "bg-red-500 text-white" : "bg-border text-text-secondary"
            }`}
          >
            {spoofHeader ? "Attack Header Active" : "No Attack Header"}
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-black/70 p-3 font-mono text-[11px] text-emerald-300 border border-white/5 space-y-1">
          <div className="text-text-tertiary"># Incoming HTTP Request Envelope</div>
          <div>GET /api/v1/work/wrk_9912 HTTP/1.1</div>
          <div>Cookie: session=sec_jwt_tenant_alpha_912</div>
          {spoofHeader && (
            <div className="text-red-400 font-bold">X-Tenant-Id: tenant_malicious_hacker_999 ⚠️</div>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Gateway Invariant: Spoofed Header Discarded
          </div>
          <p className="mt-1 text-[11px] text-text-secondary">
            Tenant ID derived solely from verified server session: <span className="font-mono text-text-primary">tenant_alpha_912</span>.
          </p>
        </div>

        <div className="mt-3 rounded-lg bg-black/70 p-3 font-mono text-[11px] text-indigo-300 border border-white/5">
          <div className="text-text-tertiary text-[10px] mb-1"># Kernel SQL Execution</div>
          <pre className="overflow-x-auto whitespace-pre font-mono">{`SET LOCAL app.current_tenant_id = 'tenant_alpha_912';
SELECT * FROM work_items WHERE id = 'wrk_9912';
-- Rows returned: 1 (Isolated to tenant_alpha_912)`}</pre>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Mathematical Guarantee
        </span>
        <span className="font-mono">Zero Cross-Tenant Leaks</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Architecture",
    question: "Why is relying on application-layer WHERE clauses considered dangerous?",
    answer: "In systems without database Row-Level Security, multi-tenancy depends on every developer remembering to write `WHERE tenant_id = :id` on every query, join, and update. Over thousands of lines of code and hundreds of API endpoints, a single missing WHERE clause in an obscure report query exposes sensitive customer data. Avenra moves this guarantee to the database kernel.",
  },
  {
    category: "Connection Pooling",
    question: "Does HikariCP connection pooling cause tenant context bleeding between requests?",
    answer: "No. Avenra uses `SET LOCAL app.current_tenant_id = :orgId` inside each transactional connection. In PostgreSQL, `SET LOCAL` is transaction-scoped: as soon as the transaction commits or rolls back, the variable is immediately cleared, eliminating connection pool state leakage.",
  },
  {
    category: "Performance",
    question: "Does PostgreSQL Row-Level Security introduce a performance penalty?",
    answer: "No. PostgreSQL treats RLS policies as additional query filters during query planning. Because all tenant tables include composite primary or secondary indexes on `(organization_id, id)`, the query planner executes index scans with zero detectable overhead compared to manual WHERE clauses.",
  },
  {
    category: "CI Verification",
    question: "How do you test that RLS policies cannot be bypassed?",
    answer: "Our automated CI test suite executes explicit negative integration tests: it authenticates as Tenant A and attempts to read, modify, and delete IDs belonging to Tenant B across every table. The build fails if any query returns rows or modifies records.",
  },
];

export default function TenantIsolationPage() {
  return (
    <MarketingLayout
      category="Security Architecture"
      badge="ADR-005 Isolation Authority"
      variant="security"
      title="Multi-Tenant Row-Level Security (RLS)"
      subtitle="How Avenra enforces mathematical tenant isolation at the database layer. No relying on buggy application-level WHERE clauses."
      breadcrumbs={[
        { label: "Security & Trust", href: "/security" },
        { label: "Tenant Isolation" },
      ]}
      heroVisual={<TenantIsolationHeroVisual />}
      stats={[
        { value: "PostgreSQL RLS", label: "Isolation Mechanism", detail: "Enforced inside SQL execution engine" },
        { value: "0 Trust", label: "Client Headers", detail: "Tenant ID set strictly by session" },
        { value: "100%", label: "Table Coverage", detail: "Every tenant table has RLS policy" },
        { value: "Automated", label: "Isolation Tests", detail: "CI verifies cross-tenant denial" },
      ]}
      features={[
        {
          icon: Lock,
          title: "Session-Bound Tenant Variables",
          description: "When a request is authenticated, the backend opens a database transaction and executes `SET LOCAL app.current_organization_id = :orgId`.",
          badge: "KERNEL LEVEL",
        },
        {
          icon: ShieldCheck,
          title: "Unbypassable RLS Policies",
          description: "PostgreSQL rejects any `SELECT`, `UPDATE`, or `DELETE` query that attempts to touch rows outside the active session tenant ID.",
          badge: "POLICY",
        },
        {
          icon: Database,
          title: "Dedicated Tenant Storage Prefixes",
          description: "In the S3 evidence locker, each organization writes only to its own isolated bucket key prefix with presigned token enforcement.",
          badge: "S3 ISOLATION",
        },
        {
          icon: ShieldAlert,
          title: "Rigorous CI Isolation Tests",
          description: "Every pull request runs automated security test suites that explicitly attempt cross-tenant access and assert 404/403 denials.",
          badge: "CI TESTED",
        },
      ]}
    >
      <div className="space-y-20">
        {/* PostgreSQL DDL Schema Enforcement */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
              DDL Implementation
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              PostgreSQL Row-Level Security Policy Definition
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              The exact SQL migration script used in production to guarantee that no unauthenticated query or cross-tenant query can execute.
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-black/70 p-6 font-mono text-xs text-emerald-300 border border-white/5 overflow-x-auto">
            <pre>{`-- Enable and FORCE Row-Level Security (applies to table owners too)
ALTER TABLE work ENABLE ROW LEVEL SECURITY;
ALTER TABLE work FORCE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY tenant_isolation_work ON work
    AS RESTRICTIVE
    USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::UUID)
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::UUID);

-- Audit Ledger Isolation Policy
ALTER TABLE work_audit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_audit_ledger FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_audit ON work_audit_ledger
    AS RESTRICTIVE
    USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::UUID);`}</pre>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Tenant Isolation FAQ"
            subtitle="Deep engineering answers on database isolation, connection pooling hygiene, and multi-tenant security."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-emerald-400">Next Security Subsystem</div>
            <div className="text-base font-bold text-text-primary">Cryptography, Envelope Encryption & Proofs</div>
          </div>
          <Link
            href="/security/cryptography"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Explore Cryptography <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
