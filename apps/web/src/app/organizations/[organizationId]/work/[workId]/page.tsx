"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { ChecksView } from "@/components/checks-view";
import { ExceptionRow } from "@/components/exception-row";
import { cleanRule, RuleEditor } from "@/components/rule-editor";
import { ValueInput } from "@/components/value-input";
import { api, idempotencyKey, unwrap } from "@/lib/api";
import {
  completenessSummary,
  errorText,
  fileBody,
  formatBytes,
  KIND_LABELS,
  needsReason,
  stateLabel,
  stateTone,
  statusLabel,
  type RequirementKind,
  type WorkStatus,
} from "@/lib/work";

type Requirement = components["schemas"]["Requirement"];
type WorkDetail = components["schemas"]["WorkDetail"];
type RuleInput = components["schemas"]["VerificationRuleInput"];
type Acceptance = components["schemas"]["Acceptance"];
type Risk = components["schemas"]["Risk"];
type Ids = { organizationId: string; workId: string };

const SELECT = "h-9 rounded-md border border-border bg-background px-2 text-sm";
const LINK_VALIDITY_DAYS = 14;

function usePermissions(organizationId: string): Set<string> {
  const session = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")),
  });
  return new Set(
    session.data?.organizations.find((membership) => membership.organization.id === organizationId)?.permissions ?? [],
  );
}

function useRefresh({ organizationId, workId }: Ids) {
  const queries = useQueryClient();
  return () => void queries.invalidateQueries({ queryKey: ["organization", organizationId, "work", workId] });
}

function Lifecycle({ ids, work, canUpdate, owner }: { ids: Ids; work: WorkDetail; canUpdate: boolean; owner: string | undefined }) {
  const refresh = useRefresh(ids);
  const [target, setTarget] = useState<WorkStatus | null>(null);
  const [reason, setReason] = useState("");
  const move = useMutation({
    mutationFn: async (to: WorkStatus) =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/transitions", {
          params: { path: ids },
          body: reason ? { to, expectedStatus: work.status, reason } : { to, expectedStatus: work.status },
        }),
      ),
    onSuccess: () => {
      setTarget(null);
      setReason("");
      refresh();
    },
  });
  const summary = completenessSummary(work.completeness);

  function choose(to: WorkStatus) {
    if (needsReason(to)) {
      setTarget(to);
    } else {
      move.mutate(to);
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary">Status</p>
          <p className="text-lg font-semibold" data-testid="work-status">
            {statusLabel(work.status)}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <progress className="completeness h-2 w-full" value={summary.ratio} max={1} aria-label="Completeness" />
          <p className="mt-1 text-sm text-text-secondary" data-testid="completeness">
            {summary.text}
            {work.completeness.awaitingReview > 0 ? ` · ${work.completeness.awaitingReview} awaiting review` : ""}
            {work.completeness.missing > 0 ? ` · ${work.completeness.missing} missing` : ""}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2" data-testid="progress">
        <div>
          <dt className="text-text-secondary">Current step</dt>
          <dd data-testid="current-step">{work.progress.currentStep}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Next action</dt>
          <dd data-testid="next-action">{work.progress.nextAction}</dd>
        </div>
        {work.progress.blockedReason ? (
          <div>
            <dt className="text-text-secondary">Blocked because</dt>
            <dd className="text-error" data-testid="blocked-reason">
              {work.progress.blockedReason}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-text-secondary">Owner</dt>
          <dd>{owner ?? "Nobody"}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Deadline</dt>
          <dd>{work.dueAt ? new Date(work.dueAt).toLocaleDateString() : "None"}</dd>
        </div>
      </dl>
      {work.status !== "COMPLETED" && work.status !== "CANCELLED" && work.status !== "FAILED" ? (
        <div className="mt-4 border-t border-border pt-4 text-sm">
          <p className="text-text-secondary">To complete this work</p>
          <ul className="mt-1 flex flex-col gap-0.5" data-testid="completion-criteria">
            {work.completionCriteria.map((criterion) => (
              <li key={criterion.name} className={criterion.met ? "text-success" : ""}>
                <span aria-hidden>{criterion.met ? "✓ " : "○ "}</span>
                {criterion.description}
                {criterion.detail ? <span className="text-text-secondary"> — {criterion.detail}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {canUpdate && work.allowedTransitions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {work.allowedTransitions.map((to) => (
            <Button key={to} variant={to === "CANCELLED" || to === "FAILED" ? "danger" : "secondary"} onClick={() => choose(to)} busy={move.isPending && move.variables === to}>
              {statusLabel(to)}
            </Button>
          ))}
        </div>
      ) : null}
      {target ? (
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            move.mutate(target);
          }}
        >
          <div className="flex-1">
            <Field label={`Why is this work ${statusLabel(target).toLowerCase()}?`} required maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button type="submit" busy={move.isPending}>
            Confirm
          </Button>
          <Button type="button" variant="secondary" onClick={() => setTarget(null)}>
            Back
          </Button>
        </form>
      ) : null}
      {move.error ? (
        <div className="mt-3">
          <Alert tone="error">{errorText(move.error)}</Alert>
        </div>
      ) : null}
    </Card>
  );
}

function RequirementRow({
  ids,
  requirement,
  closed,
  permissions,
  others,
}: {
  ids: Ids;
  requirement: Requirement;
  closed: boolean;
  permissions: Set<string>;
  others: { id: string; title: string; kind: RequirementKind }[];
}) {
  const refresh = useRefresh(ids);
  const path = { ...ids, requirementId: requirement.id };
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [override, setOverride] = useState("");
  const [editing, setEditing] = useState(false);
  const submit = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/requirements/{requirementId}/value", {
          params: { path },
          body: { value },
        }),
      ),
    onSuccess: () => {
      setValue("");
      refresh();
    },
  });
  const upload = useMutation({
    mutationFn: async (chosen: File) =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/requirements/{requirementId}/file", {
          params: { path },
          ...fileBody(chosen),
        }),
      ),
    onSuccess: () => {
      setFile(null);
      refresh();
    },
  });
  const review = useMutation({
    mutationFn: async (decision: "ACCEPT" | "REJECT") =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/requirements/{requirementId}/review", {
          params: { path },
          body: {
            itemId: requirement.currentItem?.id ?? "",
            decision,
            ...(decision === "REJECT" ? { reason } : {}),
            ...(decision === "ACCEPT" && override.trim() ? { overrideReason: override.trim() } : {}),
          },
        }),
      ),
    onSuccess: () => {
      setReason("");
      setOverride("");
      refresh();
    },
  });

  const item = requirement.currentItem;
  const checksFailed = item?.checks !== undefined && item.checks.status !== "PASSED";
  const rulesRejected = requirement.state === "REJECTED" && item?.verification.decidedBy === "RULES";
  const acceptedButFailing = requirement.state === "ACCEPTED" && item?.checks?.status === "FAILED" && !item.verification.overrideReason;
  const needsOverride = checksFailed || rulesRejected;
  const canCollect = permissions.has("information.collect") && !closed && requirement.state !== "ACCEPTED";
  const canVerify = permissions.has("information.verify") && !closed;
  const canReview = canVerify && requirement.state === "SUBMITTED";
  const canOverride = canVerify && (rulesRejected || acceptedButFailing);
  const error = errorText(submit.error ?? upload.error ?? review.error);

  return (
    <li className="py-4" data-testid={`requirement-${requirement.title}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {requirement.title}
            {requirement.required ? "" : <span className="font-normal text-text-secondary"> · optional</span>}
          </p>
          <p className="text-sm text-text-secondary">
            {KIND_LABELS[requirement.kind]}
            {requirement.instructions ? ` · ${requirement.instructions}` : ""}
          </p>
          <p className="text-sm text-text-secondary" data-testid="verification-policy">
            {requirement.rules.length === 0 ? "No checks" : `${requirement.rules.length} ${requirement.rules.length === 1 ? "check" : "checks"}`}
            {requirement.acceptance === "AUTOMATIC" ? " · accepted automatically when every check passes" : " · a person accepts"}
            {requirement.risk === "HIGH" ? " · high risk" : ""}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-medium ${stateTone(requirement.state)}`} data-testid="requirement-state">
          {stateLabel(requirement.state)}
        </span>
      </div>

      {item ? (
        <div className="mt-2 rounded-md border border-border px-3 py-2 text-sm">
          {item.document ? (
            <a
              className="text-brand hover:underline"
              href={`/api/v1/organizations/${ids.organizationId}/documents/${item.document.documentId}/versions/${item.document.version}/content`}
            >
              {item.document.fileName}
            </a>
          ) : (
            <span>{item.value}</span>
          )}
          <span className="text-text-secondary">
            {item.document ? ` · ${formatBytes(item.document.sizeBytes)} · v${item.document.version}` : ""}
            {` · from ${item.source.type === "CLIENT_LINK" ? "client link" : "team member"} · ${new Date(item.receivedAt).toLocaleString()}`}
          </span>
          {item.verification.decidedBy ? (
            <span className="text-text-secondary"> · decided by {item.verification.decidedBy === "RULES" ? "the checks" : "a person"}</span>
          ) : null}
          {item.verification.reason ? <p className="mt-1 text-error">Rejected: {item.verification.reason}</p> : null}
          {item.verification.overrideReason ? <p className="mt-1 text-warning">Override: {item.verification.overrideReason}</p> : null}
          {item.checks ? (
            <div className="mt-2">
              <ChecksView result={item.checks} />
            </div>
          ) : null}
        </div>
      ) : null}

      {(canReview && needsOverride) || canOverride ? (
        <div className="mt-3">
          <Field
            label="Override reason (needed to accept an answer whose checks did not pass)"
            maxLength={1000}
            value={override}
            onChange={(e) => setOverride(e.target.value)}
          />
          {canOverride ? (
            <div className="mt-2">
              <Button variant="secondary" disabled={!override.trim()} onClick={() => review.mutate("ACCEPT")} busy={review.isPending}>
                {acceptedButFailing ? "Keep the accepted answer" : "Accept anyway"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {canReview ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Button onClick={() => review.mutate("ACCEPT")} disabled={needsOverride && !override.trim()} busy={review.isPending && review.variables === "ACCEPT"}>
            Accept
          </Button>
          <div className="flex-1">
            <Field label="Reason for rejecting (shown to the client)" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button variant="danger" disabled={!reason.trim()} onClick={() => review.mutate("REJECT")} busy={review.isPending && review.variables === "REJECT"}>
            Reject
          </Button>
        </div>
      ) : null}

      {permissions.has("work.update") && !closed ? (
        editing ? (
          <RuleSettings ids={ids} requirement={requirement} others={others} onDone={() => setEditing(false)} />
        ) : (
          <button type="button" className="mt-2 text-sm text-brand hover:underline" onClick={() => setEditing(true)}>
            Edit checks
          </button>
        )
      ) : null}

      {canCollect ? (
        requirement.kind === "DOCUMENT" ? (
          <form
            className="mt-3 flex items-center gap-3"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (file) upload.mutate(file);
            }}
          >
            <input
              type="file"
              aria-label={`File for ${requirement.title}`}
              accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt,.png,.jpg,.jpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button type="submit" variant="secondary" disabled={!file} busy={upload.isPending}>
              Upload
            </Button>
          </form>
        ) : (
          <form
            className="mt-3 flex items-end gap-3"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              submit.mutate();
            }}
          >
            <div className="flex-1">
              <ValueInput kind={requirement.kind} label={`Value for ${requirement.title}`} value={value} onChange={setValue} />
            </div>
            <Button type="submit" variant="secondary" busy={submit.isPending}>
              Record
            </Button>
          </form>
        )
      ) : null}
      {error ? (
        <div className="mt-2">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
    </li>
  );
}

function RuleSettings({
  ids,
  requirement,
  others,
  onDone,
}: {
  ids: Ids;
  requirement: Requirement;
  others: { id: string; title: string; kind: RequirementKind }[];
  onDone: () => void;
}) {
  const refresh = useRefresh(ids);
  const [rules, setRules] = useState<RuleInput[]>(requirement.rules.map((rule) => cleanRule(rule)));
  const [acceptance, setAcceptance] = useState(requirement.acceptance);
  const [risk, setRisk] = useState(requirement.risk);
  const save = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.PUT("/api/v1/organizations/{organizationId}/work/{workId}/requirements/{requirementId}/rules", {
          params: { path: { ...ids, requirementId: requirement.id } },
          body: { rules: rules.map(cleanRule), acceptance, risk },
        }),
      ),
    onSuccess: () => {
      refresh();
      onDone();
    },
  });
  return (
    <form
      className="mt-3 flex flex-col gap-3 rounded-md border border-border p-3"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <RuleEditor kind={requirement.kind} rules={rules} onChange={setRules} others={others} />
      <AcceptanceChoice acceptance={acceptance} risk={risk} onAcceptance={setAcceptance} onRisk={setRisk} />
      <div className="flex gap-2">
        <Button type="submit" busy={save.isPending}>
          Save checks
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {save.error ? <Alert tone="error">{errorText(save.error)}</Alert> : null}
    </form>
  );
}

function AcceptanceChoice({
  acceptance,
  risk,
  onAcceptance,
  onRisk,
}: {
  acceptance: Acceptance;
  risk: Risk;
  onAcceptance: (value: Acceptance) => void;
  onRisk: (value: Risk) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <label className="flex flex-col gap-1">
        Who accepts answers
        <select className={SELECT} value={acceptance} onChange={(event) => onAcceptance(event.target.value as Acceptance)} disabled={risk === "HIGH"}>
          <option value="MANUAL">A person</option>
          <option value="AUTOMATIC">Automatically, when every check passes</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Risk
        <select
          className={SELECT}
          value={risk}
          onChange={(event) => {
            const value = event.target.value as Risk;
            onRisk(value);
            if (value === "HIGH") onAcceptance("MANUAL");
          }}
        >
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High (always a person)</option>
        </select>
      </label>
    </div>
  );
}

function AddRequirement({ ids, others }: { ids: Ids; others: { id: string; title: string; kind: RequirementKind }[] }) {
  const refresh = useRefresh(ids);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<RequirementKind>("DOCUMENT");
  const [required, setRequired] = useState(true);
  const [instructions, setInstructions] = useState("");
  const [rules, setRules] = useState<RuleInput[]>([]);
  const [acceptance, setAcceptance] = useState<Acceptance>("MANUAL");
  const [risk, setRisk] = useState<Risk>("NORMAL");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/requirements", {
          params: { path: ids, header: { "Idempotency-Key": idempotencyKey() } },
          body: {
            title,
            kind,
            required,
            acceptance,
            risk,
            rules: rules.map(cleanRule),
            ...(instructions ? { instructions } : {}),
          },
        }),
      ),
    onSuccess: () => {
      setTitle("");
      setInstructions("");
      setRules([]);
      setAcceptance("MANUAL");
      setRisk("NORMAL");
      refresh();
    },
  });
  return (
    <form
      className="mt-6 flex flex-col gap-4 border-t border-border pt-6"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="What is required?" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="requirement-kind" className="text-sm font-medium">
            Type
          </label>
          <select
            id="requirement-kind"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as RequirementKind);
              setRules([]);
            }}
            className={SELECT}
          >
            {(Object.keys(KIND_LABELS) as RequirementKind[]).map((option) => (
              <option key={option} value={option}>
                {KIND_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
          Required
        </label>
      </div>
      <Field label="Instructions for the client (optional)" maxLength={2000} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      <RuleEditor kind={kind} rules={rules} onChange={setRules} others={others} />
      <AcceptanceChoice acceptance={acceptance} risk={risk} onAcceptance={setAcceptance} onRisk={setRisk} />
      <div>
        <Button type="submit" busy={create.isPending}>
          Add requirement
        </Button>
      </div>
      {create.error ? <Alert tone="error">{errorText(create.error)}</Alert> : null}
    </form>
  );
}

function Tasks({ ids, work, permissions, closed }: { ids: Ids; work: WorkDetail; permissions: Set<string>; closed: boolean }) {
  const refresh = useRefresh(ids);
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/tasks", {
          params: { path: ids, header: { "Idempotency-Key": idempotencyKey() } },
          body: { title, completionCondition: condition },
        }),
      ),
    onSuccess: () => {
      setTitle("");
      setCondition("");
      refresh();
    },
  });
  const finish = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: "DONE" | "CANCELLED" }) =>
      unwrap(
        await api.PUT("/api/v1/organizations/{organizationId}/work/{workId}/tasks/{taskId}/status", {
          params: { path: { ...ids, taskId } },
          body: { status },
        }),
      ),
    onSettled: refresh,
  });
  return (
    <Card title="Tasks">
      {work.tasks.length === 0 ? <p className="text-sm text-text-secondary">No tasks.</p> : null}
      <ul className="divide-y divide-border text-sm">
        {work.tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className={task.status === "OPEN" ? "" : "text-text-secondary line-through"}>{task.title}</p>
              {task.origin === "SYSTEM" ? (
                <>
                  <p>{task.requiredAction}</p>
                  <p className="text-text-secondary">
                    {task.reason}
                    {task.dueAt ? ` · by ${new Date(task.dueAt).toLocaleDateString()}` : ""}
                    {task.choices && task.choices.length > 0 ? ` · choices: ${task.choices.map((choice) => choice.toLowerCase()).join(", ")}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-text-secondary">Done when: {task.completionCondition}</p>
              )}
            </div>
            {task.origin === "SYSTEM" && task.status === "OPEN" ? (
              <span className="shrink-0 text-text-secondary">closes when reviewed</span>
            ) : task.status === "OPEN" && permissions.has("work.execute") && !closed ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => finish.mutate({ taskId: task.id, status: "DONE" })}>
                  Done
                </Button>
                <Button variant="danger" onClick={() => finish.mutate({ taskId: task.id, status: "CANCELLED" })}>
                  Cancel
                </Button>
              </div>
            ) : (
              <span className="text-text-secondary">{task.status.toLowerCase()}</span>
            )}
          </li>
        ))}
      </ul>
      {permissions.has("work.update") && !closed ? (
        <form
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="flex-1">
            <Field label="Task" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex-1">
            <Field label="Done when…" required maxLength={1000} value={condition} onChange={(e) => setCondition(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" busy={create.isPending}>
            Add task
          </Button>
        </form>
      ) : null}
      {errorText(create.error ?? finish.error) ? (
        <div className="mt-3">
          <Alert tone="error">{errorText(create.error ?? finish.error)}</Alert>
        </div>
      ) : null}
    </Card>
  );
}

function RequestLinks({ ids, work, closed }: { ids: Ids; work: WorkDetail; closed: boolean }) {
  const queries = useQueryClient();
  const key = ["organization", ids.organizationId, "work", ids.workId, "links"];
  const links = useQuery({
    queryKey: key,
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/request-links", { params: { path: ids } })),
  });
  const open = work.requirements.filter((requirement) => requirement.state !== "ACCEPTED");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [chosen, setChosen] = useState<Set<string> | null>(null);
  const selected = chosen ?? new Set(open.map((requirement) => requirement.id));
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/request-links", {
          params: { path: ids, header: { "Idempotency-Key": idempotencyKey() } },
          body: {
            recipientEmail: email,
            requirementIds: [...selected],
            expiresInDays: LINK_VALIDITY_DAYS,
            ...(message ? { message } : {}),
          },
        }),
      ),
    onSuccess: () => {
      setEmail("");
      setMessage("");
      setChosen(null);
      void queries.invalidateQueries({ queryKey: key });
    },
  });
  const revoke = useMutation({
    mutationFn: async (requestLinkId: string) =>
      unwrap(
        await api.DELETE("/api/v1/organizations/{organizationId}/work/{workId}/request-links/{requestLinkId}", {
          params: { path: { ...ids, requestLinkId } },
        }),
      ),
    onSettled: () => void queries.invalidateQueries({ queryKey: key }),
  });

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosen(next);
  }

  return (
    <Card title="Ask the client">
      <ul className="divide-y divide-border text-sm">
        {links.data?.map((link) => (
          <li key={link.id} className="flex items-center justify-between gap-4 py-2">
            <span>
              {link.recipientEmail}{" "}
              <span className="text-text-secondary">
                · {link.requirementIds.length} items · {link.status.toLowerCase()} · until {new Date(link.expiresAt).toLocaleDateString()}
                {link.lastOpenedAt ? ` · opened ${new Date(link.lastOpenedAt).toLocaleString()}` : " · not opened yet"}
                {link.remindersSent > 0 ? ` · ${link.remindersSent} ${link.remindersSent === 1 ? "reminder" : "reminders"} sent` : ""}
              </span>
            </span>
            {link.status === "ACTIVE" ? (
              <Button variant="secondary" onClick={() => revoke.mutate(link.id)}>
                Revoke
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {!closed && work.requirements.length > 0 ? (
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <fieldset className="flex flex-col gap-1 text-sm">
            <legend className="mb-1 font-medium">Items to request</legend>
            {work.requirements.map((requirement) => (
              <label key={requirement.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.has(requirement.id)} onChange={() => toggle(requirement.id)} />
                {requirement.title}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Client email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex-1">
              <Field label="Message (optional)" maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button type="submit" disabled={selected.size === 0} busy={create.isPending}>
              Send request
            </Button>
          </div>
          <p className="text-sm text-text-secondary">The client gets a secure link by email. It needs no account and expires in {LINK_VALIDITY_DAYS} days.</p>
        </form>
      ) : null}
      {errorText(create.error ?? revoke.error) ? (
        <div className="mt-3">
          <Alert tone="error">{errorText(create.error ?? revoke.error)}</Alert>
        </div>
      ) : null}
      {create.isSuccess ? (
        <div className="mt-3">
          <Alert tone="success">Request sent.</Alert>
        </div>
      ) : null}
    </Card>
  );
}

function Exceptions({ ids, canUpdate }: { ids: Ids; canUpdate: boolean }) {
  const exceptions = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId, "exceptions"],
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/organizations/{organizationId}/exceptions", {
          params: { path: { organizationId: ids.organizationId }, query: { workId: ids.workId } },
        }),
      ),
    refetchInterval: 5_000,
  });
  if (!exceptions.data || exceptions.data.length === 0) {
    return null;
  }
  return (
    <Card title="Exceptions">
      <ul className="divide-y divide-border">
        {exceptions.data.map((exception) => (
          <ExceptionRow key={exception.id} ids={ids} exception={exception} canUpdate={canUpdate} />
        ))}
      </ul>
    </Card>
  );
}

function Executions({ ids }: { ids: Ids }) {
  const executions = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId, "executions"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/executions", { params: { path: ids } })),
    refetchInterval: 5_000,
  });
  if (!executions.data || executions.data.length === 0) {
    return null;
  }
  return (
    <Card title="Automated actions">
      <ol className="flex flex-col gap-1 text-sm" data-testid="executions">
        {executions.data.map((execution) => (
          <li key={execution.id}>
            <span className="text-text-secondary">{new Date(execution.createdAt).toLocaleString()}</span> · {execution.action}
            {execution.actor.rule ? <span className="text-text-secondary"> ({execution.actor.rule})</span> : null} ·{" "}
            <span className={execution.status === "FAILED" ? "text-error" : ""}>{execution.status.toLowerCase()}</span>
            {execution.error ? <span className="text-error"> — {execution.error}</span> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** The sealed proof of completion (ADR-028): its hash, and whether it still matches. */
function CompletionProof({ ids }: { ids: Ids }) {
  const completion = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId, "completion"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/completion", { params: { path: ids } })),
  });
  if (!completion.data) {
    return null;
  }
  return (
    <Card title="Proof of completion">
      <p className="text-sm" data-testid="manifest-integrity">
        {completion.data.intact ? (
          <span className="text-success">Intact: the record matches its fingerprint.</span>
        ) : (
          <span className="text-error">Changed: the record no longer matches its fingerprint.</span>
        )}
      </p>
      <p className="mt-1 break-all font-mono text-xs text-text-secondary" data-testid="manifest-sha256">
        SHA-256 {completion.data.sha256}
      </p>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-brand">Show the completion record</summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded-md border border-border p-3 text-xs">
          {JSON.stringify(JSON.parse(completion.data.manifest) as unknown, null, 2)}
        </pre>
      </details>
    </Card>
  );
}

function EvidenceList({ ids }: { ids: Ids }) {
  const evidence = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId, "evidence"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/evidence", { params: { path: ids } })),
    refetchInterval: 5_000,
  });
  if (!evidence.data || evidence.data.length === 0) {
    return null;
  }
  return (
    <Card title="Evidence">
      <ol className="flex max-h-72 flex-col gap-1 overflow-auto text-sm" data-testid="evidence">
        {evidence.data.map((entry) => (
          <li key={entry.id}>
            <span className="text-text-secondary">{new Date(entry.createdAt).toLocaleString()}</span> · {entry.kind.replaceAll("_", " ").toLowerCase()} ·{" "}
            {entry.description}
            {entry.fingerprint ? <span className="font-mono text-xs text-text-secondary"> · {entry.fingerprint.slice(0, 12)}…</span> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function History({ ids }: { ids: Ids }) {
  const history = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId, "history"],
    refetchInterval: 5_000,
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/transitions", { params: { path: ids } })),
  });
  return (
    <Card title="History">
      <ol className="flex flex-col gap-1 text-sm">
        {history.data?.map((transition) => (
          <li key={transition.id}>
            <span className="text-text-secondary">{new Date(transition.at).toLocaleString()}</span> · {statusLabel(transition.to)}
            <span className="text-text-secondary"> · {transition.actorRule ? `automatic (${transition.actorRule})` : "by a person"}</span>
            {transition.reason ? <span className="text-text-secondary"> — {transition.reason}</span> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Work({ ids }: { ids: Ids }) {
  const permissions = usePermissions(ids.organizationId);
  const work = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}", { params: { path: ids } })),
    // Background jobs move work on their own (ADR-023): keep the page current.
    refetchInterval: 5_000,
  });
  const members = useQuery({
    queryKey: ["organization", ids.organizationId, "members"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/members", { params: { path: { organizationId: ids.organizationId } } })),
  });
  if (work.error) {
    return <Alert tone="error">{errorText(work.error)}</Alert>;
  }
  if (!work.data) {
    return <p className="text-sm text-text-secondary">Loading…</p>;
  }
  const data = work.data;
  const closed = data.allowedTransitions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/organizations/${ids.organizationId}/work`} className="text-sm text-text-secondary hover:text-text-primary">
          ← All work
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{data.title}</h1>
        {data.description ? <p className="mt-1 text-sm text-text-secondary">{data.description}</p> : null}
      </div>
      <Lifecycle
        ids={ids}
        work={data}
        canUpdate={permissions.has("work.update")}
        owner={members.data?.find((member) => member.membershipId === data.ownerMembershipId)?.displayName}
      />
      <Exceptions ids={ids} canUpdate={permissions.has("work.update")} />
      <Card title="What is required">
        {data.requirements.length === 0 ? <p className="text-sm text-text-secondary">Nothing is required yet.</p> : null}
        <ul className="divide-y divide-border">
          {data.requirements.map((requirement) => (
            <RequirementRow
              key={requirement.id}
              ids={ids}
              requirement={requirement}
              closed={closed}
              permissions={permissions}
              others={data.requirements.filter((other) => other.id !== requirement.id).map((other) => ({ id: other.id, title: other.title, kind: other.kind }))}
            />
          ))}
        </ul>
        {permissions.has("work.update") && !closed ? (
          <AddRequirement ids={ids} others={data.requirements.map((other) => ({ id: other.id, title: other.title, kind: other.kind }))} />
        ) : null}
      </Card>
      {permissions.has("information.collect") ? <RequestLinks ids={ids} work={data} closed={closed} /> : null}
      <Tasks ids={ids} work={data} permissions={permissions} closed={closed} />
      {data.status === "COMPLETED" ? <CompletionProof ids={ids} /> : null}
      <EvidenceList ids={ids} />
      <Executions ids={ids} />
      <History ids={ids} />
    </div>
  );
}

export default function WorkDetailPage() {
  const { organizationId, workId } = useParams<{ organizationId: string; workId: string }>();
  return (
    <AppShell>
      <Work ids={{ organizationId, workId }} />
    </AppShell>
  );
}
