"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ListChecks, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Alert, Avatar, EmptyState, PageHeader, Panel, Pill, TABLE, buttonClass } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { completenessSummary, errorText, statusLabel, statusTone, type WorkStatus } from "@/lib/work";

const FILTERS: ("ALL" | WorkStatus)[] = ["ALL", "DRAFT", "RUNNING", "WAITING_FOR_INFORMATION", "WAITING_FOR_APPROVAL", "BLOCKED", "COMPLETED"];

function WorkList({ organizationId }: { organizationId: string }) {
  const permissions = usePermissions(organizationId);
  const q = useSearchParams().get("q")?.trim() ?? "";
  const [filter, setFilter] = useState<"ALL" | WorkStatus>("ALL");
  const path = { params: { path: { organizationId } } };
  const work = useQuery({
    queryKey: ["organization", organizationId, "work", filter, q],
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/organizations/{organizationId}/work", {
          params: { path: { organizationId }, query: { ...(filter === "ALL" ? {} : { status: filter }), ...(q ? { q } : {}) } },
        }),
      ),
  });
  const clients = useQuery({
    queryKey: ["organization", organizationId, "clients"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/clients", path)),
  });
  const members = useQuery({
    queryKey: ["organization", organizationId, "members"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/members", path)),
    enabled: permissions.has("members.read"),
  });
  const clientName = (id: string | undefined) => clients.data?.find((client) => client.id === id)?.name;
  const ownerName = (id: string | undefined) => members.data?.find((member) => member.membershipId === id)?.displayName;
  const rows = work.data ?? [];

  return (
    <div>
      <PageHeader
        title="Work"
        subtitle={q ? `Work whose title contains “${q}”.` : "Every piece of work, where it stands, and what it still needs."}
        actions={
          permissions.has("work.create") ? (
            <Link href={`/organizations/${organizationId}/work/new`} className={buttonClass("primary")}>
              <Plus />
              New work
            </Link>
          ) : null
        }
      />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Status">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              filter === option ? "border-brand bg-brand-surface font-medium text-brand" : "border-border bg-background text-text-secondary hover:text-text-primary"
            }`}
          >
            {option === "ALL" ? "All" : statusLabel(option)}
          </button>
        ))}
      </div>
      {work.error ? <Alert tone="error">{errorText(work.error)}</Alert> : null}
      <Panel flush>
        {work.isSuccess && rows.length === 0 ? (
          <EmptyState icon={ListChecks} title={q || filter !== "ALL" ? "Nothing matches" : "No work yet"}>
            {q || filter !== "ALL" ? "Try another status or search." : "Define the first piece of work: what needs to be true, for whom, by when."}
          </EmptyState>
        ) : (
          <div className={TABLE.wrap}>
            <table className={TABLE.table} data-testid="work-list">
              <thead>
                <tr>
                  {["Work", "Type", "Owner", "Information", "Progress", "Status", "Due", ""].map((heading) => (
                    <th key={heading} className={TABLE.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const summary = completenessSummary(item.completeness);
                  const owner = ownerName(item.ownerMembershipId);
                  return (
                    <tr key={item.id} className={TABLE.row}>
                      <td className={TABLE.td}>
                        <Link href={`/organizations/${organizationId}/work/${item.id}`} className="block">
                          <span className="block font-medium hover:text-brand">{item.title}</span>
                          {clientName(item.clientId) ? <span className="block text-[12px] text-text-secondary">{clientName(item.clientId)}</span> : null}
                        </Link>
                      </td>
                      <td className={`${TABLE.td} text-text-secondary`}>{item.type ?? "—"}</td>
                      <td className={TABLE.td}>
                        {owner ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={owner} />
                            {owner}
                          </span>
                        ) : (
                          <span className="text-text-secondary">—</span>
                        )}
                      </td>
                      <td className={`${TABLE.td} tabular-nums`}>
                        {item.completeness.accepted}/{item.completeness.required}
                        {item.openExceptions ? (
                          <span className="ml-2 text-[11px] text-warning">
                            {item.openExceptions} exc.
                          </span>
                        ) : null}
                      </td>
                      <td className={TABLE.td}>
                        <div className="flex w-28 items-center gap-2">
                          <progress className="completeness h-1.5 flex-1" value={summary.ratio} max={1} aria-label={summary.text} />
                          <span className="text-[11px] text-text-secondary">{Math.round(summary.ratio * 100)}%</span>
                        </div>
                      </td>
                      <td className={TABLE.td}>
                        <Pill tone={statusTone(item.status)}>{statusLabel(item.status)}</Pill>
                      </td>
                      <td className={`${TABLE.td} whitespace-nowrap text-text-secondary`}>
                        {item.dueAt ? new Date(item.dueAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className={TABLE.td}>
                        <Link href={`/organizations/${organizationId}/work/${item.id}`} aria-label={`Open ${item.title}`}>
                          <ChevronRight className="size-4 text-text-secondary" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function WorkPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <Suspense>
      <WorkList organizationId={organizationId} />
    </Suspense>
  );
}
