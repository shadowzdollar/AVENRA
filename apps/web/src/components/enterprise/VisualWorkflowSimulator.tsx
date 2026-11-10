"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  FolderLock,
  Inbox,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  } from "lucide-react";

export function VisualWorkflowSimulator() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const steps = [
    {
      id: 0,
      title: "1. Intake Ingestion",
      shortTitle: "Ingest",
      tag: "INBOUND",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      description: "Matter registered from client email. Work state initialized as DRAFT.",
      actor: "Engagement Lead",
      avatarBg: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
      avatarInitials: "SJ",
      visualContent: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-canvas p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Matter 2026-B: Cross-Border Audit</div>
                <div className="text-[11px] text-text-secondary">Client: Northwind Partners LLC</div>
              </div>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-500 border border-blue-500/20">
              PRIORITY: HIGH
            </span>
          </div>
          <div className="rounded-xl border border-border/80 bg-canvas-subtle p-3 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Automated Action:</span> Avenra analyzed requirements profile and identified 2 missing statutory schedules.
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: "2. Missing Data Gathering",
      shortTitle: "Gather",
      tag: "CLIENT MAGIC PORTAL",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      description: "Single-use magic link portal dispatched. Client uploads directly to private S3.",
      actor: "Client: Finance Team",
      avatarBg: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
      avatarInitials: "DV",
      visualContent: (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <span className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-amber-500" /> Secure Dropzone (No Password Needed)
              </span>
              <span className="font-mono text-[10px] text-amber-500">TTL: 7 Days</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-canvas p-2.5 text-xs">
                <span className="flex items-center gap-2 text-text-primary font-medium">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" /> Delaware Certificate of Incorporation.pdf
                </span>
                <span className="text-emerald-500 font-mono text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> UPLOADED (2.4MB)
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-canvas p-2.5 text-xs">
                <span className="flex items-center gap-2 text-text-primary font-medium">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" /> Form 1065 Schedule K-1.pdf
                </span>
                <span className="text-emerald-500 font-mono text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> UPLOADED (1.1MB)
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "3. Rule Verification & AI Scan",
      shortTitle: "Verify",
      tag: "5 GATES PASSED",
      badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      description: "ClamAV virus scan: Clean. Regex matching: Verified. AI model extraction: 99.8% confidence.",
      actor: "Autonomous Rule Gates",
      avatarBg: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300",
      avatarInitials: "AV",
      visualContent: (
        <div className="space-y-3">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <span className="flex items-center gap-1.5 text-cyan-500">
                <ShieldCheck className="h-4 w-4" /> Live Verification Telemetry
              </span>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                SCORE: 100%
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-canvas p-2">
                <div className="text-[10px] text-text-tertiary">ClamAV Malware</div>
                <div className="font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" /> 0 Viruses
                </div>
              </div>
              <div className="rounded-lg border border-border bg-canvas p-2">
                <div className="text-[10px] text-text-tertiary">EIN Checksum</div>
                <div className="font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" /> 84-1928471
                </div>
              </div>
              <div className="rounded-lg border border-border bg-canvas p-2">
                <div className="text-[10px] text-text-tertiary">Cross-Footing</div>
                <div className="font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" /> $1.42M Balanced
                </div>
              </div>
              <div className="rounded-lg border border-border bg-canvas p-2">
                <div className="text-[10px] text-text-tertiary">OCR Confidence</div>
                <div className="font-bold text-cyan-500 flex items-center gap-1 mt-0.5">
                  <Sparkles className="h-3 w-3" /> 99.82% Score
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "4. Sealed Evidence Binder",
      shortTitle: "Seal & Deliver",
      tag: "SEALED MANIFEST",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      description: "SHA-256 sealed ZIP package committed to enterprise AWS S3 vault under SEC Rule 17a-4.",
      actor: "Sovereign S3 Vault",
      avatarBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
      avatarInitials: "S3",
      visualContent: (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md">
                  <FolderLock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">evidence_package_2026_091a.zip</div>
                  <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    SHA-256: 4a2b9e81...01c74d
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                COMPLETED
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-emerald-500/20 pt-2 text-[11px] text-text-secondary">
              <span>Custody: Customer AWS S3 Bucket</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">SHA-256 Sealed</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    let cur = 0;
    const interval = setInterval(() => {
      cur += 1;
      if (cur >= steps.length) {
        clearInterval(interval);
        setIsSimulating(false);
      } else {
        setActiveStep(cur);
      }
    }, 1200);
  };

  const curr = steps[activeStep] ?? steps[0]!;

  return (
    <div className="w-full rounded-3xl border border-border bg-canvas p-6 md:p-8 shadow-xl">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
              Interactive Execution Engine
            </span>
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-text-primary md:text-2xl">
            Watch Work Transition to Completion
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-background shadow transition-all hover:bg-brand/90 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-spin" /> Simulating...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Auto-Play Lifecycle
              </>
            )}
          </button>
          <button
            onClick={() => setActiveStep(0)}
            className="rounded-xl border border-border bg-canvas-subtle p-2 text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            title="Reset to Step 1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Stage Stepper Bar */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveStep(st.id)}
            className={`flex flex-col rounded-2xl border p-3.5 text-left transition-all ${
              activeStep === st.id
                ? "border-brand bg-brand/5 shadow-md ring-2 ring-brand/20"
                : "border-border/70 bg-canvas-subtle hover:border-border hover:bg-canvas"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-text-tertiary uppercase">
                Stage 0{st.id + 1}
              </span>
              {activeStep > st.id ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : activeStep === st.id ? (
                <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              ) : null}
            </div>
            <div className="mt-2 text-xs font-bold text-text-primary truncate">
              {st.shortTitle}
            </div>
          </button>
        ))}
      </div>

      {/* Active Stage Interactive Showcase Card */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-canvas-subtle p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${curr.badgeColor}`}>
                {curr.tag}
              </span>
              <span className="text-xs font-mono text-text-tertiary">Active State Node</span>
            </div>
            <h4 className="mt-2 text-lg font-bold text-text-primary">{curr.title}</h4>
            <p className="mt-1 text-xs text-text-secondary">{curr.description}</p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-canvas px-3 py-2 shrink-0">
            <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center ${curr.avatarBg}`}>
              {curr.avatarInitials}
            </div>
            <div>
              <div className="text-[10px] font-mono text-text-tertiary">Actor in Control</div>
              <div className="text-xs font-bold text-text-primary">{curr.actor}</div>
            </div>
          </div>
        </div>

        {/* Visual Content Display */}
        <div className="mt-6">
          {curr.visualContent}
        </div>
      </div>
    </div>
  );
}
