"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, idempotencyKey, unwrap } from "@/lib/api";
import { completenessSummary, errorText, statusLabel } from "@/lib/work";

function WorkList({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const queries = useQueryClient();
  const path = { params: { path: { organizationId } } };
  const work = useQuery({
    queryKey: ["organization", organizationId, "work"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work", path)),
  });
  const clients = useQuery({
    queryKey: ["organization", organizationId, "clients"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/clients", path)),
  });

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/work", {
          params: { path: { organizationId }, header: { "Idempotency-Key": idempotencyKey() } },
          body: clientId ? { title, clientId } : { title },
        }),
      ),
    onSuccess: (created) => {
      void queries.invalidateQueries({ queryKey: ["organization", organizationId, "work"] });
      router.push(`/organizations/${organizationId}/work/${created.id}`);
    },
  });

  const clientName = (id: string | undefined) => clients.data?.find((client) => client.id === id)?.name;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Work</h1>
        <Link href={`/organizations/${organizationId}/clients`} className="text-sm text-brand hover:underline">
          Clients and projects →
        </Link>
      </div>

      <Card title="New work">
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            create.mutate();
          }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label="Title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="work-client" className="text-sm font-medium">
              Client
            </label>
            <select
              id="work-client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="">None</option>
              {clients.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" busy={create.isPending}>
            Create
          </Button>
        </form>
        {create.error ? (
          <div className="mt-3">
            <Alert tone="error">{errorText(create.error)}</Alert>
          </div>
        ) : null}
      </Card>

      <Card title="All work">
        {work.error ? <Alert tone="error">{errorText(work.error)}</Alert> : null}
        {work.data?.length === 0 ? <p className="text-sm text-text-secondary">No work yet.</p> : null}
        <ul className="divide-y divide-border">
          {work.data?.map((item) => {
            const summary = completenessSummary(item.completeness);
            return (
              <li key={item.id} className="py-3">
                <Link href={`/organizations/${organizationId}/work/${item.id}`} className="group flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-brand">{item.title}</p>
                    <p className="text-sm text-text-secondary">
                      {statusLabel(item.status)}
                      {clientName(item.clientId) ? ` · ${clientName(item.clientId)}` : ""}
                      {item.openExceptions ? <span className="text-error"> · {item.openExceptions} {item.openExceptions === 1 ? "exception" : "exceptions"}</span> : null}
                    </p>
                  </div>
                  <div className="w-40 shrink-0">
                    <progress className="completeness h-1.5 w-full" value={summary.ratio} max={1} aria-label={summary.text} />
                    <p className="mt-1 text-xs text-text-secondary">{summary.text}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

export default function WorkPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <AppShell>
      <WorkList organizationId={organizationId} />
    </AppShell>
  );
}
