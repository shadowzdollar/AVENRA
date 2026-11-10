"use client";

import { useState } from "react";
import {
  CheckCircle2,
  } from "lucide-react";
import {
  SiAmazons3,
  SiCloudflare,
  SiGmail,
  SiMake,
  SiMinio,
  SiZapier,
} from "react-icons/si";

export function VisualPartnerOrbit() {
  const [selectedPartner, setSelectedPartner] = useState<string>("aws");

  const partners = [
    {
      id: "aws",
      name: "Amazon Web Services (AWS S3)",
      icon: SiAmazons3,
      category: "Cloud Object Storage",
      color: "text-amber-500",
      desc: "Presigned direct upload and SHA-256 verified export to your S3 bucket.",
      stats: "14.8 MB/s direct stream • Zero server buffering",
    },
    {
      id: "zapier",
      name: "Zapier",
      icon: SiZapier,
      category: "Workflow Automation",
      color: "text-orange-500",
      desc: "Instant HMAC-SHA256 signed triggers on work item creation, exception flagging, and completion.",
      stats: "Sub-second webhook dispatch • Automatic backoff",
    },
    {
      id: "r2",
      name: "Cloudflare R2",
      icon: SiCloudflare,
      category: "Zero-Egress Storage",
      color: "text-orange-400",
      desc: "Global anycast edge storage with zero egress bandwidth charges on auditor evidence downloads.",
      stats: "Global multi-region • 100% S3 API compatibility",
    },
    {
      id: "gmail",
      name: "Google Workspace (Gmail)",
      icon: SiGmail,
      category: "Inbound Email Intake",
      color: "text-red-500",
      desc: "Inbound MIME email parsing with SPF/DKIM verification and threaded client reply tracking.",
      stats: "Automatic ClamAV attachment screening",
    },
    {
      id: "make",
      name: "Make (Integromat)",
      icon: SiMake,
      category: "Multi-Branch Scenarios",
      color: "text-purple-500",
      desc: "Visual workflow routing connecting CRM leads directly to Avenra deliverable state machines.",
      stats: "Full payload JSON schemas in packages/contracts",
    },
    {
      id: "minio",
      name: "MinIO Self-Hosted",
      icon: SiMinio,
      category: "On-Premise Sovereign",
      color: "text-rose-500",
      desc: "Air-gapped on-premise object storage for defense contractors and sovereign medical networks.",
      stats: "100% internal network isolation • No cloud egress",
    },
  ];

  const curr = partners.find((p) => p.id === selectedPartner) ?? partners[0]!;
  const Icon = curr.icon;

  return (
    <div className="w-full rounded-3xl border border-border bg-canvas p-6 md:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
            Ecosystem Connectivity
          </span>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-text-primary md:text-2xl">
            Integrates with Your Core Enterprise Stack
          </h3>
        </div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 font-mono text-xs font-bold text-amber-500 border border-amber-500/20">
          ZERO VENDOR LOCK-IN
        </span>
      </div>

      {/* Interactive App Badges Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {partners.map((p) => {
          const PIcon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPartner(p.id)}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                selectedPartner === p.id
                  ? "border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20"
                  : "border-border/70 bg-canvas-subtle hover:border-border hover:bg-canvas"
              }`}
            >
              <PIcon className={`h-8 w-8 ${p.color} transition-transform hover:scale-110`} />
              <span className="mt-2 text-xs font-bold text-text-primary truncate w-full">
                {p.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Partner Spotlight Card */}
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas border border-border shadow-sm">
              <Icon className={`h-6 w-6 ${curr.color}`} />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">{curr.name}</div>
              <div className="text-xs text-text-tertiary font-mono">{curr.category}</div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> NATIVE CONNECTOR READY
          </span>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-text-secondary sm:text-sm">
          {curr.desc}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-amber-500/20 pt-3 text-xs font-mono text-text-tertiary">
          <span>{curr.stats}</span>
          <span className="text-amber-500 font-bold">OpenAPI v1 Contract</span>
        </div>
      </div>
    </div>
  );
}
