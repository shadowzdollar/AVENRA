"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { Alert, Button, EmptyState, PageHeader, Panel, Pill, Stat, TABLE, type Tone } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { requestState, type RequestState } from "@/lib/requests";

type RequestLink = components["schemas"]["RequestLink"];
type Filter = "ALL" | RequestLink["status"];

const STATE: Record<RequestState, { label: string; tone: Tone }> = {
  ANSWERED: { label: "Answered", tone: "success" },
  WAITING: { label: "Waiting", tone: "brand" },
  EXPIRING: { label: "Expires soon", tone: "warning" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  REVOKED: { label: "Revoked", tone: "neutral" },
};

function day(value: string): string {
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function Requests({ id }: { id: string }) {
  const queries = useQueryClient();
  const permissions = usePermissions(id);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const requests = useQuery({
    queryKey: ["organization", id, "request-links", "all"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/request-links", { params: { path: { organizationId: id } } })),
  });
  const remind = useMutation({
    mutationFn: async (request: RequestLink) =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/request-links/{requestLinkId}/reminders", {
          params: { path: { organizationId: id, workId: request.workId, requestLinkId: request.id } },
        }),
      ),
    onSuccess: (_, request) => setNotice(`A reminder is on its way to ${request.recipientName ?? request.recipientEmail}.`),
    onSettled: () => void queries.invalidateQueries({ queryKey: ["organization", id, "request-links"] }),
  });
  const now = new Date();
  const all = requests.data ?? [];
  const rows = filter === "ALL" ? all : all.filter((request) => request.status === filter);
  const states = all.map((request) => requestState(request, now));
  const count = (state: RequestState) => states.filter((value) => value === state).length;

  return (
    <div>
      <PageHeader title="Requests" subtitle="What has been asked of clients, by whom, and where each request stands." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Waiting for answers" value={count("WAITING") + count("EXPIRING")} testId="requests-waiting" />
        <Stat label="Expiring within 2 days" value={count("EXPIRING")} />
        <Stat label="Answered" value={count("ANSWERED")} />
        <Stat label="Expired or revoked" value={count("EXPIRED") + count("REVOKED")} />
      </div>
      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}
      {remind.error ? (
        <div className="mb-4">
          <Alert tone="error">{remind.error instanceof ApiError ? remind.error.message : "The reminder could not be sent."}</Alert>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Show">
        {(["ALL", "ACTIVE", "EXPIRED", "REVOKED"] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              filter === option ? "border-brand bg-brand-surface font-medium text-brand" : "border-border bg-background text-text-secondary hover:text-text-primary"
            }`}
          >
            {option === "ALL" ? "All" : option.charAt(0) + option.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <Panel flush>
        {requests.isSuccess && rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No requests here">
            Requests are sent from a work item, to ask a client for exactly what it still needs.
          </EmptyState>
        ) : (
          <div className={TABLE.wrap}>
            <table className={TABLE.table} data-testid="requests">
              <thead>
                <tr>
                  {["Work", "Recipient", "Sent", "Answered", "Reminders", "State", ""].map((heading) => (
                    <th key={heading} className={TABLE.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((request) => {
                  const state = STATE[requestState(request, now)];
                  const canRemind = permissions.has("information.collect") && request.status === "ACTIVE" && (request.answeredCount ?? 0) < request.requirementIds.length;
                  return (
                    <tr key={request.id} className={TABLE.row}>
                      <td className={TABLE.td}>
                        <Link href={`/organizations/${id}/work/${request.workId}`} className="font-medium hover:text-brand">
                          {request.workTitle ?? "Work"}
                        </Link>
                      </td>
                      <td className={TABLE.td}>
                        <p>{request.recipientName ?? request.recipientEmail}</p>
                        {request.recipientName ? <p className="text-[12px] text-text-secondary">{request.recipientEmail}</p> : null}
                      </td>
                      <td className={`${TABLE.td} whitespace-nowrap text-text-secondary`}>
                        {day(request.createdAt)}
                        <span className="block text-[11px]">until {day(request.expiresAt)}</span>
                      </td>
                      <td className={`${TABLE.td} tabular-nums`}>
                        {request.answeredCount ?? 0} of {request.requirementIds.length}
                      </td>
                      <td className={`${TABLE.td} tabular-nums`}>{request.remindersSent}</td>
                      <td className={TABLE.td}>
                        <Pill tone={state.tone}>{state.label}</Pill>
                      </td>
                      <td className={`${TABLE.td} text-right`}>
                        {canRemind ? (
                          <Button variant="secondary" size="sm" busy={remind.isPending && remind.variables?.id === request.id} onClick={() => remind.mutate(request)}>
                            <Send />
                            Remind
                          </Button>
                        ) : null}
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

export default function RequestsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Requests id={organizationId} />;
}
