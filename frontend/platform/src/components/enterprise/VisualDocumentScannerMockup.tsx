"use client";

import { useState } from "react";
import {
  FileText,
  RefreshCw,
  Scan,
  ShieldCheck,
  Sparkles,
  } from "lucide-react";

export function VisualDocumentScannerMockup() {
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState(true);

  const handleScan = () => {
    setScanning(true);
    setExtracted(false);
    setTimeout(() => {
      setScanning(false);
      setExtracted(true);
    }, 1200);
  };

  return (
    <div className="w-full max-w-xl rounded-3xl border border-border bg-canvas p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Scan className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary">Air-Gapped Document Reader</div>
            <div className="text-[10px] font-mono text-text-tertiary">PyMuPDF + Pydantic v2 Contract</div>
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-600 transition-all disabled:opacity-50"
        >
          {scanning ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" /> Scanning...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" /> Rescan Document
            </>
          )}
        </button>
      </div>

      {/* Simulated Document Page with Scanning Laser */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-canvas-subtle p-5">
        {/* Animated Laser Beam */}
        {scanning && (
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse transition-all duration-1000" />
        )}

        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-tertiary" />
            <span className="font-mono text-xs font-bold text-text-primary">
              DELAWARE_CERTIFICATE_OF_FORMATION.PDF
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            ClamAV: CLEAN
          </span>
        </div>

        {/* Mock Document Text Lines */}
        <div className="mt-4 space-y-2.5">
          <div className="h-2.5 w-3/4 rounded bg-border/40" />
          <div className="h-2.5 w-full rounded bg-border/40" />

          {/* Bounding Box 1: Entity Name */}
          <div className={`rounded-lg border p-2 transition-all ${extracted ? "border-indigo-500/60 bg-indigo-500/10 shadow-sm" : "border-border/40 bg-transparent"}`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="font-bold text-indigo-400">#field: corporate_entity_name</span>
              <span className="text-emerald-500 font-bold">99.8% CONFIDENCE</span>
            </div>
            <div className="mt-1 font-bold text-text-primary text-xs">
              &quot;Northwind Partners, L.L.C.&quot;
            </div>
          </div>

          <div className="h-2.5 w-5/6 rounded bg-border/40" />

          {/* Bounding Box 2: EIN / Tax ID */}
          <div className={`rounded-lg border p-2 transition-all ${extracted ? "border-emerald-500/60 bg-emerald-500/10 shadow-sm" : "border-border/40 bg-transparent"}`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="font-bold text-emerald-400">#field: employer_id_number (EIN)</span>
              <span className="text-emerald-500 font-bold">REGEX VERIFIED</span>
            </div>
            <div className="mt-1 font-mono font-bold text-text-primary text-xs">
              84-1928471 (Verified IRS Checksum)
            </div>
          </div>

          <div className="h-2.5 w-2/3 rounded bg-border/40" />

          {/* Bounding Box 3: Filing Date */}
          <div className={`rounded-lg border p-2 transition-all ${extracted ? "border-cyan-500/60 bg-cyan-500/10 shadow-sm" : "border-border/40 bg-transparent"}`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="font-bold text-cyan-400">#field: state_incorporation_date</span>
              <span className="text-cyan-400 font-bold">DATE VALIDATED</span>
            </div>
            <div className="mt-1 font-mono font-bold text-text-primary text-xs">
              October 14, 2021 · State of Delaware
            </div>
          </div>
        </div>
      </div>

      {/* Safety Guarantee Footer */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> RAM Buffer Overwritten (0 Bytes Stored)
        </span>
        <span className="font-mono text-emerald-500 font-bold">Zero AI Training</span>
      </div>
    </div>
  );
}
