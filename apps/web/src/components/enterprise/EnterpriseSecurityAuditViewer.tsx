"use client";

import { CheckCircle2, Shield } from "lucide-react";
import { useState } from "react";

interface SecurityControlAudit {
  controlId: string;
  name: string;
  framework: string;
  status: "VERIFIED" | "CONTINUOUS" | "AUTOMATED";
  testCadence: string;
  technicalImplementation: string;
  codeReference: string;
}

const CONTROLS: SecurityControlAudit[] = [
  {
    controlId: "SEC-RLS-01",
    name: "Database-Level Tenant Data Isolation",
    framework: "Access Control & Row-Level Isolation",
    status: "CONTINUOUS",
    testCadence: "On every SQL query (PostgreSQL RLS enforced)",
    technicalImplementation: "PostgreSQL native Row-Level Security policies bound to session context. Client tenant headers rejected at reverse proxy.",
    codeReference: "apps/api/src/main/resources/db/migration/ (RLS Policies)",
  },
  {
    controlId: "SEC-CRYPTO-02",
    name: "AES-256-GCM Credential Encryption & Rotation",
    framework: "NIST SP 800-38D · SecretBox",
    status: "VERIFIED",
    testCadence: "Per sensitive credential store & key rotation",
    technicalImplementation: "Credentials sealed with SecretBox (AES-GCM, key id, associated data = connection id), stored only as ciphertext.",
    codeReference: "apps/api/src/main/java/com/avenra/integrations/domain/SecretBox.java",
  },
  {
    controlId: "SEC-SCAN-03",
    name: "Zero-Disk Upload Stream Antivirus Inspection",
    framework: "Malware Defense & Stream Inspection",
    status: "AUTOMATED",
    testCadence: "Inline on every file byte stream before download is allowed",
    technicalImplementation: "Incoming multipart streams are piped to ClamAV daemon. Infected streams quarantined immediately.",
    codeReference: "apps/api/src/main/java/com/avenra/document/storage/",
  },
  {
    controlId: "SEC-AUDIT-04",
    name: "Append-Only Audit Trail & Manifest Sealing",
    framework: "Audit Ledger & Evidence Integrity",
    status: "CONTINUOUS",
    testCadence: "On every state transition, check, or approval",
    technicalImplementation: "Every event is recorded with actor attribution, timestamp, and SHA-256 deliverable state digest.",
    codeReference: "apps/api/src/main/resources/db/migration/V2__audit_ledger.sql",
  },
  {
    controlId: "SEC-EPHEM-05",
    name: "Zero-Persistence AI Worker Memory Boundary",
    framework: "GDPR Article 28 · EU AI Act Article 10",
    status: "VERIFIED",
    testCadence: "Stateless container process lifecycle",
    technicalImplementation: "Python FastAPI worker performs OCR/extraction purely in ephemeral RAM buffers. Contains zero database connections and retains 0 client bytes.",
    codeReference: "apps/ai/src/avenra_ai/main.py (Stateless App Factory)",
  },
];

export function EnterpriseSecurityAuditViewer() {
  const [selectedControlId, setSelectedControlId] = useState<string>("SEC-RLS-01");
  const selected = CONTROLS.find((c) => c.controlId === selectedControlId) ?? CONTROLS[0]!;

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      <div className="border-b border-border bg-background px-6 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Automated Control Verification
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Continuous Infosec & Code-Level Controls Ledger
            </h3>
            <p className="mt-1 text-xs text-text-secondary md:text-sm max-w-3xl">
              Controls are not checked off once a year during an audit review. They are verified by continuous integration tests running against real database kernels.
            </p>
          </div>

          <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-bold text-success flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="size-3.5" /> 100% CONTROLS PASSING
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left: Controls Selector */}
        <div className="md:col-span-5 bg-background/50 divide-y divide-border">
          {CONTROLS.map((ctrl) => {
            const isSelected = ctrl.controlId === selectedControlId;
            return (
              <button
                key={ctrl.controlId}
                type="button"
                onClick={() => setSelectedControlId(ctrl.controlId)}
                className={`w-full p-4 text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-canvas border-l-4 border-l-brand"
                    : "hover:bg-canvas/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-brand">
                    {ctrl.controlId}
                  </span>
                  <span className="rounded-full bg-success-surface px-2 py-0.5 text-[9px] font-bold text-success">
                    {ctrl.status}
                  </span>
                </div>
                <h4 className="mt-1 text-xs font-bold text-text-primary">
                  {ctrl.name}
                </h4>
                <span className="mt-1 text-[10px] text-text-secondary line-clamp-1">
                  {ctrl.framework}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Technical Control Details */}
        <div className="md:col-span-7 p-6 md:p-8 space-y-6 bg-canvas flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-mono text-xs font-bold text-brand">
                {selected.controlId} · {selected.framework}
              </span>
              <span className="text-[11px] font-bold text-success">
                Passed Automated Verification
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-text-primary">
              {selected.name}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                  Evaluation Cadence
                </span>
                <span className="text-xs font-medium text-text-primary mt-0.5 block">
                  {selected.testCadence}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                  Technical Architecture
                </span>
                <p className="text-xs leading-relaxed text-text-secondary mt-1">
                  {selected.technicalImplementation}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                  Codebase & Migration Reference
                </span>
                <div className="mt-1 rounded-xl border border-border bg-background p-3 font-mono text-[11px] text-text-primary">
                  {selected.codeReference}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
            <span>Verified in CI Pipeline</span>
            <span className="font-mono text-brand font-bold">Semgrep & Dependabot Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
