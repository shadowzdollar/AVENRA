"use client";

import { useState } from "react";
import {
  Bot,
  Lock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Key,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function HumanInTheLoopHeroVisual() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [operatorNote, setOperatorNote] = useState("Tax ID matches historical merger entity documentation.");

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            OPERATOR APPROVAL GATEWAY
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400 border border-amber-500/20">
          <AlertTriangle className="h-3 w-3" /> EXCEPTION: LOW AI CONFIDENCE
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-text-primary">Entity EIN Reconciliation</div>
          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
            AI Score: 87.2% (Threshold: 95.0%)
          </span>
        </div>
        <p className="mt-2 text-xs text-text-secondary leading-relaxed">
          AI detected potential discrepancy between scanned Delaware Certificate and Schedule K-1 company suffix (&quot;LLC&quot; vs &quot;L.L.C.&quot;).
        </p>

        <div className="mt-3 rounded-lg bg-black/60 p-3 font-mono text-[11px] text-indigo-300 border border-white/5 space-y-1">
          <div><strong className="text-text-tertiary">Scanned Text:</strong> &quot;Northwind Partners, L.L.C.&quot;</div>
          <div><strong className="text-text-tertiary">Intake Entity:</strong> &quot;Northwind Partners LLC&quot;</div>
          <div className="text-amber-400">Action Required: Explicit Human Verification</div>
        </div>

        {status === "pending" ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[10px] font-mono text-text-tertiary uppercase">Operator Justification Note</label>
              <input
                type="text"
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-text-primary focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus("approved")}
                className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
              >
                Approve & Advance State
              </button>
              <button
                onClick={() => setStatus("rejected")}
                className="flex-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 py-2 text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                Reject to Client
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`mt-4 rounded-lg p-3 text-xs font-mono border ${
              status === "approved"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            <div className="font-bold">
              {status === "approved" ? "✓ APPROVED BY OPERATOR" : "✕ REJECTED BY OPERATOR"}
            </div>
            <div className="text-[10px] text-text-secondary mt-1">
              Actor: Engagement Partner • Key: `work.override` • Timestamp: 2026-11-09T17:35:12Z
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <Key className="h-3.5 w-3.5 text-indigo-400" /> Explicit Permission: work.override
        </span>
        <span className="font-mono">Audit Trail Logged</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Governance",
    question: "Can an AI agent ever advance a work item to COMPLETED autonomously?",
    answer: "Never. Under ADR-009, AI is strictly classified as an untrusted advisory subsystem. AI can parse documents, calculate reconciliations, and propose transitions, but advancing state past verification to final sealed completion requires an operator with the explicit `work.approve` capability.",
  },
  {
    category: "Liability",
    question: "How does human-in-the-loop protect firms from malpractice liability?",
    answer: "In professional legal and accounting malpractice claims, relying on autonomous AI output exposes firms to gross negligence allegations. Avenra creates an immutable evidentiary record showing that a qualified licensed practitioner inspected the exception, recorded reasoning, and verified the outcome.",
  },
  {
    category: "Dual-Key",
    question: "Can we require two independent operators to approve high-value transactions?",
    answer: "Yes. For deliverables exceeding configured monetary or risk thresholds (e.g. wire instructions or filings over $1M), Avenra supports Dual-Key Authorization: two distinct operators with appropriate RBAC roles must independently review and sign before the evidence locker is sealed.",
  },
  {
    category: "Delegation",
    question: "What happens if an assigned operator is on annual leave?",
    answer: "Work items can be escalated or reassigned to designated team deputies according to your firm's SLA routing rules, with full transfer audit logging.",
  },
];

export default function HumanInTheLoopPage() {
  return (
    <MarketingLayout
      category="Safety Architecture"
      badge="Autonomous Boundaries"
      variant="how-it-works"
      title="Human-in-the-Loop Safeguards"
      subtitle="How Avenra harnesses AI and autonomous execution while guaranteeing that authorized humans hold absolute veto and approval power over critical actions."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "Human-in-the-Loop" },
      ]}
      heroVisual={<HumanInTheLoopHeroVisual />}
      stats={[
        { value: "Mandatory", label: "Approval Gates", detail: "Sensitive actions require human review" },
        { value: "0", label: "Blind Execution", detail: "No AI writes directly to customer DB" },
        { value: "Explicit", label: "Permissions", detail: "Checked via `work.approve`" },
        { value: "Audit-Bound", label: "Human Decision", detail: "Operator identity permanently logged" },
      ]}
      features={[
        {
          icon: UserCheck,
          title: "The Approvals Inbox",
          description: "All agent actions, deliverable sign-offs, and critical exceptions route to a unified approvals dashboard.",
          badge: "INBOX",
        },
        {
          icon: Bot,
          title: "AI Proposes; Humans Decide",
          description: "AI extracts schema fields, drafts responses, and calculates checks, but cannot advance work state without operator approval.",
          badge: "PROPOSE ONLY",
        },
        {
          icon: Lock,
          title: "Granular Capabilities",
          description: "Only team members with specific capabilities (e.g. `work.approve`) can clear gates or approve deliverables.",
          badge: "CAPABILITIES",
        },
        {
          icon: ShieldCheck,
          title: "Full Decision Provenance",
          description: "The audit ledger records the exact operator, timestamp, and review commentary for every approval.",
          badge: "PROVENANCE",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Core RBAC & Boundary Model */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Governance Architecture
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Strict Capability-Based Authorization
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Avenra replaces loose user roles with fine-grained capabilities verified at the API controller layer and state machine guards.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-5">
              <span className="font-mono text-xs font-bold text-indigo-400">work.read</span>
              <h4 className="mt-1 text-sm font-bold text-text-primary">Viewer Access</h4>
              <p className="mt-2 text-xs text-text-secondary">Inspect work item state, view client submissions, read audit history.</p>
            </div>
            <div className="rounded-2xl border border-border bg-canvas-subtle p-5">
              <span className="font-mono text-xs font-bold text-indigo-400">work.propose</span>
              <h4 className="mt-1 text-sm font-bold text-text-primary">Associate / AI</h4>
              <p className="mt-2 text-xs text-text-secondary">Submit draft deliverables, run extraction models, queue verification checks.</p>
            </div>
            <div className="rounded-2xl border border-border bg-canvas-subtle p-5">
              <span className="font-mono text-xs font-bold text-emerald-400">work.approve</span>
              <h4 className="mt-1 text-sm font-bold text-text-primary">Senior Practitioner</h4>
              <p className="mt-2 text-xs text-text-secondary">Review exceptions, approve verification gates, trigger evidence package sealing.</p>
            </div>
            <div className="rounded-2xl border border-border bg-canvas-subtle p-5">
              <span className="font-mono text-xs font-bold text-amber-400">work.override</span>
              <h4 className="mt-1 text-sm font-bold text-text-primary">Managing Partner</h4>
              <p className="mt-2 text-xs text-text-secondary">Bypass advisory warnings, amend audit comments, reassign sensitive matters.</p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Human-in-the-Loop Governance FAQ"
            subtitle="Deep engineering answers on capability enforcement, decision provenance, and liability boundaries."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Idempotency & Distributed Locks</div>
          </div>
          <Link
            href="/how-it-works/idempotency"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Idempotency & Locks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
