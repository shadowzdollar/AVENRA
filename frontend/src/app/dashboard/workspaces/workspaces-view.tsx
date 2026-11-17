'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { workspacesInfoContent } from '@/config/infoconfig';
import { organizationMutations } from '@/features/organizations/api/queries';
import { ROLE_LABELS } from '@/features/organizations/api/types';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

export default function WorkspacesView() {
  const router = useRouter();
  const { memberships, organizationId, setActiveOrganization, refresh } = useSession();
  const [name, setName] = useState('');

  const create = useMutation({
    ...organizationMutations.create(),
    onSuccess: async (organization) => {
      toast.success(`Workspace ${organization.name} created`);
      setName('');
      await refresh();
      setActiveOrganization(organization.id);
      router.push('/dashboard/workspaces/team');
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Couldn't create the workspace")
  });

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them'
      infoContent={workspacesInfoContent}
    >
      <div className='max-w-3xl space-y-6'>
        <div className='space-y-2'>
          {memberships.map((m) => {
            const active = m.organization.id === organizationId;
            return (
              <button
                key={m.membershipId}
                type='button'
                onClick={() => {
                  setActiveOrganization(m.organization.id);
                  router.push('/dashboard/workspaces/team');
                }}
                className='hover:bg-accent flex w-full items-center gap-3 rounded-lg border p-4 text-left'
              >
                <AvenraIcon size={32} />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-lg font-semibold'>{m.organization.name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {ROLE_LABELS[m.role]} · since{' '}
                    {new Date(m.organization.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {active && <Badge>Active</Badge>}
                <Icons.chevronRight className='text-muted-foreground size-4' />
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a workspace</CardTitle>
            <CardDescription>
              A separate organization with its own clients, work and members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className='flex gap-2'
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) create.mutate(name.trim());
              }}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Northwind Advisors'
                maxLength={100}
                aria-label='Workspace name'
              />
              <Button type='submit' disabled={!name.trim() || create.isPending}>
                <Icons.add className='mr-1 size-4' /> Create
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
