import type { components } from '@avenra/contracts';

export type CurrentUser = components['schemas']['CurrentUser'];
export type OrganizationMembership = components['schemas']['OrganizationMembership'];
export type Organization = components['schemas']['Organization'];
export type Role = components['schemas']['Role'];

/** Set by the backend (HttpOnly, Secure, SameSite=Lax); the frontend never reads its value. */
export const SESSION_COOKIE = '__Host-avenra_session';

/**
 * Remembers which organization the user is looking at. It only selects which membership the
 * UI shows; every API path carries the organization id and the backend checks membership.
 */
export const ACTIVE_ORG_COOKIE = 'avenra_active_org';

/** Shape the existing avatar component expects. */
export function toAvatarUser(user: Pick<CurrentUser, 'displayName' | 'email'>) {
  return {
    fullName: user.displayName,
    emailAddresses: [{ emailAddress: user.email }]
  };
}
