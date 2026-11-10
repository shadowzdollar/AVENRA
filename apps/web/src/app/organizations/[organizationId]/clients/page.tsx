"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, Card, Field, PageHeader } from "@/components/ui";
import { api, idempotencyKey, unwrap } from "@/lib/api";
import { errorText } from "@/lib/work";

function Clients({ organizationId }: { organizationId: string }) {
  const queries = useQueryClient();
  const path = { params: { path: { organizationId } } };
  const clients = useQuery({
    queryKey: ["organization", organizationId, "clients"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/clients", path)),
  });
  const projects = useQuery({
    queryKey: ["organization", organizationId, "projects"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/projects", path)),
  });
  const refresh = () => void queries.invalidateQueries({ queryKey: ["organization", organizationId] });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const createClient = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/clients", {
          params: { path: { organizationId }, header: { "Idempotency-Key": idempotencyKey() } },
          body: email ? { name, email } : { name },
        }),
      ),
    onSuccess: () => {
      setName("");
      setEmail("");
      refresh();
    },
  });

  const [projectName, setProjectName] = useState("");
  const [projectClient, setProjectClient] = useState("");
  const createProject = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/projects", {
          params: { path: { organizationId }, header: { "Idempotency-Key": idempotencyKey() } },
          body: projectClient ? { name: projectName, clientId: projectClient } : { name: projectName },
        }),
      ),
    onSuccess: () => {
      setProjectName("");
      refresh();
    },
  });

  const clientName = (id: string | undefined) => clients.data?.find((client) => client.id === id)?.name;

  return (
    <div className="space-y-5">
      <PageHeader title="Clients and projects" subtitle="Who the work is for, and the projects it belongs to." />

      <Card title="Clients">
        {clients.error ? <Alert tone="error">{errorText(clients.error)}</Alert> : null}
        {clients.data?.length === 0 ? <p className="text-sm text-text-secondary">No clients yet.</p> : null}
        <ul className="divide-y divide-border text-sm">
          {clients.data?.map((client) => (
            <li key={client.id} className="flex justify-between py-2">
              <span>{client.name}</span>
              <span className="text-text-secondary">{client.email ?? ""}</span>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            createClient.mutate();
          }}
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label="Client name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex-1">
            <Field label="Contact email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" busy={createClient.isPending}>
            Add client
          </Button>
        </form>
        {createClient.error ? (
          <div className="mt-3">
            <Alert tone="error">{errorText(createClient.error)}</Alert>
          </div>
        ) : null}
      </Card>

      <Card title="Projects">
        {projects.data?.length === 0 ? <p className="text-sm text-text-secondary">No projects yet.</p> : null}
        <ul className="divide-y divide-border text-sm">
          {projects.data?.map((project) => (
            <li key={project.id} className="flex justify-between py-2">
              <span>{project.name}</span>
              <span className="text-text-secondary">{clientName(project.clientId) ?? ""}</span>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            createProject.mutate();
          }}
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label="Project name" required maxLength={200} value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-client" className="text-sm font-medium">
              Client
            </label>
            <select
              id="project-client"
              value={projectClient}
              onChange={(event) => setProjectClient(event.target.value)}
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
          <Button type="submit" busy={createProject.isPending}>
            Add project
          </Button>
        </form>
        {createProject.error ? (
          <div className="mt-3">
            <Alert tone="error">{errorText(createProject.error)}</Alert>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default function ClientsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <>
      <Clients organizationId={organizationId} />
    </>
  );
}
