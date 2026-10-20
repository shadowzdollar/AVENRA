"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { actor, auditQuery, detailsText, exportHref, NO_FILTER, type AuditFilter } from "@/lib/administration";
import { api, ApiError, unwrap } from "@/lib/api";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function usePermissions(organizationId: string): Set<string> {
  const session = useQuery({ queryKey: ["auth", "session"], queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")) });
  return new Set(session.data?.organizations.find((m) => m.organization.id === organizationId)?.permissions ?? []);
}

/** Name and defaults (ADR-036). */
function Settings({ organizationId }: { organizationId: string }) {
  const organization = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}", { params: { path: { organizationId } } })),
  });
  return organization.data ? <SettingsForm organization={organization.data} /> : null;
}

function SettingsForm({ organization }: { organization: components["schemas"]["Organization"] }) {
  const queries = useQueryClient();
  const organizationId = organization.id;
  const [name, setName] = useState(organization.name);
  const [days, setDays] = useState(String(organization.requestLinkDays));
  const save = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.PATCH("/api/v1/organizations/{organizationId}", {
          params: { path: { organizationId } },
          body: { name, requestLinkDays: Number(days) },
        }),
      ),
    onSuccess: (updated) => {
      queries.setQueryData(["organization", organizationId], updated);
      void queries.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
  return (
    <Card title="Settings">
      <form
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex-1">
          <Field label="Organization name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sm:w-56">
          <Field
            label="Request links valid for (days)"
            type="number"
            min={1}
            max={30}
            required
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <Button type="submit" busy={save.isPending}>
          Save settings
        </Button>
      </form>
      <div className="mt-3">
        {save.error ? <Alert tone="error">{errorText(save.error)}</Alert> : null}
        {save.isSuccess ? <Alert tone="success">Settings saved.</Alert> : null}
      </div>
    </Card>
  );
}

/** Usage and health over the last 24 hours, from the modules that own the data. */
function Overview({ organizationId }: { organizationId: string }) {
  const overview = useQuery({
    queryKey: ["organization", organizationId, "administration"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/administration", { params: { path: { organizationId } } })),
  });
  if (overview.error) {
    return <Alert tone="error">{errorText(overview.error)}</Alert>;
  }
  const health = overview.data?.health;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Usage">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {overview.data?.usage.map((figure) => (
            <div key={figure.key} className="contents">
              <dt className="text-text-secondary">{figure.label}</dt>
              <dd className="text-right tabular-nums" data-testid={`usage-${figure.key}`}>
                {figure.value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="Health (last 24 hours)">
        {health ? (
          <>
            <p className="mb-3 text-sm" data-testid="health-status">
              {health.status === "OK" ? "Everything looks fine." : "Something needs attention."}
            </p>
            <ul className="divide-y divide-border text-sm">
              {health.checks.map((check) => (
                <li key={check.key} className="flex items-center justify-between py-1.5">
                  <span className={check.status === "ATTENTION" ? "font-medium text-error" : "text-text-secondary"}>{check.label}</span>
                  <span className="tabular-nums">{check.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </div>
  );
}

/** What each role may do, as the API enforces it. */
function Roles({ organizationId }: { organizationId: string }) {
  const roles = useQuery({
    queryKey: ["organization", organizationId, "roles"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/roles", { params: { path: { organizationId } } })),
  });
  const permissions = [...new Set(roles.data?.flatMap((role) => role.permissions) ?? [])].sort();
  return (
    <Card title="Roles and permissions">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-text-secondary">
            <tr>
              <th className="py-2 font-medium">Permission</th>
              {roles.data?.map((role) => (
                <th key={role.role} className="px-2 py-2 text-center font-medium">
                  {role.role.toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission} className="border-t border-border">
                <td className="py-1.5 font-mono text-xs">{permission}</td>
                {roles.data?.map((role) => (
                  <td key={role.role} className="px-2 py-1.5 text-center">
                    {role.permissions.includes(permission) ? <span aria-label="allowed">✓</span> : <span aria-label="not allowed">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-text-secondary">
        Change someone&apos;s role on the{" "}
        <Link href={`/organizations/${organizationId}`} className="text-brand hover:underline">
          organization page
        </Link>
        .
      </p>
    </Card>
  );
}

/** The audit history: filtered, paged and exported (ADR-036). */
function AuditHistory({ organizationId }: { organizationId: string }) {
  const [draft, setDraft] = useState<AuditFilter>(NO_FILTER);
  const [filter, setFilter] = useState<AuditFilter>(NO_FILTER);
  const members = useQuery({
    queryKey: ["organization", organizationId, "members"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/members", { params: { path: { organizationId } } })),
  });
  const history = useInfiniteQuery({
    queryKey: ["organization", organizationId, "audit", filter],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET("/api/v1/organizations/{organizationId}/audit-events", {
          params: { path: { organizationId }, query: { ...auditQuery(filter), ...(pageParam ? { cursor: pageParam } : {}) } },
        }),
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const events = history.data?.pages.flatMap((page) => page.events) ?? [];
  const select = "h-9 rounded-md border border-border bg-background px-2 text-sm";
  return (
    <Card
      title="Audit history"
      actions={
        <a href={exportHref(organizationId, filter)} className="text-sm text-brand hover:underline" download>
          Export CSV
        </a>
      }
    >
      <form
        className="mb-4 grid gap-3 sm:grid-cols-5 sm:items-end"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          setFilter(draft);
        }}
      >
        <Field label="Action starts with" placeholder="work." value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-person" className="text-sm font-medium">
            Person
          </label>
          <select id="audit-person" className={select} value={draft.actorUserId} onChange={(e) => setDraft({ ...draft, actorUserId: e.target.value })}>
            <option value="">Anyone</option>
            {members.data?.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>
        <Field label="From" type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        <Field label="To" type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        <Button type="submit">Filter</Button>
      </form>
      {history.error ? <Alert tone="error">{errorText(history.error)}</Alert> : null}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="audit-history">
          <thead className="text-text-secondary">
            <tr>
              <th className="py-2 font-medium">When</th>
              <th className="py-2 font-medium">Who</th>
              <th className="py-2 font-medium">What</th>
              <th className="py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap py-1.5 pr-3 text-text-secondary">{new Date(event.occurredAt).toLocaleString()}</td>
                <td className="py-1.5 pr-3">{actor(event)}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">{event.action}</td>
                <td className="break-all py-1.5 text-text-secondary">{detailsText(event)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {history.isSuccess && events.length === 0 ? <p className="py-3 text-sm text-text-secondary">Nothing matches.</p> : null}
      {history.hasNextPage ? (
        <div className="mt-3">
          <Button variant="secondary" busy={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>
            Show older
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function Administration({ id }: { id: string }) {
  const permissions = usePermissions(id);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <nav className="flex gap-4 text-sm">
          <Link href={`/organizations/${id}`} className="text-brand hover:underline">
            Members
          </Link>
          {permissions.has("integration.read") ? (
            <Link href={`/organizations/${id}/integrations`} className="text-brand hover:underline">
              Integrations
            </Link>
          ) : null}
        </nav>
      </div>
      {permissions.has("organization.manage") ? (
        <>
          <Settings organizationId={id} />
          <Overview organizationId={id} />
        </>
      ) : null}
      {permissions.has("members.read") ? <Roles organizationId={id} /> : null}
      {permissions.has("audit.read") ? <AuditHistory organizationId={id} /> : null}
    </div>
  );
}

export default function AdministrationPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <AppShell>
      <Administration id={organizationId} />
    </AppShell>
  );
}
