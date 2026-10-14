"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { Alert, Button, Field } from "@/components/ui";
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
}: {
  ids: { organizationId: string };
  exception: WorkException;
  canUpdate: boolean;
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
    <li className="py-3 text-sm" data-testid={`exception-${exception.type}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">
            <span className={exception.severity === "HIGH" ? "text-error" : "text-warning"}>{exception.severity.toLowerCase()}</span> ·{" "}
            {exception.type.replaceAll("_", " ").toLowerCase()}
          </p>
          <p>{exception.description}</p>
          {exception.resolution ? <p className="text-text-secondary">Resolution: {exception.resolution}</p> : null}
        </div>
        <span className="shrink-0 text-text-secondary" data-testid="exception-status">
          {exception.status.replaceAll("_", " ").toLowerCase()}
        </span>
      </div>
      {open && canUpdate ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Resolution (needed to resolve or dismiss)" maxLength={2000} value={resolution} onChange={(e) => setResolution(e.target.value)} />
          </div>
          {EXCEPTION_ACTIONS.filter((action) => exception.allowedTransitions.includes(action.to)).map((action) => (
            <Button
              key={action.to}
              variant="secondary"
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
