import { api, unwrap } from '@/lib/api-client';
import type { EvidenceKind } from './types';

export function listEvidence(organizationId: string, kind?: EvidenceKind) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/evidence', {
      params: { path: { organizationId }, query: { kind } }
    })
  );
}

/** Completion manifest of completed work, re-checked against its stored hash by the server. */
export function getCompletionManifest(organizationId: string, workId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/work/{workId}/completion', {
      params: { path: { organizationId, workId } }
    })
  );
}
