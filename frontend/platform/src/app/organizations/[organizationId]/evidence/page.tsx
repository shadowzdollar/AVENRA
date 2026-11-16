"use client";

import { useQuery } from "@tanstack/react-query";
import { FileCheck2, FileText } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { EmptyState, PageHeader, Panel, Pill, TABLE, type Tone } from "@/components/ui";
import { api, unwrap } from "@/lib/api";

type Kind = components["schemas"]["Evidence"]["kind"];

const KINDS: Record<Kind, { label: string; tone: Tone }> = {
  ANSWER: { label: "Answer", tone: "neutral" },
  DOCUMENT_VERSION: { label: "Document", tone: "neutral" },
  VERIFICATION: { label: "Check", tone: "brand" },
  HUMAN_DECISION: { label: "Person's decision", tone: "success" },
  SYSTEM_DECISION: { label: "Avenra's decision", tone: "brand" },
};

function Evidence({ id }: { id: string }) {
  const [kind, setKind] = useState<Kind | "ALL">("ALL");
  const evidence = useQuery({
    queryKey: ["organization", id, "evidence", kind],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/evidence", { params: { path: { organizationId: id }, query: kind === "ALL" ? {} : { kind } } })),
  });
  const rows = evidence.data ?? [];
  return (
    <div>
      <PageHeader title="Evidence" subtitle="The record behind every result: answers, documents, checks and decisions. Evidence never changes once recorded." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Show">
        {(["ALL", ...Object.keys(KINDS)] as (Kind | "ALL")[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={`rounded-full border px-3 py-1 text-[12px] ${kind === option ? "border-brand bg-brand-surface font-medium text-brand" : "border-border bg-background text-text-secondary"}`}
          >
            {option === "ALL" ? "All" : KINDS[option].label}
          </button>
        ))}
      </div>
      <Panel flush>
        {evidence.isSuccess && rows.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No evidence yet">
            Evidence is recorded as answers arrive, documents are checked and people decide.
          </EmptyState>
        ) : (
          <div className={TABLE.wrap}>
            <table className={TABLE.table} data-testid="evidence">
              <thead>
                <tr>
                  {["Evidence", "Work", "Kind", "Fingerprint", "Recorded"].map((heading) => (
                    <th key={heading} className={TABLE.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className={TABLE.row}>
                    <td className={TABLE.td}>
                      <span className="flex items-center gap-2 font-medium">
                        <FileText className="size-4 shrink-0 text-text-secondary" />
                        {item.description}
                      </span>
                    </td>
                    <td className={TABLE.td}>
                      {item.workId ? (
                        <Link href={`/organizations/${id}/work/${item.workId}`} className="text-brand">
                          {item.workTitle ?? "Work"}
                        </Link>
                      ) : null}
                    </td>
                    <td className={TABLE.td}>
                      <Pill tone={KINDS[item.kind].tone}>{KINDS[item.kind].label}</Pill>
                    </td>
                    <td className={`${TABLE.td} font-mono text-[11px] text-text-secondary`} title={item.fingerprint}>
                      {item.fingerprint ? `${item.fingerprint.slice(0, 12)}…` : "—"}
                    </td>
                    <td className={`${TABLE.td} whitespace-nowrap tabular-nums text-text-secondary`}>{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function EvidencePage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Evidence id={organizationId} />;
}
