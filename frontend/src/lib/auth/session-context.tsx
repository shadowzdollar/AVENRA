'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, unwrap, unwrapEmpty } from '@/lib/api-client';
import type { CurrentUser, OrganizationMembership } from './types';
import { ACTIVE_ORG_COOKIE } from './types';

export const sessionQueryKey = ['auth', 'session'] as const;

interface SessionContextValue {
  user: CurrentUser;
  memberships: OrganizationMembership[];
  /** The membership in the organization the user is working in; null when they have none. */
  membership: OrganizationMembership | null;
  organizationId: string | null;
  setActiveOrganization: (organizationId: string) => void;
  hasPermission: (permission: string) => boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function persistActiveOrganization(organizationId: string) {
  // UI preference only (one year); the backend authorizes every organization-scoped call.
  document.cookie = `${ACTIVE_ORG_COOKIE}=${encodeURIComponent(organizationId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function SessionProvider({
  initialUser,
  initialOrganizationId,
  children
}: {
  initialUser: CurrentUser;
  initialOrganizationId: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(initialOrganizationId);

  const { data: user = initialUser } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => unwrap(api.GET('/api/v1/auth/session')),
    initialData: initialUser,
    // Memberships and permissions can change while the tab is open (role change, removal).
    refetchInterval: 60_000,
    refetchOnWindowFocus: true
  });

  const memberships = user.organizations;
  const membership =
    memberships.find((m) => m.organization.id === selectedOrganizationId) ?? memberships[0] ?? null;
  const organizationId = membership?.organization.id ?? null;

  const setActiveOrganization = useCallback(
    (id: string) => {
      persistActiveOrganization(id);
      setSelectedOrganizationId(id);
      // Organization-scoped data must not leak across a switch.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'org' });
      router.refresh();
    },
    [queryClient, router]
  );

  const signOut = useCallback(async () => {
    try {
      await unwrapEmpty(api.POST('/api/v1/auth/sign-out'));
    } finally {
      queryClient.clear();
      router.replace('/auth/sign-in');
      router.refresh();
    }
  }, [queryClient, router]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      memberships,
      membership,
      organizationId,
      setActiveOrganization,
      hasPermission: (permission) => membership?.permissions.includes(permission) ?? false,
      signOut,
      refresh
    }),
    [user, memberships, membership, organizationId, setActiveOrganization, signOut, refresh]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

/** The active organization id, for organization-scoped queries. */
export function useOrganizationId(): string | null {
  return useSession().organizationId;
}
