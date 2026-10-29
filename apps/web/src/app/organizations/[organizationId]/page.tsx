"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { AiSettingsCard } from "@/components/ai-settings";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, ApiError, idempotencyKey, unwrap } from "@/lib/api";

type Role = components["schemas"]["Role"];
const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];

function errorText(error: unknown): string | null {
  return error instanceof ApiError ? error.message : error ? "Something went wrong. Please try again." : null;
}

function Organization({ id }: { id: string }) {
  const queries = useQueryClient();
  const path = { params: { path: { organizationId: id } } };
  const organization = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}", path)),
  });
  const session = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")),
  });
  const permissions = new Set(
    session.data?.organizations.find((membership) => membership.organization.id === id)?.permissions ?? [],
  );
  const canManage = permissions.has("members.manage");

  const members = useQuery({
    queryKey: ["organization", id, "members"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/members", path)),
  });
  const invitations = useQuery({
    queryKey: ["organization", id, "invitations"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/invitations", path)),
  });
  const refresh = () => void queries.invalidateQueries({ queryKey: ["organization", id] });

  const changeRole = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: Role }) =>
      unwrap(
        await api.PATCH("/api/v1/organizations/{organizationId}/members/{membershipId}", {
          params: { path: { organizationId: id, membershipId } },
          body: { role },
        }),
      ),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async (membershipId: string) =>
      unwrap(
        await api.DELETE("/api/v1/organizations/{organizationId}/members/{membershipId}", {
          params: { path: { organizationId: id, membershipId } },
        }),
      ),
    onSettled: refresh,
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const invite = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/invitations", {
          params: { path: { organizationId: id }, header: { "Idempotency-Key": idempotencyKey() } },
          body: { email, role },
        }),
      ),
    onSuccess: () => {
      setEmail("");
      refresh();
    },
  });
  const revoke = useMutation({
    mutationFn: async (invitationId: string) =>
      unwrap(
        await api.DELETE("/api/v1/organizations/{organizationId}/invitations/{invitationId}", {
          params: { path: { organizationId: id, invitationId } },
        }),
      ),
    onSettled: refresh,
  });

  function submitInvite(event: FormEvent) {
    event.preventDefault();
    invite.mutate();
  }

  if (organization.error) {
    return <Alert tone="error">{errorText(organization.error)}</Alert>;
  }

  const actionError = errorText(changeRole.error ?? remove.error ?? revoke.error);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{organization.data?.name ?? "…"}</h1>
        <nav className="flex gap-4 text-sm">
          <Link href={`/organizations/${id}/work`} className="text-brand hover:underline">
            Work
          </Link>
          <Link href={`/organizations/${id}/clients`} className="text-brand hover:underline">
            Clients and projects
          </Link>
          {permissions.has("integration.read") ? (
            <Link href={`/organizations/${id}/integrations`} className="text-brand hover:underline">
              Integrations
            </Link>
          ) : null}
          {permissions.has("billing.read") ? (
            <Link href={`/organizations/${id}/billing`} className="text-brand hover:underline">
              Billing
            </Link>
          ) : null}
          {permissions.has("organization.manage") || permissions.has("audit.read") ? (
            <Link href={`/organizations/${id}/administration`} className="text-brand hover:underline">
              Administration
            </Link>
          ) : null}
        </nav>
      </div>
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}

      <Card title="Members">
        <table className="w-full text-left text-sm">
          <thead className="text-text-secondary">
            <tr>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              {canManage ? <th className="py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {members.data?.map((member) => (
              <tr key={member.membershipId} className="border-t border-border">
                <td className="py-2">{member.displayName}</td>
                <td className="py-2 text-text-secondary">{member.email}</td>
                <td className="py-2">
                  {canManage ? (
                    <select
                      aria-label={`Role of ${member.displayName}`}
                      value={member.role}
                      onChange={(event) => changeRole.mutate({ membershipId: member.membershipId, role: event.target.value as Role })}
                      className="h-8 rounded-md border border-border bg-background px-2"
                    >
                      {ROLES.map((option) => (
                        <option key={option} value={option}>
                          {option.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    member.role.toLowerCase()
                  )}
                </td>
                {canManage ? (
                  <td className="py-2 text-right">
                    <Button variant="danger" onClick={() => remove.mutate(member.membershipId)}>
                      Remove
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {canManage ? (
        <Card title="Invite someone">
          <form onSubmit={submitInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              >
                {ROLES.map((option) => (
                  <option key={option} value={option}>
                    {option.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" busy={invite.isPending}>
              Send invitation
            </Button>
          </form>
          {invite.error ? (
            <div className="mt-3">
              <Alert tone="error">{errorText(invite.error)}</Alert>
            </div>
          ) : null}
          {invitations.data && invitations.data.length > 0 ? (
            <ul className="mt-6 divide-y divide-border text-sm">
              {invitations.data.map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between py-2">
                  <span>
                    {invitation.email} <span className="text-text-secondary">· {invitation.role.toLowerCase()} · pending</span>
                  </span>
                  <Button variant="secondary" onClick={() => revoke.mutate(invitation.id)}>
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <AiSettingsCard organizationId={id} permissions={permissions} />
    </div>
  );
}

export default function OrganizationPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <AppShell>
      <Organization id={organizationId} />
    </AppShell>
  );
}
