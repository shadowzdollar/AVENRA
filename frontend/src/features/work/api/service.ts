import { api, idempotencyKey, unwrap, type components } from '@/lib/api-client';
import type { CreateWorkRequest, WorkFilters, WorkStatus } from './types';

export function listWork(organizationId: string, filters: WorkFilters = {}) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/work', {
      params: { path: { organizationId }, query: filters }
    })
  );
}

export function getWork(organizationId: string, workId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/work/{workId}', {
      params: { path: { organizationId, workId } }
    })
  );
}

export function listWorkTransitions(organizationId: string, workId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/work/{workId}/transitions', {
      params: { path: { organizationId, workId } }
    })
  );
}

/** Status changes go through the server's state machine with optimistic concurrency. */
export function transitionWork(
  organizationId: string,
  workId: string,
  body: { to: WorkStatus; expectedStatus: WorkStatus; reason?: string }
) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work/{workId}/transitions', {
      params: { path: { organizationId, workId } },
      body
    })
  );
}

export function createWork(organizationId: string, body: CreateWorkRequest) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work', {
      params: { path: { organizationId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body
    })
  );
}

export function listClients(organizationId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/clients', {
      params: { path: { organizationId } }
    })
  );
}

export function createRequirement(
  organizationId: string,
  workId: string,
  body: components['schemas']['CreateRequirementRequest']
) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work/{workId}/requirements', {
      params: { path: { organizationId, workId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body
    })
  );
}

/** Accept or reject the current answer to a requirement (information.verify). */
export function reviewRequirement(
  organizationId: string,
  workId: string,
  requirementId: string,
  body: components['schemas']['ReviewRequest']
) {
  return unwrap(
    api.POST(
      '/api/v1/organizations/{organizationId}/work/{workId}/requirements/{requirementId}/review',
      {
        params: { path: { organizationId, workId, requirementId } },
        body
      }
    )
  );
}
