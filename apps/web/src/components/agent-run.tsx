"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, ApiError, idempotencyKey, unwrap } from "@/lib/api";

type AgentRun = components["schemas"]["AgentRun"];
type AgentStep = components["schemas"]["AgentStep"];
type Ids = { organizationId: string; workId: string };

export const RUN_STATUS: Record<AgentRun["status"], string> = {
  PLANNING: "Preparing a plan…",
  AWAITING_APPROVAL: "Waiting for your decision",
  RUNNING: "Running the approved steps…",
  COMPLETED: "Done",
  REJECTED: "Plan rejected",
  STOPPED: "Stopped",
  FAILED: "Failed",
};

const STEP_STATUS: Record<AgentStep["status"], string> = {
  PROPOSED: "proposed",
  APPROVED: "approved",
  RUNNING: "running",
  SUCCEEDED: "done",
  REJECTED: "rejected",
  FAILED: "failed",
  SKIPPED: "skipped",
};

const RISK_TONE: Record<AgentStep["risk"], string> = {
  LOW: "text-text-secondary",
  MEDIUM: "text-text-secondary",
  HIGH: "text-warning",
  CRITICAL: "text-error",
};

/** Whether the run is still moving on its own, so the page keeps it current. */
export function isActive(run: AgentRun | undefined): boolean {
  return run !== undefined && (run.status === "PLANNING" || run.status === "RUNNING");
}

/** The plan is waiting and at least one reversible step has not been approved yet. */
export function planNeedsApproval(run: AgentRun): boolean {
  return run.status === "AWAITING_APPROVAL" && run.steps.some((step) => step.status === "PROPOSED" && !step.needsOwnApproval);
}

/** High-risk steps still waiting for their own approval. */
export function highRiskWaiting(run: AgentRun): AgentStep[] {
  return run.steps.filter((step) => step.status === "PROPOSED" && step.needsOwnApproval);
}

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

/**
 * The assistant (ADR-033): proposes a plan for the work; nothing happens until a person approves
 * it, and emailing the client needs its own approval.
 */
export function AgentRuns({
  ids,
  canStart,
  canApprove,
  planningEnabled,
}: {
  ids: Ids;
  canStart: boolean;
  canApprove: boolean;
  planningEnabled: boolean;
}) {
  const queries = useQueryClient();
  const key = ["organization", ids.organizationId, "work", ids.workId, "agent-runs"];
  const runs = useQuery({
    queryKey: key,
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/agent-runs", { params: { path: ids } })),
    refetchInterval: (query) => (isActive(query.state.data?.[0]) ? 1_500 : false),
  });
  const refresh = () => {
    void queries.invalidateQueries({ queryKey: key });
    void queries.invalidateQueries({ queryKey: ["organization", ids.organizationId, "work", ids.workId], exact: true });
  };
  const start = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/agent-runs", {
          params: { path: ids, header: { "Idempotency-Key": idempotencyKey() } },
        }),
      ),
    onSettled: refresh,
  });
  const latest = runs.data?.[0];

  if (!planningEnabled && !latest) {
    return null;
  }
  return (
    <Card title="Assistant">
      <div className="flex flex-col gap-3 text-sm" data-testid="assistant">
        {latest ? <RunView ids={ids} run={latest} canApprove={canApprove} canStop={canStart} onChange={refresh} /> : null}
        {canStart && planningEnabled && !isActive(latest) && latest?.status !== "AWAITING_APPROVAL" ? (
          <div>
            <Button variant={latest ? "secondary" : "primary"} busy={start.isPending} onClick={() => start.mutate()}>
              {latest ? "Plan again" : "Plan this work with the assistant"}
            </Button>
            <p className="mt-1 text-text-secondary">
              The assistant proposes what to ask the client for and what to do. Nothing happens until you approve it.
            </p>
          </div>
        ) : null}
        {start.error ? <Alert tone="error">{errorText(start.error)}</Alert> : null}
      </div>
    </Card>
  );
}

function RunView({
  ids,
  run,
  canApprove,
  canStop,
  onChange,
}: {
  ids: Ids;
  run: AgentRun;
  canApprove: boolean;
  canStop: boolean;
  onChange: () => void;
}) {
  const [reason, setReason] = useState("");
  const path = { params: { path: { ...ids, runId: run.id } } };
  const decide = useMutation({
    mutationFn: async (body: components["schemas"]["AgentApprovalRequest"]) =>
      unwrap(await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/agent-runs/{runId}/approval", { ...path, body })),
    onSettled: onChange,
  });
  const stop = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/agent-runs/{runId}/stop", {
          ...path,
          body: { reason: reason.trim() || "Stopped from the work page." },
        }),
      ),
    onSettled: onChange,
  });
  const finished = ["COMPLETED", "REJECTED", "STOPPED", "FAILED"].includes(run.status);
  const waitingHigh = highRiskWaiting(run);

  return (
    <div className="flex flex-col gap-2" data-testid="agent-run">
      <p className="font-medium" data-testid="agent-run-status">
        {RUN_STATUS[run.status]}
      </p>
      {run.summary ? <p className="text-text-secondary">{run.summary}</p> : null}
      {run.stopReason ? <p className={run.status === "COMPLETED" ? "text-text-secondary" : "text-error"}>{run.stopReason}</p> : null}
      <ol className="flex flex-col gap-1">
        {run.steps.map((step) => (
          <li key={step.id} className="rounded-md border border-border p-2" data-testid={`agent-step-${step.position}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span>
                {step.position}. {step.description ?? step.tool}
              </span>
              <span className="text-text-secondary">
                <span className={RISK_TONE[step.risk]}>{step.risk.toLowerCase()} risk</span> · {STEP_STATUS[step.status]}
              </span>
            </div>
            {step.reason ? <p className="text-text-secondary">Why: {step.reason}</p> : null}
            {step.result ? <p className="text-success">{step.result}</p> : null}
            {step.error ? <p className="text-error">{step.error}</p> : null}
            {step.needsOwnApproval && step.status === "PROPOSED" && canApprove && run.status === "AWAITING_APPROVAL" && !planNeedsApproval(run) ? (
              <Button
                className="mt-1"
                busy={decide.isPending}
                onClick={() => decide.mutate({ decision: "APPROVE", highRiskStepIds: [step.id] })}
              >
                Approve this step
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
      {run.status === "AWAITING_APPROVAL" && canApprove && planNeedsApproval(run) ? (
        <div className="flex flex-wrap gap-2">
          <Button busy={decide.isPending} onClick={() => decide.mutate({ decision: "APPROVE", highRiskStepIds: [] })}>
            Approve the plan
          </Button>
          {waitingHigh.length > 0 ? (
            <Button
              variant="secondary"
              busy={decide.isPending}
              onClick={() => decide.mutate({ decision: "APPROVE", highRiskStepIds: waitingHigh.map((step) => step.id) })}
            >
              Approve the plan and the email to the client
            </Button>
          ) : null}
          <Button variant="secondary" busy={decide.isPending} onClick={() => decide.mutate({ decision: "REJECT", reason: reason.trim() })}>
            Reject
          </Button>
        </div>
      ) : null}
      {run.status === "AWAITING_APPROVAL" && !canApprove ? (
        <p className="text-text-secondary">Someone who can approve work needs to decide on this plan.</p>
      ) : null}
      {!finished && canStop ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-64 flex-1">
            <Field label="Reason (optional)" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <Button variant="danger" busy={stop.isPending} onClick={() => stop.mutate()}>
            Stop
          </Button>
        </div>
      ) : null}
      {decide.error ? <Alert tone="error">{errorText(decide.error)}</Alert> : null}
      {stop.error ? <Alert tone="error">{errorText(stop.error)}</Alert> : null}
      <p className="text-xs text-text-secondary">
        Budget: {run.budget.toolCalls} of {run.budget.maxToolCalls} steps · {run.budget.sideEffects} of {run.budget.maxSideEffects} emails
      </p>
    </div>
  );
}
