"use client";

import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "./api";
import { sessionKey } from "./session";

/**
 * The person's permissions in one organization, from the session. The
 * interface only adapts to them; the API enforces every one (Guidelines §18).
 */
export function usePermissions(organizationId: string): Set<string> {
  const session = useQuery({ queryKey: sessionKey, queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")) });
  return new Set(session.data?.organizations.find((membership) => membership.organization.id === organizationId)?.permissions ?? []);
}
