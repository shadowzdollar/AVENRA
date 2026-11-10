"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Mail, UserPlus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { Alert, Avatar, Button, Field, PageHeader, Panel, Pill, TABLE } from "@/components/ui";
import { api, ApiError, idempotencyKey, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";

type Role = components["schemas"]["Role"];
const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];
const SELECT = "h-8 rounded-lg border border-border bg-background px-2 text-[13px]";

function errorText(error: unknown): string | null {
  return error instanceof ApiError ? error.message : error ? "Something went wrong. Please try again." : null;
}

function Invite({ organizationId, onInvited }: { organizationId: string; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const invite = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/invitations", {
          params: { path: { organizationId }, header: { "Idempotency-Key": idempotencyKey() } },
          body: { email, role },
        }),
      ),
    onSuccess: () => {
      setEmail("");
      onInvited();
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    invite.mutate();
  }
  return (
    <Panel title="Invite someone">
      <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Email" type="email" icon={Mail} required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-role" className="text-[13px] font-medium">
            Role
          </label>
          <select id="invite-role" value={role} onChange={(event) => setRole(event.target.value as Role)} className={`${SELECT} h-9`}>
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {option.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" busy={invite.isPending}>
          <UserPlus />
          Send invitation
        </Button>
      </form>
      {invite.error ? (
        <div className="mt-3">
          <Alert tone="error">{errorText(invite.error)}</Alert>
        </div>
      ) : null}
    </Panel>
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
    <Panel title="Roles and permissions" flush>
      <div className={TABLE.wrap}>
        <table className={TABLE.table}>
          <thead>
            <tr>
              <th className={TABLE.th}>Permission</th>
              {roles.data?.map((role) => (
                <th key={role.role} className={`${TABLE.th} text-center`}>
                  {role.role.toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission}>
                <td className={`${TABLE.td} font-mono text-[12px]`}>{permission}</td>
                {roles.data?.map((role) => (
                  <td key={role.role} className={`${TABLE.td} text-center`}>
                    {role.permissions.includes(permission) ? (
                      <Check className="mx-auto size-4 text-brand" aria-label="allowed" />
                    ) : (
                      <span className="text-text-secondary" aria-label="not allowed">
                        ·
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Team({ id }: { id: string }) {
  const queries = useQueryClient();
  const permissions = usePermissions(id);
  const canManage = permissions.has("members.manage");
  const path = { params: { path: { organizationId: id } } };
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
      unwrap(await api.DELETE("/api/v1/organizations/{organizationId}/members/{membershipId}", { params: { path: { organizationId: id, membershipId } } })),
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutationFn: async (invitationId: string) =>
      unwrap(await api.DELETE("/api/v1/organizations/{organizationId}/invitations/{invitationId}", { params: { path: { organizationId: id, invitationId } } })),
    onSettled: refresh,
  });
  const actionError = errorText(changeRole.error ?? remove.error ?? revoke.error);

  return (
    <div className="space-y-5">
      <PageHeader title="Team" subtitle="Who can see, change, approve and administer the organization's work." />
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {canManage ? <Invite organizationId={id} onInvited={refresh} /> : null}

      <Panel title="Members" flush>
        <div className={TABLE.wrap}>
          <table className={TABLE.table}>
            <thead>
              <tr>
                <th className={TABLE.th}>Name</th>
                <th className={TABLE.th}>Email</th>
                <th className={TABLE.th}>Role</th>
                {canManage ? <th className={TABLE.th} /> : null}
              </tr>
            </thead>
            <tbody>
              {members.data?.map((member) => (
                <tr key={member.membershipId} className={TABLE.row}>
                  <td className={TABLE.td}>
                    <span className="flex items-center gap-3">
                      <Avatar name={member.displayName} />
                      <span className="font-medium">{member.displayName}</span>
                    </span>
                  </td>
                  <td className={`${TABLE.td} text-text-secondary`}>{member.email}</td>
                  <td className={TABLE.td}>
                    {canManage ? (
                      <select
                        aria-label={`Role of ${member.displayName}`}
                        value={member.role}
                        onChange={(event) => changeRole.mutate({ membershipId: member.membershipId, role: event.target.value as Role })}
                        className={SELECT}
                      >
                        {ROLES.map((option) => (
                          <option key={option} value={option}>
                            {option.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Pill tone={member.role === "OWNER" || member.role === "ADMIN" ? "brand" : "neutral"}>{member.role.toLowerCase()}</Pill>
                    )}
                  </td>
                  {canManage ? (
                    <td className={`${TABLE.td} text-right`}>
                      <Button variant="danger" size="sm" onClick={() => remove.mutate(member.membershipId)}>
                        Remove
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {canManage && invitations.data && invitations.data.length > 0 ? (
        <Panel title="Pending invitations">
          <ul className="divide-y divide-border text-[13px]">
            {invitations.data.map((invitation) => (
              <li key={invitation.id} className="flex items-center justify-between py-2.5">
                <span>
                  {invitation.email} <span className="text-text-secondary">· {invitation.role.toLowerCase()} · pending</span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => revoke.mutate(invitation.id)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Roles organizationId={id} />
    </div>
  );
}

export default function TeamPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Team id={organizationId} />;
}
