"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, ApiError, idempotencyKey, unwrap } from "@/lib/api";

function Organizations() {
  const queries = useQueryClient();
  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations")),
  });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations", {
          params: { header: { "Idempotency-Key": idempotencyKey() } },
          body: { name },
        }),
      ),
    onSuccess: () => {
      setName("");
      void queries.invalidateQueries({ queryKey: ["organizations"] });
      void queries.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="mt-1 text-sm text-text-secondary">Each organization keeps its own members, work and data.</p>
      </div>

      {organizations.data && organizations.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {organizations.data.map((membership) => (
            <li key={membership.organization.id}>
              <Link
                href={`/organizations/${membership.organization.id}`}
                className="block rounded-lg border border-border p-4 hover:border-brand"
              >
                <span className="block font-medium">{membership.organization.name}</span>
                <span className="mt-1 block text-sm text-text-secondary">{membership.role.toLowerCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : organizations.data ? (
        <Alert tone="info">You are not a member of any organization yet. Create one, or accept an invitation from your email.</Alert>
      ) : null}

      <Card title="Create an organization">
        <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" busy={create.isPending}>
            Create
          </Button>
        </form>
        {create.error instanceof ApiError ? (
          <div className="mt-3">
            <Alert tone="error">{create.error.message}</Alert>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <Organizations />
    </AppShell>
  );
}
