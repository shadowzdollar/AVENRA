"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  FileCode2,
  FileText,
  FolderLock,
  FolderOpen,
  Lock,
} from "lucide-react";
import { useState } from "react";

interface EvidenceFile {
  id: string;
  name: string;
  path: string;
  size: string;
  sha256: string;
  mime: string;
  content: string;
}

const EVIDENCE_FILES: EvidenceFile[] = [
  {
    id: "manifest",
    name: "manifest.json",
    path: "/manifest.json",
    size: "1.4 KB",
    sha256: "8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    mime: "application/json",
    content: `{
  "$schema": "https://avenra.com/schemas/v1/evidence-manifest.json",
  "evidencePackageVersion": "1.0",
  "workId": "wrk_01HZX892KLA",
  "organizationId": "org_northwind_legal",
  "title": "Corporate Entity KYC Verification",
  "completedAt": "2026-11-09T16:45:00.000Z",
  "rootChecksum": {
    "algorithm": "SHA-256",
    "hash": "8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9"
  },
  "entries": [
    {
      "path": "documents/certificate_of_incorp.pdf",
      "sha256": "4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b",
      "sizeBytes": 2048576,
      "clamavStatus": "CLEAN"
    },
    {
      "path": "documents/director_registry.pdf",
      "sha256": "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
      "sizeBytes": 1492040,
      "clamavStatus": "CLEAN"
    },
    {
      "path": "checks-log.json",
      "sha256": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      "sizeBytes": 3210
    }
  ],
  "signatures": [
    {
      "role": "work.approve",
      "approverId": "usr_partner_jm",
      "approverName": "Jane Mugisha",
      "signedAt": "2026-11-09T16:44:52.120Z",
      "method": "ED25519"
    }
  ]
}`,
  },
  {
    id: "checks",
    name: "checks-log.json",
    path: "/checks-log.json",
    size: "3.2 KB",
    sha256: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    mime: "application/json",
    content: `{
  "evaluationId": "chk_run_7721",
  "evaluatedAt": "2026-11-09T16:42:15.842Z",
  "executionSummary": {
    "totalChecks": 4,
    "passed": 4,
    "failed": 0,
    "overridden": 0
  },
  "checks": [
    {
      "ruleId": "RULE_INCORP_DATE_VALIDITY",
      "ruleName": "Incorporation Date Within 10 Years",
      "status": "PASSED",
      "evaluatedValue": "2022-04-18",
      "expectedConstraint": ">= 2016-11-09",
      "deterministic": true
    },
    {
      "ruleId": "RULE_TAX_ID_REGEX",
      "ruleName": "Tax ID Format Verification",
      "status": "PASSED",
      "evaluatedValue": "US-EIN-94819024",
      "pattern": "^US-EIN-[0-9]{8}$",
      "deterministic": true
    },
    {
      "ruleId": "RULE_SANCTION_SCREENING",
      "ruleName": "OFAC Sanctions Registry Cross-Check",
      "status": "PASSED",
      "evaluatedValue": "Zero list matches found",
      "registryTimestamp": "2026-11-09T00:00:00Z"
    },
    {
      "ruleId": "RULE_MALWARE_FREE",
      "ruleName": "ClamAV Inbound Stream Scanning",
      "status": "PASSED",
      "evaluatedValue": "No known malware signatures",
      "engineVersion": "ClamAV 1.5.4"
    }
  ]
}`,
  },
  {
    id: "summary",
    name: "audit-summary.html",
    path: "/audit-summary.html",
    size: "4.8 KB",
    sha256: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    mime: "text/html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Avenra Evidence Summary - wrk_01HZX892KLA</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: auto; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
    .pass { background: #ECFDF3; color: #027A48; }
    .card { border: 1px solid #E4E7EC; border-radius: 8px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>Avenra Certified Evidence Summary</h1>
  <p>Deliverable ID: <strong>wrk_01HZX892KLA</strong></p>
  <p>Status: <span class="badge pass">VERIFIED & COMPLETED</span></p>
  <hr>
  <h3>Verification Trace</h3>
  <div class="card">
    <p>✓ Tax ID Format: <strong>PASSED</strong></p>
    <p>✓ Sanctions Registry Check: <strong>PASSED</strong></p>
    <p>✓ Antivirus Stream Scan: <strong>CLEAN</strong></p>
  </div>
  <h3>Chain of Custody Signature</h3>
  <p>Approved By: Jane Mugisha (Managing Partner)</p>
  <p>Signature: ED25519-SIG-8924bcf8912...</p>
</body>
</html>`,
  },
];

export function InteractiveEvidenceInspector() {
  const [activeFileId, setActiveFileId] = useState("manifest");
  const [copied, setCopied] = useState(false);
  const currentFile = (EVIDENCE_FILES.find((f) => f.id === activeFileId) ?? EVIDENCE_FILES[0])!;

  function copyHash() {
    void navigator.clipboard.writeText(currentFile.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      {/* Top Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <FolderLock className="size-5 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            Interactive Evidence Locker & Manifest Inspector
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-surface px-2.5 py-0.5 text-[10px] font-bold text-success">
            <CheckCircle2 className="size-3" /> SHA-256 SEAL VERIFIED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
        {/* Left: File Tree Explorer */}
        <div className="md:col-span-4 border-r border-border bg-background/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider px-2 py-1">
            <FolderOpen className="size-4 text-brand" />
            <span>wrk_01HZX892KLA.zip</span>
          </div>

          <div className="space-y-1 pl-2">
            {EVIDENCE_FILES.map((file) => {
              const isSelected = file.id === activeFileId;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all text-left ${
                    isSelected
                      ? "bg-brand text-background font-semibold shadow-sm"
                      : "text-text-primary hover:bg-canvas"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="size-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className={`text-[10px] shrink-0 ${isSelected ? "text-background/80" : "text-text-secondary"}`}>
                    {file.size}
                  </span>
                </button>
              );
            })}

            <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary opacity-60">
              <div className="flex items-center gap-2 truncate">
                <FileText className="size-3.5 shrink-0" />
                <span className="truncate">documents/cert_incorp.pdf</span>
              </div>
              <span className="text-[10px]">2.0 MB</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary opacity-60">
              <div className="flex items-center gap-2 truncate">
                <FileText className="size-3.5 shrink-0" />
                <span className="truncate">documents/registry.pdf</span>
              </div>
              <span className="text-[10px]">1.4 MB</span>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-canvas p-3.5 text-[11px] text-text-secondary space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Lock className="size-3.5 text-brand" />
              <span>Offline Verifiable</span>
            </div>
            <p className="leading-relaxed">
              Auditors can inspect this self-contained archive on an air-gapped laptop with zero network dependencies.
            </p>
          </div>
        </div>

        {/* Right: Live File & Hash Viewer */}
        <div className="md:col-span-8 flex flex-col justify-between bg-canvas">
          <div className="p-4 md:p-6 space-y-4">
            {/* File metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="text-xs font-bold text-text-primary block font-mono">
                  {currentFile.path}
                </span>
                <span className="text-[10px] text-text-secondary">
                  MIME: {currentFile.mime} · Size: {currentFile.size}
                </span>
              </div>

              {/* Checksum copy */}
              <button
                type="button"
                onClick={copyHash}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-mono text-text-secondary hover:text-text-primary shadow-sm"
              >
                {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                <span>{copied ? "Copied SHA-256" : "Copy Hash"}</span>
              </button>
            </div>

            {/* SHA-256 Hash Display */}
            <div className="rounded-lg bg-background p-2.5 border border-border font-mono text-[10px] text-text-secondary break-all">
              <span className="text-brand font-bold mr-1">SHA256:</span>
              {currentFile.sha256}
            </div>

            {/* Code / Content Box */}
            <div className="rounded-xl border border-border bg-background p-4 max-h-[280px] overflow-auto font-mono text-xs text-text-primary leading-relaxed">
              <pre>{currentFile.content}</pre>
            </div>
          </div>

          {/* S3 Storage Location footer */}
          <div className="border-t border-border bg-background/60 px-6 py-3 flex items-center justify-between text-xs text-text-secondary">
            <span className="font-mono text-[11px]">
              Custody: <span className="text-text-primary font-bold">s3://customer-vault/evidence/2026/wrk_01HZX892KLA.zip</span>
            </span>
            <span className="text-success font-semibold flex items-center gap-1">
              ✓ Direct Bucket Write
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
