"use client";

import { Check, Copy, Play, Terminal } from "lucide-react";
import { useState } from "react";

interface TerminalCommand {
  id: string;
  label: string;
  command: string;
  response: string;
  logs: string[];
}

const COMMANDS: TerminalCommand[] = [
  {
    id: "create-work",
    label: "1. Initialize Deliverable",
    command: `curl -X POST "https://api.avenra.com/api/v1/organizations/org_summit_legal/work" \\
  -H "Authorization: Bearer av_sec_89f01a3b4c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Cross-Border Series B Securities Closing",
    "clientIdentifier": "cli_meridian_capital",
    "priority": "HIGH",
    "tags": ["corporate", "securities", "series-b"]
  }'`,
    response: `{
  "id": "wrk_01HZX892KLA",
  "organizationId": "org_summit_legal",
  "title": "Cross-Border Series B Securities Closing",
  "status": "PENDING",
  "currentStep": "01_INITIATED",
  "clientIdentifier": "cli_meridian_capital",
  "createdAt": "2026-11-09T17:15:00.120Z",
  "idempotencyKey": "idem_8f902ba14",
  "evidenceLockerId": "evd_99182301"
}`,
    logs: [
      "[17:15:00.122] [audit] Transaction committed: work.create [wrk_01HZX892KLA]",
      "[17:15:00.124] [rls] PostgreSQL RLS context set: app.current_organization_id = org_summit_legal",
      "[17:15:00.126] [state-machine] Transitioned from INITIAL to PENDING (Event: work.create)",
    ],
  },
  {
    id: "magic-request",
    label: "2. Dispatch Client Magic Portal",
    command: `curl -X POST "https://api.avenra.com/api/v1/organizations/org_summit_legal/requests" \\
  -H "Authorization: Bearer av_sec_89f01a3b4c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workId": "wrk_01HZX892KLA",
    "recipientEmail": "cfo@meridiancap.com",
    "title": "Series B Certified Cap Table & Investor Warrant Ledger",
    "requiredFileTypes": ["application/pdf", "application/vnd.ms-excel"],
    "expiresInDays": 7
  }'`,
    response: `{
  "requestId": "req_01HZX90192A",
  "workId": "wrk_01HZX892KLA",
  "status": "AWAITING_CLIENT_INPUT",
  "magicUrl": "https://avenra.link/r/req_tok_7a9f8b2c?sig=e3b0c44298fc",
  "expiresAt": "2026-11-16T17:15:00.000Z",
  "automatedRemindersActive": true
}`,
    logs: [
      "[17:15:02.301] [mail] Dispatched Magic Portal invitation to cfo@meridiancap.com via Mailpit/SES",
      "[17:15:02.305] [security] Ephemeral token generated with HMAC-SHA256 signature",
      "[17:15:02.310] [state-machine] Deliverable wrk_01HZX892KLA transitioned to AWAITING_CLIENT_INPUT",
    ],
  },
  {
    id: "run-verification",
    label: "3. Evaluate Checkpoints",
    command: `curl -X POST "https://api.avenra.com/api/v1/organizations/org_summit_legal/work/wrk_01HZX892KLA/verify" \\
  -H "Authorization: Bearer av_sec_89f01a3b4c"`,
    response: `{
  "workId": "wrk_01HZX892KLA",
  "overallResult": "PASSED",
  "evaluatedRules": [
    { "ruleId": "chk_clamav_antivirus", "status": "PASSED", "durationMs": 42 },
    { "ruleId": "chk_cap_table_sum", "status": "PASSED", "durationMs": 18 },
    { "ruleId": "chk_investor_kyc_match", "status": "PASSED", "durationMs": 95 },
    { "ruleId": "chk_signatory_resolution", "status": "PASSED", "durationMs": 28 }
  ],
  "humanApprovalRequired": true,
  "assignedOperatorRole": "FINANCIAL_PRINCIPAL"
}`,
    logs: [
      "[17:15:08.410] [clamav] Upload stream inspected: 0 virus signatures matched. Stream clean.",
      "[17:15:08.430] [verification] Mathematical rule evaluated: 100.00% cap table balance verified",
      "[17:15:08.520] [state-machine] Transitioned to AWAITING_APPROVAL (Gate: all_checks_passed)",
    ],
  },
  {
    id: "seal-evidence",
    label: "4. Cryptographic Seal & S3 Export",
    command: `curl -X POST "https://api.avenra.com/api/v1/organizations/org_summit_legal/work/wrk_01HZX892KLA/complete" \\
  -H "Authorization: Bearer av_sec_89f01a3b4c" \\
  -H "Content-Type: application/json" \\
  -d '{"signedBy": "sarah.jenkins@summitlegal.com", "decision": "APPROVED"}'`,
    response: `{
  "workId": "wrk_01HZX892KLA",
  "status": "COMPLETED",
  "sealedAt": "2026-11-09T17:15:12.890Z",
  "evidencePackage": {
    "sha256": "8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a34b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
    "s3Uri": "s3://summit-legal-sovereign-vault/evidence/wrk_01HZX892KLA.zip",
    "presignedDownloadUrl": "https://s3.us-east-1.amazonaws.com/summit-legal-sovereign-vault/evidence/wrk_01HZX892KLA.zip?X-Amz-Expires=900...",
    "manifestHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}`,
    logs: [
      "[17:15:12.892] [evidence] Evidence pack compiled: 4 documents, audit summary HTML, checks trace",
      "[17:15:12.910] [crypto] Computed SHA-256 root hash: 8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a3...",
      "[17:15:12.940] [s3] Sovereign bucket upload complete: s3://summit-legal-sovereign-vault/evidence/...",
      "[17:15:12.945] [webhook] HMAC-signed webhook dispatched to https://summit.internal/hooks/closing",
    ],
  },
];

export function EnterpriseTerminalConsole() {
  const [activeCmdId, setActiveCmdId] = useState<string>("create-work");
  const [copied, setCopied] = useState(false);
  const current = COMMANDS.find((c) => c.id === activeCmdId) ?? COMMANDS[0]!;

  function copyCommand() {
    void navigator.clipboard.writeText(current.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card font-mono text-xs">
      {/* Top Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex flex-wrap items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-5 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            Avenra Enterprise Command Center & Execution Trace
          </span>
        </div>
        <span className="rounded-full bg-success-surface px-2.5 py-0.5 text-[10px] font-bold text-success flex items-center gap-1 font-mono">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          SYSTEM LIVE ON 127.0.0.1:8080
        </span>
      </div>

      {/* Command Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-background/50 font-sans">
        {COMMANDS.map((cmd) => {
          const isActive = cmd.id === activeCmdId;
          return (
            <button
              key={cmd.id}
              type="button"
              onClick={() => setActiveCmdId(cmd.id)}
              className={`p-3.5 text-left transition-all border-r border-border last:border-r-0 ${
                isActive
                  ? "bg-canvas border-b-2 border-b-brand font-bold text-brand"
                  : "text-text-secondary hover:text-text-primary hover:bg-canvas/40"
              }`}
            >
              {cmd.label}
            </button>
          );
        })}
      </div>

      {/* Terminal Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border bg-[#0d1117] text-[#c9d1d9]">
        {/* Left: Input Command */}
        <div className="p-5 md:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-[11px] text-[#8b949e]">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Play className="size-3 text-brand" /> Request Payload
              </span>
              <button
                type="button"
                onClick={copyCommand}
                className="flex items-center gap-1 rounded bg-[#21262d] px-2 py-0.5 text-[10px] text-[#c9d1d9] hover:bg-[#30363d] transition-colors"
              >
                {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy cURL"}
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#79c0ff] whitespace-pre-wrap">
              {current.command}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-[#30363d] text-[10px] text-[#8b949e] flex items-center justify-between">
            <span>Protocol: HTTP/1.1 over TLS 1.3</span>
            <span>Auth: Bearer Scoped Token</span>
          </div>
        </div>

        {/* Right: API Response & Audit Log */}
        <div className="p-5 md:col-span-6 flex flex-col justify-between bg-[#161b22]">
          <div>
            <div className="flex items-center justify-between mb-3 text-[11px] text-[#8b949e]">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-success">
                <Check className="size-3" /> HTTP 200 OK Response
              </span>
              <span className="text-[10px] text-[#8b949e] font-mono">
                Duration: 14ms
              </span>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#7ee787] max-h-56">
              {current.response}
            </pre>

            <div className="mt-4 border-t border-[#30363d] pt-3">
              <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider block mb-2">
                Real-Time Monolith Event Trace
              </span>
              <div className="space-y-1">
                {current.logs.map((log, idx) => (
                  <div key={idx} className="text-[10px] text-[#d2a8ff] font-mono leading-tight">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
