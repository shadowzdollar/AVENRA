"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RunView } from "@/components/agent-run";
import { EmptyState, PageHeader, Panel, Pill } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";

function Approvals({ id }: { id: string }) {
  const queries = useQueryClient();
  const permissions = usePermissions(id);
  const key = ["organization", id, "agent-runs", "AWAITING_APPROVAL"];
  const runs = useQuery({
    queryKey: key,
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/agent-runs", { params: { path: { organizationId: id }, query: { status: "AWAITING_APPROVAL" } } })),
    refetchInterval: 15_000,
  });
  const refresh = () => {
    void queries.invalidateQueries({ queryKey: ["organization", id, "agent-runs"] });
    void queries.invalidateQueries({ queryKey: ["organization", id, "work"] });
  };

  return (
    <div>
      <PageHeader title="Approvals" subtitle="The assistant never takes a step on its own: a person approves the plan, and every high-risk step separately." />
      {runs.isSuccess && runs.data.length === 0 ? (
        <Panel>
          <EmptyState icon={ShieldCheck} title="Nothing waiting for a decision">
            When the assistant proposes a plan for a piece of work, it appears here until someone who may approve work decides.
          </EmptyState>
        </Panel>
      ) : null}
      <div className="space-y-4" data-testid="approvals">
        {runs.data?.map((run) => (
          <Panel key={run.id}>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-surface">
                <ShieldCheck className="size-5 text-brand" />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/organizations/${id}/work/${run.workId}`} className="text-[15px] font-semibold hover:text-brand">
                  {run.workTitle ?? "Work"}
                </Link>
                <p className="text-[12px] text-text-secondary">Proposed {new Date(run.createdAt).toLocaleString()}</p>
              </div>
              <Pill tone="brand">{run.steps.length} step{run.steps.length === 1 ? "" : "s"}</Pill>
            </div>
            <div className="text-[13px]">
              <RunView
                ids={{ organizationId: id, workId: run.workId }}
                run={run}
                canApprove={permissions.has("work.approve")}
                canStop={permissions.has("work.update")}
                onChange={refresh}
              />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Approvals id={organizationId} />;
}
