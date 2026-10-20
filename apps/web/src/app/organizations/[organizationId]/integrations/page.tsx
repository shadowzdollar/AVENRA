"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, ApiError, idempotencyKey, unwrap } from "@/lib/api";
import { destination, EVENT_LABELS, PROVIDER_LABELS, statusText } from "@/lib/integrations";

type Connection = components["schemas"]["IntegrationConnection"];
type EventType = components["schemas"]["IntegrationEventType"];
type Provider = components["schemas"]["IntegrationProvider"];

const SELECT = "h-9 rounded-md border border-border bg-background px-2 text-sm";
const EVENTS = Object.keys(EVENT_LABELS) as EventType[];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function usePermissions(organizationId: string): Set<string> {
  const session = useQuery({ queryKey: ["auth", "session"], queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")) });
  return new Set(session.data?.organizations.find((m) => m.organization.id === organizationId)?.permissions ?? []);
}

/** A secret shown once, right after it was created or rotated (ADR-034). */
function SecretOnce({ secret }: { secret: string }) {
  return (
    <Alert tone="info">
      <span data-testid="signing-secret">
        Signing secret: <code className="break-all">{secret}</code>. Copy it now; it will not be shown again.
      </span>
    </Alert>
  );
}

function CreateConnection({ organizationId, onCreated }: { organizationId: string; onCreated: (secret?: string) => void }) {
  const [provider, setProvider] = useState<Provider>("WEBHOOK");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<EventType[]>(["work.completed"]);
  const [endpoint, setEndpoint] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [bucket, setBucket] = useState("");
  const [prefix, setPrefix] = useState("avenra/");
  const [pathStyle, setPathStyle] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/integrations", {
          params: { path: { organizationId }, header: { "Idempotency-Key": idempotencyKey() } },
          body:
            provider === "WEBHOOK"
              ? { provider, name, events, settings: { url } }
              : {
                  provider,
                  name,
                  settings: { ...(endpoint ? { endpoint } : {}), region, bucket, prefix, pathStyle },
                  credentials: { accessKey, secretKey },
                },
        }),
      ),
    onSuccess: (created) => {
      setSecretKey("");
      onCreated(created.signingSecret);
    },
  });
  return (
    <form
      className="flex flex-col gap-3 text-sm"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <label className="flex flex-col gap-1">
        Kind
        <select className={SELECT} value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
          <option value="WEBHOOK">{PROVIDER_LABELS.WEBHOOK}</option>
          <option value="S3_EXPORT">{PROVIDER_LABELS.S3_EXPORT}</option>
        </select>
      </label>
      <Field label="Name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      {provider === "WEBHOOK" ? (
        <>
          <Field label="Address (HTTPS)" required type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          <fieldset className="flex flex-col gap-1">
            <legend>Send these events</legend>
            {EVENTS.map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={events.includes(type)}
                  onChange={(e) => setEvents(e.target.checked ? [...events, type] : events.filter((t) => t !== type))}
                />
                {EVENT_LABELS[type]}
              </label>
            ))}
          </fieldset>
        </>
      ) : (
        <>
          <p className="text-text-secondary">When work is completed, its sealed proof and accepted documents are copied to this bucket.</p>
          <Field label="Endpoint (leave empty for AWS)" type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          <Field label="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
          <Field label="Bucket" required value={bucket} onChange={(e) => setBucket(e.target.value)} />
          <Field label="Folder" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={pathStyle} onChange={(e) => setPathStyle(e.target.checked)} />
            Path-style addressing (most S3-compatible services)
          </label>
          <Field label="Access key" required autoComplete="off" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} />
          <Field label="Secret key" required type="password" autoComplete="new-password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
        </>
      )}
      <div>
        <Button type="submit" busy={create.isPending}>
          Connect
        </Button>
      </div>
      {create.error ? <Alert tone="error">{errorText(create.error)}</Alert> : null}
    </form>
  );
}

function ConnectionRow({ organizationId, connection, canManage }: { organizationId: string; connection: Connection; canManage: boolean }) {
  const queries = useQueryClient();
  const [secret, setSecret] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const path = { params: { path: { organizationId, connectionId: connection.id } } };
  const refresh = () => void queries.invalidateQueries({ queryKey: ["organization", organizationId, "integrations"] });
  const deliveries = useQuery({
    queryKey: ["organization", organizationId, "integrations", connection.id, "deliveries"],
    enabled: open,
    refetchInterval: open ? 3_000 : false,
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/integrations/{connectionId}/deliveries", path)),
  });
  const act = useMutation({
    mutationFn: async (action: "test" | "pause" | "resume" | "rotate" | "revoke") => {
      switch (action) {
        case "test":
          return unwrap(await api.POST("/api/v1/organizations/{organizationId}/integrations/{connectionId}/test", path));
        case "pause":
        case "resume":
          return unwrap(
            await api.PATCH("/api/v1/organizations/{organizationId}/integrations/{connectionId}", {
              ...path,
              body: { status: action === "pause" ? "PAUSED" : "ACTIVE" },
            }),
          );
        case "rotate": {
          const rotated = unwrap(
            await api.POST("/api/v1/organizations/{organizationId}/integrations/{connectionId}/rotation", { ...path, body: {} }),
          );
          setSecret(rotated.signingSecret);
          return rotated;
        }
        case "revoke":
          return unwrap(await api.DELETE("/api/v1/organizations/{organizationId}/integrations/{connectionId}", path));
      }
    },
    onSettled: () => {
      refresh();
      setOpen(true);
    },
  });
  return (
    <li className="flex flex-col gap-2 py-3 text-sm" data-testid={`connection-${connection.name}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span>
          <span className="font-medium">{connection.name}</span>{" "}
          <span className="text-text-secondary">
            · {PROVIDER_LABELS[connection.provider]} · {destination(connection)}
          </span>
        </span>
        <span className={connection.status === "ACTIVE" ? "text-success" : "text-warning"} data-testid="connection-status">
          {statusText(connection)}
        </span>
      </div>
      {connection.provider === "WEBHOOK" ? (
        <p className="text-text-secondary">Sends: {connection.events.map((type) => EVENT_LABELS[type]).join(", ")}</p>
      ) : null}
      {secret ? <SecretOnce secret={secret} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setOpen(!open)}>
          {open ? "Hide deliveries" : "Deliveries"}
        </Button>
        {canManage ? (
          <>
            <Button variant="secondary" busy={act.isPending} onClick={() => act.mutate("test")}>
              Send a test
            </Button>
            <Button variant="secondary" busy={act.isPending} onClick={() => act.mutate(connection.status === "ACTIVE" ? "pause" : "resume")}>
              {connection.status === "ACTIVE" ? "Pause" : "Resume"}
            </Button>
            {connection.provider === "WEBHOOK" ? (
              <Button variant="secondary" busy={act.isPending} onClick={() => act.mutate("rotate")}>
                New secret
              </Button>
            ) : null}
            <Button variant="danger" busy={act.isPending} onClick={() => act.mutate("revoke")}>
              Revoke
            </Button>
          </>
        ) : null}
      </div>
      {act.error ? <Alert tone="error">{errorText(act.error)}</Alert> : null}
      {open && deliveries.data ? (
        deliveries.data.length === 0 ? (
          <p className="text-text-secondary">Nothing delivered yet.</p>
        ) : (
          <table className="w-full text-left" data-testid="deliveries">
            <thead className="text-text-secondary">
              <tr>
                <th className="py-1 font-normal">When</th>
                <th className="py-1 font-normal">Event</th>
                <th className="py-1 font-normal">Status</th>
                <th className="py-1 font-normal">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries.data.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="py-1">{new Date(delivery.createdAt).toLocaleString()}</td>
                  <td className="py-1">{delivery.eventType}</td>
                  <td className="py-1">
                    {delivery.status.toLowerCase()}
                    {delivery.lastError ? <span className="text-text-secondary"> · {delivery.lastError}</span> : null}
                  </td>
                  <td className="py-1">{delivery.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}
    </li>
  );
}

function Integrations({ organizationId }: { organizationId: string }) {
  const queries = useQueryClient();
  const permissions = usePermissions(organizationId);
  const canManage = permissions.has("integration.manage");
  const [secret, setSecret] = useState<string | undefined>();
  const connections = useQuery({
    queryKey: ["organization", organizationId, "integrations"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/integrations", { params: { path: { organizationId } } })),
  });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/organizations/${organizationId}`} className="text-sm text-text-secondary hover:text-text-primary">
          ← Organization
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tell other systems when things happen, and file the proof of completed work where you keep records.
        </p>
      </div>
      {connections.error ? <Alert tone="error">{errorText(connections.error)}</Alert> : null}
      {secret ? <SecretOnce secret={secret} /> : null}
      <Card title="Connections">
        {connections.data?.length === 0 ? <p className="text-sm text-text-secondary">No connections yet.</p> : null}
        <ul className="divide-y divide-border">
          {connections.data?.map((connection) => (
            <ConnectionRow key={connection.id} organizationId={organizationId} connection={connection} canManage={canManage} />
          ))}
        </ul>
      </Card>
      {canManage ? (
        <Card title="Connect a system">
          <CreateConnection
            organizationId={organizationId}
            onCreated={(created) => {
              setSecret(created);
              void queries.invalidateQueries({ queryKey: ["organization", organizationId, "integrations"] });
            }}
          />
        </Card>
      ) : null}
    </div>
  );
}

export default function IntegrationsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <AppShell>
      <Integrations organizationId={organizationId} />
    </AppShell>
  );
}
