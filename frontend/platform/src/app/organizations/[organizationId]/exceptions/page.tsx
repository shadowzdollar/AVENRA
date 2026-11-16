"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ExceptionRow } from "@/components/exception-row";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";

function Exceptions({ id }: { id: string }) {
  const permissions = usePermissions(id);
  const [openOnly, setOpenOnly] = useState(true);
  const exceptions = useQuery({
    queryKey: ["organization", id, "exceptions", openOnly ? "open-only" : "all"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/exceptions", { params: { path: { organizationId: id }, query: openOnly ? { open: true } : {} } })),
  });
  const work = useQuery({
    queryKey: ["organization", id, "work", "all"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work", { params: { path: { organizationId: id } } })),
  });
  const titles = new Map((work.data ?? []).map((item) => [item.id, item.title]));
  const list = exceptions.data ?? [];

  return (
    <div>
      <PageHeader title="Exceptions" subtitle="Why something is blocked, how serious it is, and what resolves it." />
      <div className="mb-4 flex gap-2" role="group" aria-label="Show">
        {[
          { label: "Open", value: true },
          { label: "All", value: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={openOnly === option.value}
            onClick={() => setOpenOnly(option.value)}
            className={`rounded-full border px-3 py-1 text-[12px] ${openOnly === option.value ? "border-brand bg-brand-surface font-medium text-brand" : "border-border bg-background text-text-secondary"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Panel>
        {exceptions.isSuccess && list.length === 0 ? (
          <EmptyState icon={CheckCircle2} title={openOnly ? "No open exceptions" : "No exceptions yet"}>
            {openOnly ? "All work is unblocked." : "Exceptions appear when information is missing, inconsistent or late."}
          </EmptyState>
        ) : (
          <ul className="-my-4 divide-y divide-border" data-testid="exceptions">
            {list.map((exception) => (
              <ExceptionRow
                key={exception.id}
                ids={{ organizationId: id }}
                exception={exception}
                canUpdate={permissions.has("work.update")}
                work={exception.workId ? { id: exception.workId, title: titles.get(exception.workId) ?? "Work" } : undefined}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export default function ExceptionsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Exceptions id={organizationId} />;
}
