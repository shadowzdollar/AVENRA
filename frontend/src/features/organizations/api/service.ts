import { api, idempotencyKey, unwrap } from '@/lib/api-client';
import type { Role } from './types';

export function createOrganization(name: string) {
  return unwrap(
    api.POST('/api/v1/organizations', {
      params: { header: { 'Idempotency-Key': idempotencyKey() } },
      body: { name }
    })
  );
}

export function listMembers(organizationId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/members', {
      params: { path: { organizationId } }
    })
  );
}

export function listInvitations(organizationId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/invitations', {
      params: { path: { organizationId } }
    })
  );
}

export function inviteMember(organizationId: string, email: string, role: Role) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/invitations', {
      params: { path: { organizationId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body: { email, role }
    })
  );
}

export function acceptInvitation(token: string) {
  return unwrap(api.POST('/api/v1/invitations/acceptance', { body: { token } }));
}
