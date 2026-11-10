"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Database,
  FolderLock,
  Key,
  Lock,
  ShieldCheck,
  } from "lucide-react";

export function VisualSecurityVaultMockup() {
  const [activeLayer, setActiveLayer] = useState<number>(0);

  const layers = [
    {
      id: 0,
      name: "Kernel-Level PostgreSQL RLS",
      short: "Kernel RLS",
      status: "ACTIVE",
      icon: Database,
      highlight: "Zero cross-tenant data leaks possible",
      desc: "Tenant context is derived strictly from server-side sessions. PostgreSQL Row-Level Security policies filter rows inside the database kernel.",
    },
    {
      id: 1,
      name: "AES-256-GCM Envelope Encryption",
      short: "AES-256",
      status: "AUTHENTICATED",
      icon: Key,
      highlight: "NIST FIPS 140-3 approved authenticated cipher",
      desc: "Each artifact is encrypted with a unique Data Encryption Key (DEK). Master keys reside inside your enterprise AWS KMS or HashiCorp Vault.",
    },
    {
      id: 2,
      name: "Immutable Evidence Sealing",
      short: "Evidence Vault",
      status: "LOCKED",
      icon: FolderLock,
      highlight: "Immutable non-rewriteable cloud archival",
      desc: "Evidence bundles cannot be overwritten or deleted by any user—including root admins—until the statutory retention period expires.",
    },
    {
      id: 3,
      name: "Air-Gapped Document AI",
      short: "Zero Retention",
      status: "AIR-GAPPED",
      icon: ShieldCheck,
      highlight: "Contractual zero-retention guarantee",
      desc: "Documents are processed in volatile RAM buffers that are overwritten with zeros immediately upon extraction. Zero data training.",
    },
  ];

  const curr = layers[activeLayer] ?? layers[0]!;
  const Icon = curr.icon;

  return (
    <div className="w-full max-w-xl rounded-3xl border border-border bg-canvas p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary">Zero-Trust Defense-in-Depth</div>
            <div className="text-[10px] font-mono text-text-tertiary">Continuous Security Architecture</div>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
          100% CONTROLS PASSING
        </span>
      </div>

      {/* Layer Tabs */}
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            className={`rounded-xl py-2 font-mono text-[11px] font-bold transition-all border ${
              activeLayer === l.id
                ? "bg-emerald-500 text-white border-emerald-500 shadow"
                : "bg-canvas-subtle border-border/70 text-text-secondary hover:bg-canvas"
            }`}
          >
            {l.short}
          </button>
        ))}
      </div>

      {/* Visual Vault Card */}
      <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">{curr.name}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {curr.highlight}
              </div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> {curr.status}
          </span>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-text-secondary">
          {curr.desc}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-emerald-500/20 pt-4 text-center font-mono text-[11px]">
          <div className="rounded-lg bg-canvas p-2 border border-border">
            <div className="text-[10px] text-text-tertiary">PostgreSQL</div>
            <div className="text-emerald-500 font-bold mt-0.5">Strict RLS</div>
          </div>
          <div className="rounded-lg bg-canvas p-2 border border-border">
            <div className="text-[10px] text-text-tertiary">Auditing</div>
            <div className="text-emerald-500 font-bold mt-0.5">Append-Only</div>
          </div>
          <div className="rounded-lg bg-canvas p-2 border border-border">
            <div className="text-[10px] text-text-tertiary">Evidence</div>
            <div className="text-emerald-500 font-bold mt-0.5">SHA-256</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <Lock className="h-3.5 w-3.5 text-emerald-500" /> Sovereign KMS Key Ownership
        </span>
        <span className="font-mono">Auditor Self-Service</span>
      </div>
    </div>
  );
}
