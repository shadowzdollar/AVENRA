/**
 * Live data policy. The API has no push channel, so organization data is kept current by
 * polling while the tab is visible and by refetching on focus and reconnect (React Query
 * pauses interval refetches for hidden tabs by default). Mutations invalidate immediately.
 */
export const LIVE_REFETCH_MS = 15_000;

export const live = {
  refetchInterval: LIVE_REFETCH_MS,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true
} as const;

/**
 * Every organization-scoped query key starts with ['org', organizationId] so a workspace
 * switch can drop all of them at once (see SessionProvider.setActiveOrganization).
 */
export function orgKey(organizationId: string, ...rest: ReadonlyArray<unknown>) {
  return ['org', organizationId, ...rest] as const;
}
