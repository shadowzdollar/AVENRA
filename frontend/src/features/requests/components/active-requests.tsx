'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';
import { requestLinkMutations, requestLinkQueries } from '../api/queries';
import type { RequestLinkStatus } from '../api/types';

const STATUS_CLASS: Record<RequestLinkStatus, string> = {
  ACTIVE: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  EXPIRED: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  REVOKED: 'text-muted-foreground'
};

export function ActiveRequests() {
  const { organizationId, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RequestLinkStatus | 'all'>('ACTIVE');

  const { data: links, isPending } = useQuery({
    ...requestLinkQueries.list(orgId),
    enabled: organizationId !== null
  });

  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: requestLinkQueries.all(orgId) });
  const onError = (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : 'Action failed');
  const remind = useMutation({
    ...requestLinkMutations.remind(orgId),
    onSuccess: (link) => toast.success(`Reminder sent to ${link.recipientEmail}`),
    onError,
    onSettled
  });
  const revoke = useMutation({
    ...requestLinkMutations.revoke(orgId),
    onSuccess: () => toast.success('Link revoked; it no longer opens.'),
    onError,
    onSettled
  });

  const all = links ?? [];
  const shown = all.filter((l) => tab === 'all' || l.status === tab);
  const count = (s: RequestLinkStatus) => all.filter((l) => l.status === s).length;
  const canManage = hasPermission('information.collect');

  return (
    <div className='flex flex-col gap-6'>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value='ACTIVE'>Active ({count('ACTIVE')})</TabsTrigger>
          <TabsTrigger value='EXPIRED'>Expired ({count('EXPIRED')})</TabsTrigger>
          <TabsTrigger value='REVOKED'>Revoked ({count('REVOKED')})</TabsTrigger>
          <TabsTrigger value='all'>All ({all.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending && organizationId !== null && <Skeleton className='h-32 w-full' />}
      {!isPending && shown.length === 0 && (
        <Card className='p-12 text-center text-muted-foreground'>
          <p className='text-base font-semibold'>No requests in this view</p>
          <p className='text-sm'>Send one from Client Requests.</p>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4'>
        {shown.map((link) => {
          const answered = link.answeredCount ?? 0;
          const total = link.requirementIds.length;
          return (
            <Card key={link.id}>
              <CardHeader className='pb-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Badge variant='outline' className={`text-xs ${STATUS_CLASS[link.status]}`}>
                    {link.status}
                  </Badge>
                  <span className='text-muted-foreground text-xs'>
                    Sent {formatDistanceToNowStrict(new Date(link.createdAt), { addSuffix: true })}{' '}
                    · expires{' '}
                    {formatDistanceToNowStrict(new Date(link.expiresAt), { addSuffix: true })}
                  </span>
                </div>
                <CardTitle className='mt-2 text-base font-semibold'>
                  {link.recipientName ?? link.recipientEmail} —{' '}
                  <span className='text-muted-foreground font-normal'>{link.workTitle}</span>
                </CardTitle>
                <CardDescription className='text-xs'>
                  {link.recipientEmail} · {link.remindersSent} reminder
                  {link.remindersSent === 1 ? '' : 's'} sent
                  {link.lastOpenedAt
                    ? ` · last opened ${formatDistanceToNowStrict(new Date(link.lastOpenedAt), { addSuffix: true })}`
                    : ' · not opened yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 pt-0'>
                <div className='flex items-center gap-3 text-xs'>
                  <Progress value={total === 0 ? 0 : (answered / total) * 100} className='flex-1' />
                  <span className='tabular-nums'>
                    {answered}/{total} answered
                  </span>
                </div>
                {canManage && link.status === 'ACTIVE' && (
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={remind.isPending}
                      onClick={() => remind.mutate({ workId: link.workId, requestLinkId: link.id })}
                    >
                      <Icons.send className='mr-1.5 h-3.5 w-3.5' /> Send Reminder
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='text-destructive'
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate({ workId: link.workId, requestLinkId: link.id })}
                    >
                      Revoke
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
