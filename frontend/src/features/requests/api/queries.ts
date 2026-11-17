import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import {
  createRequestLink,
  listRequestLinks,
  remindRequestLink,
  revokeRequestLink
} from './service';
import type { CreateRequestLinkRequest, RequestLinkStatus } from './types';

export const requestLinkQueries = {
  all: (organizationId: string) => orgKey(organizationId, 'request-links'),
  list: (organizationId: string, status?: RequestLinkStatus) =>
    queryOptions({
      queryKey: [...requestLinkQueries.all(organizationId), status ?? 'all'] as const,
      queryFn: () => listRequestLinks(organizationId, status),
      ...live
    })
};

export const requestLinkMutations = {
  create: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: { workId: string; body: CreateRequestLinkRequest }) =>
        createRequestLink(organizationId, input.workId, input.body)
    }),
  remind: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: { workId: string; requestLinkId: string }) =>
        remindRequestLink(organizationId, input.workId, input.requestLinkId)
    }),
  revoke: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: { workId: string; requestLinkId: string }) =>
        revokeRequestLink(organizationId, input.workId, input.requestLinkId)
    })
};
