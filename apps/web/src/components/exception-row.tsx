"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Alert, Button, Field, Pill } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { errorText } from "@/lib/work";

type WorkException = components["schemas"]["WorkException"];
type ExceptionStatus = components["schemas"]["ExceptionStatus"];

const EXCEPTION_ACTIONS: { to: ExceptionStatus; label: string }[] = [
  { to: "IN_PROGRESS", label: "Working on it" },
  { to: "WAITING", label: "Waiting" },
  { to: "RESOLVED", label: "Resolve" },
  { to: "DISMISSED", label: "Dismiss" },
];

/** One exception with the moves its lifecycle allows (ADR-024); closing needs a resolution. */
export function ExceptionRow({
  ids,
  exception,
  canUpdate,
  work,
}: {
  ids: { organizationId: string };
  exception: WorkException;
  canUpdate: boolean;
  /** Shown in organization-wide lists, where the work is not obvious. */
  work?: { id: string; title: string } | undefined;
}) {
  const queries = useQueryClient();
  const [resolution, setResolution] = useState("");
  const move = useMutation({
    mutationFn: async (to: ExceptionStatus) =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/exceptions/{exceptionId}/transitions", {
          params: { path: { organizationId: ids.organizationId, exceptionId: exception.id } },
          body: to === "RESOLVED" || to === "DISMISSED" ? { to, expectedStatus: exception.status, resolution } : { to, expectedStatus: exception.status },
        }),
      ),
    onSuccess: () => {
      setResolution("");
      void queries.invalidateQueries({ queryKey: ["organization", ids.organizationId] });
    },
  });
  const open = exception.allowedTransitions.length > 0;
  return (
    <li className="py-4 text-[13px]" data-testid={`exception-${exception.type}`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${exception.severity === "HIGH" ? "bg-error-surface" : "bg-warning-surface"}`}>
          <AlertTriangle className={`size-5 ${exception.severity === "HIGH" ? "text-error" : "text-warning"}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold first-letter:uppercase">{exception.type.replaceAll("_", " ").toLowerCase()}</p>
            <Pill tone={exception.severity === "HIGH" ? "error" : "warning"}>{exception.severity.toLowerCase()} severity</Pill>
          </div>
          {work ? (
            <p className="mt-1 text-[12px] text-text-secondary">
              <Link href={`/organizations/${ids.organizationId}/work/${work.id}`} className="text-brand">
                {work.title}
              </Link>{" "}
              · opened {new Date(exception.createdAt).toLocaleString()}
            </p>
          ) : null}
          <div className="mt-3 rounded-xl border-l-2 border-brand bg-brand-surface p-3 leading-relaxed">
            <span className="font-medium">Why this happened: </span>
            {exception.description}
          </div>
          {exception.resolution ? <p className="mt-2 text-text-secondary">Resolution: {exception.resolution}</p> : null}
        </div>
        <span data-testid="exception-status">
          <Pill tone={open ? "neutral" : "success"}>{exception.status.replaceAll("_", " ").toLowerCase()}</Pill>
        </span>
      </div>
      {open && canUpdate ? (
        <div className="mt-3 flex flex-col gap-2 sm:ml-14 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Resolution (needed to resolve or dismiss)" maxLength={2000} value={resolution} onChange={(e) => setResolution(e.target.value)} />
          </div>
          {EXCEPTION_ACTIONS.filter((action) => exception.allowedTransitions.includes(action.to)).map((action) => (
            <Button
              key={action.to}
              variant={action.to === "RESOLVED" ? "ink" : "secondary"}
              disabled={(action.to === "RESOLVED" || action.to === "DISMISSED") && !resolution.trim()}
              busy={move.isPending && move.variables === action.to}
              onClick={() => move.mutate(action.to)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
      {move.error ? (
        <div className="mt-2">
          <Alert tone="error">{errorText(move.error)}</Alert>
        </div>
      ) : null}
    </li>
  );
}
