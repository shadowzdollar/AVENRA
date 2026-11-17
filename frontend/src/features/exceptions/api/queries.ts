import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import { assignException, listExceptions, transitionException } from './service';
import type { ExceptionFilters, ExceptionStatus } from './types';

export const exceptionQueries = {
  all: (organizationId: string) => orgKey(organizationId, 'exceptions'),
  list: (organizationId: string, filters: ExceptionFilters = {}) =>
    queryOptions({
      queryKey: [...exceptionQueries.all(organizationId), 'list', filters] as const,
      queryFn: () => listExceptions(organizationId, filters),
      ...live
    })
};

export const exceptionMutations = {
  transition: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: {
        exceptionId: string;
        to: ExceptionStatus;
        expectedStatus: ExceptionStatus;
        resolution?: string;
      }) =>
        transitionException(organizationId, input.exceptionId, {
          to: input.to,
          expectedStatus: input.expectedStatus,
          resolution: input.resolution
        })
    }),
  assign: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: { exceptionId: string; assigneeMembershipId?: string }) =>
        assignException(organizationId, input.exceptionId, input.assigneeMembershipId)
    })
};
