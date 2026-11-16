import type { components } from "@avenra/contracts";

type VerificationResult = components["schemas"]["VerificationResult"];

const STATUS: Record<VerificationResult["status"], { label: string; tone: string }> = {
  PASSED: { label: "Checks passed", tone: "text-success" },
  FAILED: { label: "Checks failed", tone: "text-error" },
  NEEDS_REVIEW: { label: "Needs a closer look", tone: "text-warning" },
};

const OUTCOME: Record<"PASSED" | "FAILED" | "SKIPPED", string> = {
  PASSED: "✓",
  FAILED: "✗",
  SKIPPED: "…",
};

/** The structured result of verifying an answer (Guidelines §25): every check and its outcome. */
export function ChecksView({ result }: { result: VerificationResult }) {
  if (result.checks.length === 0) {
    return <p className="text-sm text-text-secondary">No checks defined.</p>;
  }
  const status = STATUS[result.status];
  return (
    <div className="text-sm" data-testid="checks">
      <p className={`font-medium ${status.tone}`} data-testid="checks-status">
        {status.label}
        {result.confidence !== undefined && result.confidence !== null ? <span className="font-normal text-text-secondary"> · confidence {Math.round(result.confidence * 100)}%</span> : null}
      </p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {result.checks.map((check, index) => (
          <li key={index} className={check.outcome === "FAILED" ? "text-error" : check.outcome === "SKIPPED" ? "text-text-secondary" : ""}>
            <span aria-hidden>{OUTCOME[check.outcome]} </span>
            {check.outcome === "PASSED" ? `${check.message} — ok` : check.message}
            {check.outcome === "SKIPPED" ? ` (${check.detail ?? "waiting for the related answer"})` : ""}
            {check.aiDerived && check.outcome !== "SKIPPED" && check.detail ? <span className="text-text-secondary"> — {check.detail}</span> : null}
            {check.aiDerived ? (
              <span className="text-text-secondary"> · read automatically, advisory</span>
            ) : check.severity === "ADVISORY" ? (
              <span className="text-text-secondary"> · advisory</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
