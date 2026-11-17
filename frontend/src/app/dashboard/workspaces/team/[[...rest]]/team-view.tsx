'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { teamInfoContent } from '@/config/infoconfig';
import { organizationMutations, organizationQueries } from '@/features/organizations/api/queries';
import { ROLE_LABELS, type Role } from '@/features/organizations/api/types';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';
import { toAvatarUser } from '@/lib/auth/types';

const INVITABLE_ROLES: Role[] = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

export default function TeamView() {
  const { organizationId, membership, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const enabled = organizationId !== null;
  const queryClient = useQueryClient();
  const canManage = hasPermission('members.manage');

  const { data: members = [] } = useQuery({
    ...organizationQueries.members(orgId),
    enabled: enabled && hasPermission('members.read')
  });
  const { data: invitations = [] } = useQuery({
    ...organizationQueries.invitations(orgId),
    enabled: enabled && canManage
  });

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const invite = useMutation({
    ...organizationMutations.invite(orgId),
    onSuccess: (invitation) => {
      toast.success(`Invitation sent to ${invitation.email}`);
      setEmail('');
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Couldn't send the invitation"),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: organizationQueries.invitations(orgId).queryKey })
  });

  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription={`Members, roles and invitations for ${membership?.organization.name ?? 'this workspace'}.`}
      infoContent={teamInfoContent}
    >
      <div className='max-w-3xl space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>Roles decide what each person can see and do.</CardDescription>
          </CardHeader>
          <CardContent className='divide-y'>
            {members.map((m) => (
              <div key={m.membershipId} className='flex items-center justify-between gap-3 py-3'>
                <UserAvatarProfile
                  showInfo
                  user={toAvatarUser({ displayName: m.displayName, email: m.email })}
                />
                <div className='flex items-center gap-2'>
                  {m.membershipId === membership?.membershipId && (
                    <Badge variant='secondary'>You</Badge>
                  )}
                  <Badge variant='outline'>{ROLE_LABELS[m.role]}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>Invite a teammate</CardTitle>
              <CardDescription>
                They receive an email link and join after signing in.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <form
                className='flex flex-col gap-2 sm:flex-row'
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) invite.mutate({ email: email.trim(), role });
                }}
              >
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='colleague@firm.com'
                  maxLength={254}
                  aria-label='Email'
                  required
                />
                <select
                  aria-label='Role'
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className='border-input bg-background rounded-md border px-3 py-2 text-sm'
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <Button type='submit' disabled={invite.isPending}>
                  Send invite
                </Button>
              </form>
              {invitations.length > 0 && (
                <ul className='divide-y rounded-md border text-sm'>
                  {invitations.map((i) => (
                    <li key={i.id} className='flex items-center justify-between gap-2 px-3 py-2'>
                      <span className='truncate'>{i.email}</span>
                      <span className='text-muted-foreground text-xs'>
                        {ROLE_LABELS[i.role]} · expires{' '}
                        {formatDistanceToNowStrict(new Date(i.expiresAt), { addSuffix: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
