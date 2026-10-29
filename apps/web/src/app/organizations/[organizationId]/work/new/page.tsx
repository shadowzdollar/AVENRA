"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Target } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { useAiSettings } from "@/components/ai-settings";
import { Alert, Button, Field, INPUT_CLASS, PageHeader, Panel } from "@/components/ui";
import { api, idempotencyKey, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { errorText } from "@/lib/work";

type Priority = components["schemas"]["Priority"];

/** Kinds of work people start from; any other type can be typed. */
const TYPES = ["Client onboarding", "Document collection", "Recurring reporting", "Compliance evidence"];

function NewWork({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const permissions = usePermissions(organizationId);
  const path = { params: { path: { organizationId } } };
  const clients = useQuery({
    queryKey: ["organization", organizationId, "clients"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/clients", path)),
  });
  const members = useQuery({
    queryKey: ["organization", organizationId, "members"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/members", path)),
    enabled: permissions.has("members.read"),
  });
  const ai = useAiSettings(organizationId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [clientId, setClientId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [plan, setPlan] = useState(false);
  const canPlan = ai.data?.workPlanning === true && permissions.has("work.update");

  const create = useMutation({
    mutationFn: async () => {
      const created = unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work", {
          params: { path: { organizationId }, header: { "Idempotency-Key": idempotencyKey() } },
          body: {
            title,
            priority,
            ...(description.trim() ? { description: description.trim() } : {}),
            ...(type.trim() ? { type: type.trim() } : {}),
            ...(clientId ? { clientId } : {}),
            ...(ownerId ? { ownerMembershipId: ownerId } : {}),
            ...(due ? { dueAt: new Date(`${due}T17:00:00`).toISOString() } : {}),
          },
        }),
      );
      if (plan && canPlan) {
        // The assistant plans only running work; it then waits for a person to approve (ADR-033).
        const work = { params: { path: { organizationId, workId: created.id } } };
        for (const [from, to] of [
          ["DRAFT", "READY"],
          ["READY", "RUNNING"],
        ] as const) {
          unwrap(await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/transitions", { ...work, body: { expectedStatus: from, to } }));
        }
        unwrap(
          await api.POST("/api/v1/organizations/{organizationId}/work/{workId}/agent-runs", {
            params: { path: { organizationId, workId: created.id }, header: { "Idempotency-Key": idempotencyKey() } },
          }),
        );
      }
      return created;
    },
    onSuccess: (created) => router.push(`/organizations/${organizationId}/work/${created.id}`),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  const select = `${INPUT_CLASS} mt-1.5`;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Define new work" subtitle="Say what needs to be true, for whom and by when. Avenra tracks it to a verified result." />
      <form onSubmit={submit}>
        <Panel>
          <div className="space-y-5">
            <Field label="Title" required maxLength={200} placeholder="Onboard Northwind Legal" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div>
              <label htmlFor="work-description" className="text-[13px] font-medium">
                What needs to happen?
              </label>
              <textarea
                id="work-description"
                rows={4}
                maxLength={10000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Collect and verify everything required from the client before the engagement starts."
                className={`${INPUT_CLASS} mt-1.5 h-auto resize-none py-2`}
              />
            </div>
            <div>
              <Field label="Type" maxLength={60} placeholder="Client onboarding" value={type} onChange={(e) => setType(e.target.value)} />
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`rounded-full border px-3 py-1 text-[12px] ${type === option ? "border-brand bg-brand-surface text-brand" : "border-border text-text-secondary hover:text-text-primary"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-[13px] font-medium">
                Client
                <select value={clientId} onChange={(event) => setClientId(event.target.value)} className={select}>
                  <option value="">None</option>
                  {clients.data?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] font-medium">
                Owner
                <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className={select}>
                  <option value="">Me</option>
                  {members.data?.map((member) => (
                    <option key={member.membershipId} value={member.membershipId}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] font-medium">
                Due date
                <input type="date" value={due} onChange={(event) => setDue(event.target.value)} className={select} />
              </label>
              <label className="text-[13px] font-medium">
                Priority
                <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className={select}>
                  {(["LOW", "NORMAL", "HIGH", "URGENT"] as Priority[]).map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {canPlan ? (
              <label className="flex items-start gap-3 rounded-xl border border-border bg-brand-surface p-3 text-[13px]">
                <input type="checkbox" checked={plan} onChange={(event) => setPlan(event.target.checked)} className="mt-0.5 accent-brand" />
                <span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-4 text-brand" />
                    Let the assistant propose a plan
                  </span>
                  <span className="text-text-secondary">The work starts, the assistant proposes what to collect and from whom, and nothing happens until a person approves.</span>
                </span>
              </label>
            ) : null}
            {create.error ? <Alert tone="error">{errorText(create.error)}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" busy={create.isPending} disabled={!title.trim()}>
                <Target />
                Create work
              </Button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}

export default function NewWorkPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <NewWork organizationId={organizationId} />;
}
