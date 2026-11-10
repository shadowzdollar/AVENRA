"use client";

import { Clock, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface TimelineEvent {
  step: string;
  timeOffset: string;
  actor: string;
  title: string;
  description: string;
  badge: string;
  dataTrace: {
    event: string;
    payloadSummary: string;
    invariantCheck: string;
  };
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    step: "01",
    timeOffset: "T + 00:00:00",
    actor: "SYSTEM / WEBHOOK",
    title: "Work Initiation & Invariant Registration",
    description: "External ERP or CRM dispatches webhook `work.create`. Avenra registers deliverable into `PENDING` state with cryptographic idempotency key.",
    badge: "IDEMPOTENT",
    dataTrace: {
      event: "work.created",
      payloadSummary: '{"id": "wrk_890214", "priority": "HIGH", "client": "cli_meridian"}',
      invariantCheck: "PostgreSQL constraint: app.current_organization_id verified match with session token.",
    },
  },
  {
    step: "02",
    timeOffset: "T + 00:00:04",
    actor: "AVENRA ENGINE",
    title: "Ephemeral Magic Portal Dispatch",
    description: "System issues a single-use tokenized link directly to client CFO. Link expires in 7 days and triggers automated friendly follow-ups if untouched.",
    badge: "TOKENIZED LINK",
    dataTrace: {
      event: "request.dispatched",
      payloadSummary: '{"recipient": "cfo@meridian.com", "tokenTtl": "7d", "hashSig": "8f90b2..."}',
      invariantCheck: "Zero public login requirement; token signed with HMAC-SHA256 secret.",
    },
  },
  {
    step: "03",
    timeOffset: "T + 01:24:12",
    actor: "CLIENT USER",
    title: "Client Upload & Inline Antivirus Inspection",
    description: "Client uploads required financial records. Upload stream is piped across in-memory socket to ClamAV daemon before saving bytes.",
    badge: "STREAM INSPECTED",
    dataTrace: {
      event: "document.uploaded",
      payloadSummary: '{"file": "cap_table.xlsx", "sizeBytes": 2841920, "sha256": "4b5c6d..."}',
      invariantCheck: "ClamAV stream clean. Upload accepted without writing temporary bytes to disk.",
    },
  },
  {
    step: "04",
    timeOffset: "T + 01:24:14",
    actor: "AI INTELLIGENCE",
    title: "Air-Gapped Document Intelligence & Schema Check",
    description: "Stateless AI worker parses columns, totals, and shareholder names against formal JSON schema definitions in memory.",
    badge: "STATLESS AI",
    dataTrace: {
      event: "ai.document.parsed",
      payloadSummary: '{"confidenceScore": 0.998, "extractedShareholders": 42, "balanceSum": 100.00}',
      invariantCheck: "Zero persistence guarantee: AI worker retains 0 bytes in database or disk.",
    },
  },
  {
    step: "05",
    timeOffset: "T + 01:24:16",
    actor: "OPERATOR",
    title: "Human-in-the-Loop Principal Approval",
    description: "Assigned partner reviews the exception-free deliverable summary, verifies compliance flags, and provides cryptographic approval signature.",
    badge: "HUMAN SIGN-OFF",
    dataTrace: {
      event: "work.approved",
      payloadSummary: '{"operatorId": "usr_partner_77", "permissionChecked": "work.approve"}',
      invariantCheck: "Granular RBAC verified. Generic admin overrides strictly blocked.",
    },
  },
  {
    step: "06",
    timeOffset: "T + 01:24:18",
    actor: "AVENRA MONOLITH",
    title: "Sealed Evidence Locker Export to Sovereign S3",
    description: "Evidence pack compiled into self-contained offline ZIP archive with SHA-256 package manifest and uploaded to customer AWS S3 bucket.",
    badge: "CRYPTOGRAPHIC SEAL",
    dataTrace: {
      event: "evidence.sealed",
      payloadSummary: '{"s3Uri": "s3://firm-vault/evidence/wrk_890214.zip", "packageSha256": "9a1b2c..."}',
      invariantCheck: "Audit ledger appended with tamper-proof cryptographic chain hash.",
    },
  },
];

export function EnterpriseWorkflowTimeline() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeEvent = TIMELINE_EVENTS[activeStepIndex] ?? TIMELINE_EVENTS[0]!;

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      <div className="border-b border-border bg-background px-6 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Complete Execution Lifecycle Trace
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Chronological Audit Trail of a Verified Deliverable
            </h3>
            <p className="mt-1 text-xs text-text-secondary md:text-sm max-w-3xl">
              Follow every atomic step of an enterprise deliverable from initial intake to sovereign cryptographic archival.
            </p>
          </div>

          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand font-mono">
            TRACE ID: wrk_01HZX892KLA
          </span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-6 border-b border-border bg-background/50">
        {TIMELINE_EVENTS.map((item, idx) => {
          const isSelected = idx === activeStepIndex;
          const isPast = idx < activeStepIndex;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`p-4 text-left transition-all border-r border-border last:border-r-0 ${
                isSelected
                  ? "bg-canvas border-b-2 border-b-brand"
                  : "hover:bg-canvas/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-text-secondary">{item.timeOffset}</span>
                <span
                  className={`size-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isSelected
                      ? "bg-brand text-background"
                      : isPast
                      ? "bg-success text-background"
                      : "bg-border text-text-secondary"
                  }`}
                >
                  {isPast ? "✓" : item.step}
                </span>
              </div>
              <h5 className="text-xs font-bold text-text-primary line-clamp-1">{item.title}</h5>
              <span className="text-[10px] text-text-secondary block font-semibold uppercase mt-0.5">
                {item.actor}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Step Deep Inspector */}
      <div className="p-6 md:p-8 grid gap-8 md:grid-cols-12 bg-canvas">
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-background font-mono">
              STAGE {activeEvent.step}
            </span>
            <span className="rounded bg-brand-surface px-2.5 py-0.5 text-[10px] font-bold text-brand">
              {activeEvent.badge}
            </span>
            <span className="text-xs text-text-secondary font-mono">{activeEvent.timeOffset}</span>
          </div>

          <h3 className="text-xl font-bold text-text-primary md:text-2xl">
            {activeEvent.title}
          </h3>
          <p className="text-xs leading-relaxed text-text-secondary md:text-sm">
            {activeEvent.description}
          </p>

          <div className="mt-6 rounded-2xl border border-success/30 bg-success-surface/10 p-4">
            <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="size-4" /> Architectural Invariant Enforced
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {activeEvent.dataTrace.invariantCheck}
            </p>
          </div>
        </div>

        {/* Right: Event Payload */}
        <div className="md:col-span-5 rounded-2xl border border-border bg-[#0d1117] p-5 text-[#c9d1d9] font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3 text-[#8b949e] text-[10px]">
              <span>Event Name: {activeEvent.dataTrace.event}</span>
              <span className="text-success font-bold">VERIFIED</span>
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] block mb-1">
                Committed JSON Event Payload
              </span>
              <pre className="text-[11px] text-[#79c0ff] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {activeEvent.dataTrace.payloadSummary}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#30363d] text-[10px] text-[#8b949e]">
            Timestamp: 2026-11-09T17:15:00Z · Actor: {activeEvent.actor}
          </div>
        </div>
      </div>
    </div>
  );
}
