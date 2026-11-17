import { api, idempotencyKey, unwrap, unwrapEmpty } from '@/lib/api-client';
import type { CreateRequestLinkRequest, RequestLinkStatus } from './types';

export function listRequestLinks(organizationId: string, status?: RequestLinkStatus) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/request-links', {
      params: { path: { organizationId }, query: { status } }
    })
  );
}

export function createRequestLink(
  organizationId: string,
  workId: string,
  body: CreateRequestLinkRequest
) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work/{workId}/request-links', {
      params: { path: { organizationId, workId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body
    })
  );
}

export function remindRequestLink(organizationId: string, workId: string, requestLinkId: string) {
  return unwrap(
    api.POST(
      '/api/v1/organizations/{organizationId}/work/{workId}/request-links/{requestLinkId}/reminders',
      {
        params: { path: { organizationId, workId, requestLinkId } }
      }
    )
  );
}

export function revokeRequestLink(organizationId: string, workId: string, requestLinkId: string) {
  return unwrapEmpty(
    api.DELETE(
      '/api/v1/organizations/{organizationId}/work/{workId}/request-links/{requestLinkId}',
      {
        params: { path: { organizationId, workId, requestLinkId } }
      }
    )
  );
}
