"use client";

import {
  CheckCircle2,
  Code2,
  Lock,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useState } from "react";

interface StateNode {
  id: string;
  name: string;
  step: string;
  actor: "SYSTEM" | "CLIENT" | "OPERATOR" | "AI";
  statusColor: string;
  description: string;
  guards: string[];
  dbEvent: string;
  auditPayload: Record<string, string>;
  codeSnippet: string;
}

const STATES: StateNode[] = [
  {
    id: "PENDING",
    name: "Work Registered",
    step: "01",
    actor: "SYSTEM",
    statusColor: "text-brand bg-brand-surface",
    description: "Inbound demand captured from verified webhook, email ingestion, or API call. Initial deliverable record created.",
    guards: [
      "Tenant organization_id validated against server session",
      "Work title and client entity exist in registry",
      "Initial idempotency key recorded in Redis cache",
    ],
    dbEvent: "INSERT INTO work_item (status, organization_id) VALUES ('PENDING', :orgId)",
    auditPayload: {
      action: "work.created",
      initiatedBy: "system.webhook",
      idempotencyKey: "evt_7f81a029",
      timestamp: "2026-11-09T17:10:00.124Z",
    },
    codeSnippet: `// Work initialized with strict idempotency
const work = await avenra.work.create({
  title: "Q3 Statutory Audit Binder",
  clientId: "client_northwind",
  priority: "HIGH"
});`,
  },
  {
    id: "AWAITING_CLIENT_INPUT",
    name: "Client Portal Dispatched",
    step: "02",
    actor: "CLIENT",
    statusColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    description: "Single-use cryptographic magic link dispatched to client. Work paused awaiting document upload and form answers.",
    guards: [
      "Magic token generated with 256-bit cryptographic entropy",
      "Upload limits set (max 30MB, MIME: PDF/XLSX)",
      "Adaptive follow-up reminder schedule activated (Days 2, 5, 8)",
    ],
    dbEvent: "UPDATE work_item SET status = 'AWAITING_CLIENT_INPUT' WHERE id = :id AND status = 'PENDING'",
    auditPayload: {
      action: "request_link.dispatched",
      recipient: "cfo@northwind.com",
      expiresAt: "2026-11-16T17:10:00Z",
      tokenHash: "e3b0c44298fc1c149afbf4c8996fb924",
    },
    codeSnippet: `// Magic link generated for client CFO
const request = await avenra.requests.create({
  workId: work.id,
  recipient: "cfo@northwind.com",
  items: ["q3_trial_balance.xlsx", "bank_statement.pdf"]
});`,
  },
  {
    id: "EVALUATING_CHECKS",
    name: "Deterministic Verification",
    step: "03",
    actor: "AI",
    statusColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    description: "Client files stream through ClamAV scanning, air-gapped schema extraction, and deterministic business rule gates.",
    guards: [
      "ClamAV stream scan returned OK (Zero virus signatures)",
      "Document OCR extracted table schema matching Pydantic contract",
      "Trial balance debits match credits within 0.00 margin",
    ],
    dbEvent: "INSERT INTO check_result (work_id, rule_name, passed) VALUES (:id, 'BALANCE_MATCH', true)",
    auditPayload: {
      action: "verification.evaluated",
      rulesChecked: "4/4 passed",
      scannerResult: "clamav.clean",
      durationMs: "342ms",
    },
    codeSnippet: `// Evaluates all registered verification rules
const results = await avenra.verification.evaluate(work.id, {
  rules: ["BALANCE_MATCH", "SIGNATURE_PRESENT", "DATE_IN_BOUNDS"]
}); // -> All rules PASSED`,
  },
  {
    id: "AWAITING_APPROVAL",
    name: "Human-in-the-Loop Sign-Off",
    step: "04",
    actor: "OPERATOR",
    statusColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
    description: "Autonomous actions halt. Deliverable surfaces in Operator Approvals Inbox requiring explicit authorization.",
    guards: [
      "Operator must hold explicit `work.approve` permission",
      "All mandatory checklist items in PASSED state",
      "Two-factor authentication step completed within current session",
    ],
    dbEvent: "UPDATE work_item SET status = 'AWAITING_APPROVAL' WHERE id = :id",
    auditPayload: {
      action: "work.approval_requested",
      approverRoleRequired: "work.approve",
      flagsSummary: "0 blocking exceptions",
    },
    codeSnippet: `// Awaiting operator with 'work.approve' capability
const approval = await avenra.approvals.submit({
  workId: work.id,
  decision: "APPROVED",
  comment: "Trial balance and bank statements reconciled successfully."
});`,
  },
  {
    id: "COMPLETED",
    name: "Sealed & Archived to S3",
    step: "05",
    actor: "SYSTEM",
    statusColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    description: "Evidence pack compiled, SHA-256 manifest stamped, customer S3 bucket written, and signed webhooks delivered.",
    guards: [
      "Evidence bundle ZIP checksum verified against manifest",
      "S3 object write confirmed (HTTP 200 ETag recorded)",
      "Signed webhook delivered to billing system with HMAC header",
    ],
    dbEvent: "UPDATE work_item SET status = 'COMPLETED', completed_at = NOW() WHERE id = :id",
    auditPayload: {
      action: "evidence.sealed",
      s3Location: "s3://firm-vault/evidence/2026/wrk_90412.zip",
      sha256: "8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
    },
    codeSnippet: `// Immutable evidence pack permanently archived
const evidence = await avenra.evidence.get(work.id);
console.log(evidence.sha256); // 8f4e2b10...
console.log(evidence.s3Uri);  // s3://firm-vault/...`,
  },
];

export function InteractiveStateMachine() {
  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const current = (STATES[selectedStateIndex] ?? STATES[0])!;

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      {/* Header bar */}
      <div className="border-b border-border bg-background px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Workflow className="size-5 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            Interactive Finite State Machine Inspector
          </span>
          <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-bold text-brand">
            LIVE ENGINE SPEC
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStateIndex((prev) => (prev > 0 ? prev - 1 : prev))}
            disabled={selectedStateIndex === 0}
            className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-40"
          >
            ← Previous State
          </button>
          <button
            type="button"
            onClick={() => setSelectedStateIndex((prev) => (prev < STATES.length - 1 ? prev + 1 : prev))}
            disabled={selectedStateIndex === STATES.length - 1}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-background hover:bg-brand/90 disabled:opacity-40"
          >
            Advance State →
          </button>
        </div>
      </div>

      {/* Stepper Tabs Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-border bg-background/50">
        {STATES.map((state, index) => {
          const isActive = index === selectedStateIndex;
          const isPassed = index < selectedStateIndex;
          return (
            <button
              key={state.id}
              type="button"
              onClick={() => setSelectedStateIndex(index)}
              className={`flex flex-col items-start gap-1 p-4 text-left transition-all border-r border-border last:border-r-0 ${
                isActive
                  ? "bg-canvas border-b-2 border-b-brand"
                  : "hover:bg-canvas/60 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isPassed
                      ? "bg-success text-background"
                      : isActive
                      ? "bg-brand text-background"
                      : "bg-border text-text-secondary"
                  }`}
                >
                  {isPassed ? "✓" : state.step}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {state.actor}
                </span>
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-brand" : "text-text-primary"}`}>
                {state.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* State Inspector Details */}
      <div className="p-6 md:p-8 grid gap-8 md:grid-cols-12">
        {/* Left: State Behavior & Guards */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${current.statusColor}`}>
                STATUS: {current.id}
              </span>
              <span className="text-xs text-text-secondary">Stage {current.step} of 05</span>
            </div>
            <h3 className="text-xl font-bold text-text-primary">{current.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {current.description}
            </p>
          </div>

          {/* Mandatory Guards */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-4 text-brand" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Precondition Guard Gates (Must Pass to Advance)
              </h4>
            </div>
            <ul className="space-y-2">
              {current.guards.map((guard, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                  <span>{guard}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Atomic Database Event */}
          <div className="rounded-2xl border border-border bg-background p-5 font-mono text-xs">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
              Database Transaction Boundary (PostgreSQL RLS)
            </span>
            <div className="rounded-lg bg-canvas p-3 text-brand overflow-x-auto">
              <code>{current.dbEvent}</code>
            </div>
          </div>
        </div>

        {/* Right: Real Code & Audit Ledger Stream */}
        <div className="md:col-span-5 space-y-6">
          {/* Audit Event JSON */}
          <div className="rounded-2xl border border-border bg-background p-5 font-mono text-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="size-3.5 text-success" />
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                  Append-Only Audit Record
                </span>
              </div>
              <span className="text-[9px] text-text-secondary">IMMUTABLE</span>
            </div>
            <pre className="rounded-xl bg-canvas p-3.5 text-[11px] text-text-primary overflow-x-auto leading-relaxed border border-border/50">
              {JSON.stringify(current.auditPayload, null, 2)}
            </pre>
          </div>

          {/* SDK snippet */}
          <div className="rounded-2xl border border-border bg-background p-5 font-mono text-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="size-3.5 text-brand" />
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                  TypeScript Contract Client
                </span>
              </div>
              <span className="text-[9px] text-brand">OPENAPI V1</span>
            </div>
            <pre className="rounded-xl bg-canvas p-3.5 text-[11px] text-text-secondary overflow-x-auto leading-relaxed border border-border/50">
              {current.codeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
