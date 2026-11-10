"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Lock,
  ShieldCheck,
  UploadCloud,
  } from "lucide-react";

export function VisualMagicPortalMockup() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="w-full max-w-xl rounded-3xl border border-border bg-canvas p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary">Client Magic Link Portal</div>
            <div className="text-[10px] font-mono text-text-tertiary">portal.avenra.yourfirm.com/c/sec_mag_99f2</div>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
          ZERO-LOGIN ACCESS
        </span>
      </div>

      {/* Firm Request Header */}
      <div className="mt-4 rounded-2xl border border-border/80 bg-canvas-subtle p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/20 text-brand font-bold text-xs">
              EV
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Engagement Partner</div>
              <div className="text-[10px] text-text-secondary">Northwind Legal & Financial Advisory</div>
            </div>
          </div>
          <span className="text-[11px] text-text-tertiary font-mono">Due in 4 days</span>
        </div>
        <p className="mt-3 text-xs text-text-secondary leading-relaxed">
          &quot;Hi David, please upload your Delaware Articles of Formation and Form 1065 Schedule K-1 so we can seal the acquisition binder before Friday.&quot;
        </p>
      </div>

      {/* Interactive Dropzone */}
      <div
        onClick={() => setUploaded(!uploaded)}
        className="mt-4 rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 p-6 text-center transition-all cursor-pointer bg-canvas-subtle hover:bg-canvas"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
          <UploadCloud className="h-6 w-6" />
        </div>
        <div className="text-xs font-bold text-text-primary">
          {uploaded ? "Files Uploaded Successfully!" : "Click to Drop Requested Files Here"}
        </div>
        <p className="mt-1 text-[11px] text-text-secondary">
          Direct stream to private S3 bucket • Max 5GB • Automatic ClamAV Virus Screen
        </p>

        <div className="mt-4 space-y-2 text-left">
          <div className="flex items-center justify-between rounded-xl border border-border bg-canvas p-2.5 text-xs">
            <span className="flex items-center gap-2 text-text-primary">
              <FileText className="h-4 w-4 text-emerald-500" /> Certificate_Of_Formation.pdf
            </span>
            <span className="font-mono text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED (2.4MB)
            </span>
          </div>

          {uploaded && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-canvas p-2.5 text-xs animate-in fade-in duration-300">
              <span className="flex items-center gap-2 text-text-primary">
                <FileText className="h-4 w-4 text-emerald-500" /> Schedule_K1_2025.pdf
              </span>
              <span className="font-mono text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED (1.1MB)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Proof */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Presigned S3 PUT URL
        </span>
        <span className="font-mono">End-to-End Encrypted</span>
      </div>
    </div>
  );
}
