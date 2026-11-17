import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import { createOrganization, inviteMember, listInvitations, listMembers } from './service';
import type { Role } from './types';

export const organizationQueries = {
  members: (organizationId: string) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'members'),
      queryFn: () => listMembers(organizationId),
      ...live,
      refetchInterval: 60_000
    }),
  invitations: (organizationId: string) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'invitations'),
      queryFn: () => listInvitations(organizationId),
      ...live,
      refetchInterval: 60_000
    })
};

export const organizationMutations = {
  create: () => mutationOptions({ mutationFn: (name: string) => createOrganization(name) }),
  invite: (organizationId: string) =>
    mutationOptions({
      mutationFn: (input: { email: string; role: Role }) =>
        inviteMember(organizationId, input.email, input.role)
    })
};
