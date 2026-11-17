import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import { listAgentRuns, startAgentRun } from './service';
import type { AgentRunStatus } from './types';

export const agentQueries = {
  all: (organizationId: string) => orgKey(organizationId, 'agent-runs'),
  list: (organizationId: string, status?: AgentRunStatus) =>
    queryOptions({
      queryKey: [...agentQueries.all(organizationId), status ?? 'all'] as const,
      queryFn: () => listAgentRuns(organizationId, status),
      ...live,
      refetchInterval: 5_000
    })
};

export const agentMutations = {
  start: (organizationId: string) =>
    mutationOptions({ mutationFn: (workId: string) => startAgentRun(organizationId, workId) })
};
