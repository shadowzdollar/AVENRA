import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import {
  createWork,
  getWork,
  listClients,
  listWork,
  listWorkTransitions,
  transitionWork
} from './service';
import type { CreateWorkRequest, WorkFilters, WorkStatus } from './types';

export const workQueries = {
  all: (organizationId: string) => orgKey(organizationId, 'work'),
  list: (organizationId: string, filters: WorkFilters = {}) =>
    queryOptions({
      queryKey: [...workQueries.all(organizationId), 'list', filters] as const,
      queryFn: () => listWork(organizationId, filters),
      ...live
    }),
  detail: (organizationId: string, workId: string) =>
    queryOptions({
      queryKey: [...workQueries.all(organizationId), 'detail', workId] as const,
      queryFn: () => getWork(organizationId, workId),
      ...live
    }),
  transitions: (organizationId: string, workId: string) =>
    queryOptions({
      queryKey: [...workQueries.all(organizationId), 'transitions', workId] as const,
      queryFn: () => listWorkTransitions(organizationId, workId),
      ...live
    }),
  clients: (organizationId: string) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'clients'),
      queryFn: () => listClients(organizationId),
      staleTime: 60_000
    })
};

export const workMutations = {
  transition: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: {
        workId: string;
        to: WorkStatus;
        expectedStatus: WorkStatus;
        reason?: string;
      }) =>
        transitionWork(organizationId, input.workId, {
          to: input.to,
          expectedStatus: input.expectedStatus,
          reason: input.reason
        })
    }),
  create: (organizationId: string) =>
    mutationOptions({
      mutationFn: (body: CreateWorkRequest) => createWork(organizationId, body)
    })
};
