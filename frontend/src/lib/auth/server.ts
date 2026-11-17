import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { CurrentUser } from './types';
import { ACTIVE_ORG_COOKIE, SESSION_COOKIE } from './types';

/**
 * Server-side session lookup (ADR-013). The backend is the only authority: the HttpOnly
 * session cookie is forwarded to `GET /api/v1/auth/session`, which answers with the user and
 * their memberships. Tenant context is never taken from the client; the active-organization
 * cookie is a UI preference and is validated against the memberships returned here.
 */
export async function getSession(): Promise<CurrentUser | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE);
  if (!session) return null;

  const { data, response } = await api.GET('/api/v1/auth/session', {
    headers: { cookie: `${SESSION_COOKIE}=${session.value}` },
    cache: 'no-store'
  });
  if (response.status === 401) return null;
  if (!response.ok || !data) {
    throw new Error(`Session lookup failed with HTTP ${response.status}`);
  }
  return data;
}

/** Use at the top of every protected page or layout: redirects anonymous visitors to sign-in. */
export async function requireSession(): Promise<CurrentUser> {
  const user = await getSession();
  if (!user) redirect('/auth/sign-in');
  return user;
}

/** The organization the user last selected, if they are still a member of it. */
export async function getActiveOrganizationId(user: CurrentUser): Promise<string | null> {
  const store = await cookies();
  const preferred = store.get(ACTIVE_ORG_COOKIE)?.value;
  const match = user.organizations.find((m) => m.organization.id === preferred);
  return (match ?? user.organizations[0])?.organization.id ?? null;
}
