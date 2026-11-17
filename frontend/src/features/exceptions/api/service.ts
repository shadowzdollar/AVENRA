import { api, unwrap } from '@/lib/api-client';
import type { ExceptionFilters, ExceptionStatus } from './types';

export function listExceptions(organizationId: string, filters: ExceptionFilters = {}) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/exceptions', {
      params: { path: { organizationId }, query: filters }
    })
  );
}

export function transitionException(
  organizationId: string,
  exceptionId: string,
  body: { to: ExceptionStatus; expectedStatus: ExceptionStatus; resolution?: string }
) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/exceptions/{exceptionId}/transitions', {
      params: { path: { organizationId, exceptionId } },
      body
    })
  );
}

export function assignException(
  organizationId: string,
  exceptionId: string,
  assigneeMembershipId: string | undefined
) {
  return unwrap(
    api.PATCH('/api/v1/organizations/{organizationId}/exceptions/{exceptionId}', {
      params: { path: { organizationId, exceptionId } },
      body: { assigneeMembershipId }
    })
  );
}
