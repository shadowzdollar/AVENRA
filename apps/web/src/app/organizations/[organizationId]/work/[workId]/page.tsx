"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
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

function Lifecycle({ ids, work, canUpdate }: { ids: Ids; work: WorkDetail; canUpdate: boolean }) {
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
}: {
  ids: Ids;
  requirement: Requirement;
  closed: boolean;
  permissions: Set<string>;
}) {
  const refresh = useRefresh(ids);
  const path = { ...ids, requirementId: requirement.id };
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
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
          body: decision === "REJECT" ? { itemId: requirement.currentItem?.id ?? "", decision, reason } : { itemId: requirement.currentItem?.id ?? "", decision },
        }),
      ),
    onSuccess: () => {
      setReason("");
      refresh();
    },
  });

  const item = requirement.currentItem;
  const canCollect = permissions.has("information.collect") && !closed && requirement.state !== "ACCEPTED";
  const canReview = permissions.has("information.verify") && !closed && requirement.state === "SUBMITTED";
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
          {item.verification.reason ? <p className="mt-1 text-error">Rejected: {item.verification.reason}</p> : null}
        </div>
      ) : null}

      {canReview ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Button onClick={() => review.mutate("ACCEPT")} busy={review.isPending && review.variables === "ACCEPT"}>
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

function AddRequirement({ ids }: { ids: Ids }) {
  const refresh = useRefresh(ids);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<RequirementKind>("DOCUMENT");
  const [required, setRequired] = useState(true);
  const [instructions, setInstructions] = useState("");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/requirements", {
          params: { path: ids, header: { "Idempotency-Key": idempotencyKey() } },
          body: instructions ? { title, kind, required, instructions } : { title, kind, required },
        }),
      ),
    onSuccess: () => {
      setTitle("");
      setInstructions("");
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
          <select id="requirement-kind" value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className={SELECT}>
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
              <p className="text-text-secondary">Done when: {task.completionCondition}</p>
            </div>
            {task.status === "OPEN" && permissions.has("work.execute") && !closed ? (
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

function History({ ids }: { ids: Ids }) {
  const history = useQuery({
    queryKey: ["organization", ids.organizationId, "work", ids.workId, "history"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work/{workId}/transitions", { params: { path: ids } })),
  });
  return (
    <Card title="History">
      <ol className="flex flex-col gap-1 text-sm">
        {history.data?.map((transition) => (
          <li key={transition.id}>
            <span className="text-text-secondary">{new Date(transition.at).toLocaleString()}</span> · {statusLabel(transition.to)}
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
      <Lifecycle ids={ids} work={data} canUpdate={permissions.has("work.update")} />
      <Card title="What is required">
        {data.requirements.length === 0 ? <p className="text-sm text-text-secondary">Nothing is required yet.</p> : null}
        <ul className="divide-y divide-border">
          {data.requirements.map((requirement) => (
            <RequirementRow key={requirement.id} ids={ids} requirement={requirement} closed={closed} permissions={permissions} />
          ))}
        </ul>
        {permissions.has("work.update") && !closed ? <AddRequirement ids={ids} /> : null}
      </Card>
      {permissions.has("information.collect") ? <RequestLinks ids={ids} work={data} closed={closed} /> : null}
      <Tasks ids={ids} work={data} permissions={permissions} closed={closed} />
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
