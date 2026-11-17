import { api, idempotencyKey, unwrap } from '@/lib/api-client';
import type { AgentRunStatus } from './types';

export function listAgentRuns(organizationId: string, status?: AgentRunStatus) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/agent-runs', {
      params: { path: { organizationId }, query: { status } }
    })
  );
}

export function startAgentRun(organizationId: string, workId: string) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work/{workId}/agent-runs', {
      params: { path: { organizationId, workId }, header: { 'Idempotency-Key': idempotencyKey() } }
    })
  );
}

export function decideAgentRun(
  organizationId: string,
  workId: string,
  runId: string,
  body: { decision: 'APPROVE' | 'REJECT'; highRiskStepIds?: string[]; reason?: string }
) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work/{workId}/agent-runs/{runId}/approval', {
      params: { path: { organizationId, workId, runId } },
      body
    })
  );
}

export function stopAgentRun(
  organizationId: string,
  workId: string,
  runId: string,
  reason: string
) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/work/{workId}/agent-runs/{runId}/stop', {
      params: { path: { organizationId, workId, runId } },
      body: { reason }
    })
  );
}
