"use client";

import { useState } from "react";
import {
  GitBranch,
  Lock,
  Workflow,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Code2,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveStateMachine } from "@/components/enterprise/InteractiveStateMachine";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function StateTransitionHeroVisual() {
  const [selectedFrom, setSelectedFrom] = useState("DRAFT");
  const [selectedTo, setSelectedTo] = useState("VERIFYING");

  const matrix: Record<string, Record<string, { valid: boolean; reason: string; guard: string }>> = {
    DRAFT: {
      AWAITING_INPUT: { valid: true, reason: "Valid intake dispatch", guard: "Required field schema compiled" },
      VERIFYING: { valid: false, reason: "Forbidden: Cannot skip information gathering", guard: "Violation of Invariant INV-01" },
      COMPLETED: { valid: false, reason: "Forbidden: Cannot bypass verification and evidence sealing", guard: "Violation of Invariant INV-04" },
    },
    AWAITING_INPUT: {
      DRAFT: { valid: false, reason: "Forbidden: Historical rollback not permitted", guard: "Forward-only monotonic sequence" },
      VERIFYING: { valid: true, reason: "Valid client upload batch received", guard: "All required documents marked present" },
      COMPLETED: { valid: false, reason: "Forbidden: Must pass verification rule gates", guard: "Violation of Invariant INV-02" },
    },
    VERIFYING: {
      AWAITING_INPUT: { valid: true, reason: "Verification failed: Reject back to client with reason", guard: "Rejection note attached" },
      COMPLETED: { valid: true, reason: "All rule checks passed & evidence sealed", guard: "Verification score == 100 && ClamAV clean" },
      DRAFT: { valid: false, reason: "Forbidden: Illegal state reset", guard: "Direct reset prohibited" },
    },
  };

  const outcome = matrix[selectedFrom]?.[selectedTo] ?? {
    valid: false,
    reason: "Illegal transition not in state graph",
    guard: "Finite State Machine constraint rejection",
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            STATE TRANSITION GUARD ENGINE
          </span>
        </div>
        <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-400 border border-indigo-500/20">
          STRICT FSM EVALUATOR
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            From State
          </label>
          <div className="mt-2 space-y-1.5">
            {["DRAFT", "AWAITING_INPUT", "VERIFYING"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedFrom(st)}
                className={`w-full rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors ${
                  selectedFrom === st
                    ? "bg-indigo-500 text-white font-bold"
                    : "bg-canvas border border-border text-text-secondary hover:bg-canvas-subtle"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            Target Next State
          </label>
          <div className="mt-2 space-y-1.5">
            {["AWAITING_INPUT", "VERIFYING", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedTo(st)}
                className={`w-full rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors ${
                  selectedTo === st
                    ? "bg-indigo-500 text-white font-bold"
                    : "bg-canvas border border-border text-text-secondary hover:bg-canvas-subtle"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`mt-5 rounded-xl border p-4 ${
          outcome.valid
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}
      >
        <div className="flex items-center gap-2">
          {outcome.valid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <span
            className={`font-mono text-xs font-bold ${
              outcome.valid ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {outcome.valid ? "TRANSITION PERMITTED (200 OK)" : "TRANSITION REJECTED (422 UNPROCESSABLE)"}
          </span>
        </div>
        <p className="mt-2 text-xs text-text-secondary">{outcome.reason}</p>
        <div className="mt-2 rounded bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-text-tertiary">
          Guard Condition: <span className="text-text-primary">{outcome.guard}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-indigo-400" /> PostgreSQL Constraint Enforcement
        </span>
        <span className="font-mono">ADR-001 §4.2</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Correctness",
    question: "Why use a formal Finite State Machine instead of simple boolean database flags?",
    answer: "Boolean flags (e.g. `is_approved`, `is_collected`, `is_verified`) create combinatorial explosion. With 5 booleans, a system has 32 potential states, most of which are mathematically invalid (e.g. `is_approved = true` but `is_collected = false`). A finite state machine restricts the deliverable to a strictly enumerated set of mutually exclusive states with explicit valid transitions.",
  },
  {
    category: "Concurrency",
    question: "How does Avenra prevent race conditions if two events arrive simultaneously?",
    answer: "State transitions execute within serializable PostgreSQL transactions using pessimistic row-level locking (`SELECT ... FOR UPDATE`). If two requests attempt to transition the same deliverable simultaneously, the second transaction is queued; once evaluated, its precondition checks against the updated state and rejects if the transition is no longer valid.",
  },
  {
    category: "Auditability",
    question: "How is the state history verified during compliance audits?",
    answer: "Every transition inserts a row into the immutable `state_transition_log` table within the same transaction. The row records the previous state, new state, trigger event, actor identity, client IP, and a cryptographic HMAC signature. If the audit insert fails, the state transition rolls back entirely.",
  },
  {
    category: "Recovery",
    question: "What happens if a background worker crashes mid-transition?",
    answer: "Because database transactions are atomic, any crash or container termination rolls back the database to the prior clean state. The work item remains safely in its previous state with a lease expiration timestamp, allowing a peer worker to reclaim and process the item cleanly via SKIP LOCKED.",
  },
];

export default function StateMachinesPage() {
  return (
    <MarketingLayout
      category="Core Architectural Principle"
      badge="ADR-001 & Invariant Safety"
      variant="how-it-works"
      title="Deterministic State Machines vs. Fragile Trigger Loops"
      subtitle="Why professional services firms cannot trust business deliverables to Zapier-style triggers, and how finite state machines provide mathematical correctness."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "State Machines" },
      ]}
      heroVisual={<StateTransitionHeroVisual />}
      stats={[
        { value: "0", label: "Invalid Transitions", detail: "Strict transition table validation" },
        { value: "100%", label: "Transactional Rollback", detail: "Atomic PostgreSQL commit" },
        { value: "Audit-Bound", label: "State Steps", detail: "Previous state & next state logged" },
        { value: "Deterministic", label: "Preconditions", detail: "Must satisfy guards to advance" },
      ]}
      features={[
        {
          icon: Workflow,
          title: "Closed Transition Graphs",
          description: "Every state has explicit allowed next states. It is physically impossible to jump directly from PENDING to COMPLETED without passing verification.",
          badge: "FORMAL",
        },
        {
          icon: Lock,
          title: "Precondition Guard Gates",
          description: "Transitions check required fields, client approvals, and document freshness at the moment of evaluation.",
          badge: "GUARDS",
        },
        {
          icon: GitBranch,
          title: "Atomic State Commits",
          description: "State changes execute inside isolated database transactions. If an audit event fails to write, the transition aborts.",
        },
        {
          icon: ShieldCheck,
          title: "Reconciliation & Recovery",
          description: "If an external service times out, the work state remains cleanly paused, allowing instant safe retries.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Deep Dive Section: Why Trigger Chains Break */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Root Cause Analysis
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              The Combinatorial Disaster of Unconstrained Triggers
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Traditional integration platforms operate on asynchronous triggers (&quot;When X, do Y&quot;).
              In an enterprise environment handling financial audits, legal filings, or medical claims,
              independent trigger workflows quickly produce irreversible state desynchronization.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="text-red-400 font-bold text-sm mb-2">Unbounded Execution Paths</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                If 4 events occur in slightly different timing due to network latency, a trigger-based system can enter 24 different permutation states, leading to corrupt client records.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="text-red-400 font-bold text-sm mb-2">No Central Preconditions</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                An email trigger can notify a client that a binder is &quot;Ready for Signing&quot; even though a critical tax schedule was rejected by compliance 3 seconds earlier.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="text-red-400 font-bold text-sm mb-2">Irreversible Half-Actions</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                When step 3 fails, steps 1 and 2 cannot be rolled back. Records are stranded, requiring manual database surgery by expensive engineering staff.
              </p>
            </div>
          </div>
        </div>

        {/* The Transition Matrix Table */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Formal Specification
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                The Avenra Core State Transition Matrix
              </h2>
            </div>
            <span className="font-mono text-xs text-text-tertiary">Table: work_item_transitions</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-tertiary uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">From State</th>
                  <th className="py-3 px-4">Trigger / Event</th>
                  <th className="py-3 px-4">Guard Condition</th>
                  <th className="py-3 px-4">Target State</th>
                  <th className="py-3 px-4">Postcondition Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                <tr className="hover:bg-canvas-subtle">
                  <td className="py-3.5 px-4 font-bold text-text-primary">DRAFT</td>
                  <td className="py-3.5 px-4 text-indigo-400">DISPATCH_INTAKE</td>
                  <td className="py-3.5 px-4 text-text-secondary font-sans">Requirements schema validated & non-empty</td>
                  <td className="py-3.5 px-4 font-bold text-amber-400">AWAITING_INPUT</td>
                  <td className="py-3.5 px-4 text-text-tertiary font-sans">Issue magic link token, schedule escalation cron</td>
                </tr>
                <tr className="hover:bg-canvas-subtle">
                  <td className="py-3.5 px-4 font-bold text-amber-400">AWAITING_INPUT</td>
                  <td className="py-3.5 px-4 text-indigo-400">CLIENT_SUBMITTED</td>
                  <td className="py-3.5 px-4 text-text-secondary font-sans">All mandatory requirement slots filled & non-zero bytes</td>
                  <td className="py-3.5 px-4 font-bold text-cyan-400">VERIFYING</td>
                  <td className="py-3.5 px-4 text-text-tertiary font-sans">Queue ClamAV virus scan + deterministic rule engine</td>
                </tr>
                <tr className="hover:bg-canvas-subtle">
                  <td className="py-3.5 px-4 font-bold text-cyan-400">VERIFYING</td>
                  <td className="py-3.5 px-4 text-emerald-400">VERIFICATION_PASSED</td>
                  <td className="py-3.5 px-4 text-text-secondary font-sans">Zero critical rule violations & virus check clean</td>
                  <td className="py-3.5 px-4 font-bold text-blue-400">SEALING</td>
                  <td className="py-3.5 px-4 text-text-tertiary font-sans">Compile SHA-256 evidence package & calculate root manifest</td>
                </tr>
                <tr className="hover:bg-canvas-subtle">
                  <td className="py-3.5 px-4 font-bold text-cyan-400">VERIFYING</td>
                  <td className="py-3.5 px-4 text-red-400">RULE_VIOLATED</td>
                  <td className="py-3.5 px-4 text-text-secondary font-sans">Document failed check (e.g. illegible PDF, expired date)</td>
                  <td className="py-3.5 px-4 font-bold text-rose-400">EXCEPTION_REVIEW</td>
                  <td className="py-3.5 px-4 text-text-tertiary font-sans">Route to operator inbox with diff highlight</td>
                </tr>
                <tr className="hover:bg-canvas-subtle">
                  <td className="py-3.5 px-4 font-bold text-blue-400">SEALING</td>
                  <td className="py-3.5 px-4 text-emerald-400">MANIFEST_COMMITTED</td>
                  <td className="py-3.5 px-4 text-text-secondary font-sans">S3 object locked & cryptographic signature verified</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">COMPLETED</td>
                  <td className="py-3.5 px-4 text-text-tertiary font-sans">Trigger webhook, deliver client completion notice</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Embedded Interactive State Machine */}
        <div>
          <InteractiveStateMachine />
        </div>

        {/* Database Check Constraints Code Callout */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">PostgreSQL Invariant DDL</h3>
              <p className="text-xs text-text-secondary">Enforced at the relational storage layer</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-black/70 p-6 font-mono text-xs text-indigo-300 border border-white/5 overflow-x-auto">
            <pre>{`-- Invariant schema: Illegal transitions are physically rejected by PostgreSQL
ALTER TABLE work_items
  ADD CONSTRAINT chk_valid_state_transitions
  CHECK (
    (status = 'DRAFT') OR
    (status = 'AWAITING_INPUT' AND client_token_hash IS NOT NULL) OR
    (status = 'VERIFYING' AND input_payload IS NOT NULL) OR
    (status = 'EXCEPTION_REVIEW' AND exception_reason IS NOT NULL) OR
    (status = 'SEALING' AND verification_passed_at IS NOT NULL) OR
    (status = 'COMPLETED' AND sealed_manifest_sha256 IS NOT NULL)
  );

-- Row-level locking transition function with atomic audit insertion
CREATE OR REPLACE FUNCTION transition_work_state(
  p_work_id UUID,
  p_expected_status work_status,
  p_new_status work_status,
  p_actor_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Acquire row lock
  PERFORM id FROM work_items WHERE id = p_work_id AND status = p_expected_status FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Concurrency conflict: Work item % is not in expected status %', p_work_id, p_expected_status;
  END IF;

  -- Advance state
  UPDATE work_items SET status = p_new_status, updated_at = NOW() WHERE id = p_work_id;

  -- Atomic audit ledger insert
  INSERT INTO work_transition_ledger (work_id, from_status, to_status, actor_id, committed_at)
  VALUES (p_work_id, p_expected_status, p_new_status, p_actor_id, NOW());
END;
$$ LANGUAGE plpgsql;`}</pre>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="State Machine Correctness FAQ"
            subtitle="Deep engineering answers on deterministic transition graphs, rollback semantics, and multi-tenant locks."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Blueprint Next Steps */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">Spring Modulith Topology & Domain Encapsulation</div>
          </div>
          <Link
            href="/how-it-works/architecture"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore Modulith Topology <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
