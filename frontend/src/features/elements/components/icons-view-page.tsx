'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { exceptionMutations, exceptionQueries } from '@/features/exceptions/api/queries';
import {
  EXCEPTION_STATUS_LABELS,
  EXCEPTION_TYPE_LABELS,
  type WorkException
} from '@/features/exceptions/api/types';
import { organizationQueries } from '@/features/organizations/api/queries';
import { workQueries } from '@/features/work/api/queries';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

type Tab = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

function sourceLabel(source: WorkException['source']): string {
  return `${source.type.replace(/_/g, ' ').toLowerCase()} · ${source.id.slice(0, 8)}`;
}

export default function IconsViewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organizationId, membership, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const enabled = organizationId !== null;
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [resolving, setResolving] = useState<WorkException | null>(null);
  const [resolution, setResolution] = useState('');

  const { data: exceptions, isPending } = useQuery({ ...exceptionQueries.list(orgId), enabled });
  const { data: work = [] } = useQuery({ ...workQueries.list(orgId), enabled });
  const { data: clients = [] } = useQuery({ ...workQueries.clients(orgId), enabled });
  const { data: members = [] } = useQuery({
    ...organizationQueries.members(orgId),
    enabled: enabled && hasPermission('members.read')
  });

  const lookup = useMemo(() => {
    const clientNames = new Map(clients.map((c) => [c.id, c.name]));
    const workById = new Map(work.map((w) => [w.id, w]));
    const memberNames = new Map(members.map((m) => [m.membershipId, m.displayName]));
    return { clientNames, workById, memberNames };
  }, [clients, work, members]);

  const canManage = hasPermission('work.update') || hasPermission('information.verify');
  const items = (exceptions ?? []).map((e) => {
    const w = e.workId ? lookup.workById.get(e.workId) : undefined;
    return {
      exception: e,
      workTitle: w?.title ?? 'Workspace',
      client: (w?.clientId && lookup.clientNames.get(w.clientId)) || 'No client',
      assignee: e.assigneeMembershipId
        ? e.assigneeMembershipId === membership?.membershipId
          ? 'You'
          : (lookup.memberNames.get(e.assigneeMembershipId) ?? 'A teammate')
        : 'Unassigned'
    };
  });

  const inTab = (status: WorkException['status'], tab: Tab) =>
    tab === 'all' ||
    status === tab ||
    (tab === 'IN_PROGRESS' && status === 'WAITING') ||
    (tab === 'RESOLVED' && status === 'DISMISSED');
  const term = search.toLowerCase();
  const filteredExceptions = items.filter(
    (item) =>
      inTab(item.exception.status, activeTab) &&
      [item.client, item.workTitle, item.exception.description, item.exception.type]
        .join(' ')
        .toLowerCase()
        .includes(term)
  );
  const count = (tab: Tab) => items.filter((i) => inTab(i.exception.status, tab)).length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: exceptionQueries.all(orgId) });
  const onError = (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : 'The exception could not be updated');
  const assign = useMutation({
    ...exceptionMutations.assign(orgId),
    onError,
    onSettled: invalidate
  });
  const transition = useMutation({
    ...exceptionMutations.transition(orgId),
    onError,
    onSettled: invalidate
  });

  const handleAssignToMe = async (e: WorkException) => {
    if (!membership) return;
    await assign.mutateAsync({ exceptionId: e.id, assigneeMembershipId: membership.membershipId });
    if (e.status === 'OPEN' && e.allowedTransitions.includes('IN_PROGRESS')) {
      await transition.mutateAsync({
        exceptionId: e.id,
        to: 'IN_PROGRESS',
        expectedStatus: 'OPEN'
      });
    }
    toast.success('Exception assigned to you.');
  };

  const handleResolve = () => {
    if (!resolving || !resolution.trim()) return;
    transition.mutate(
      {
        exceptionId: resolving.id,
        to: 'RESOLVED',
        expectedStatus: resolving.status,
        resolution: resolution.trim()
      },
      {
        onSuccess: () => {
          toast.success('Exception resolved and recorded in the audit trail.');
          setResolving(null);
          setResolution('');
        }
      }
    );
  };

  const handleSendLink = (workId: string | undefined) => {
    if (workId) router.push(`/dashboard/forms/sheet-form?workId=${workId}`);
  };

  return (
    <PageContainer
      pageTitle='Exception Queue'
      pageDescription='Live exception triage: review what needs a person, take ownership and record the resolution.'
    >
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value='all'>All ({count('all')})</TabsTrigger>
              <TabsTrigger value='OPEN'>Open ({count('OPEN')})</TabsTrigger>
              <TabsTrigger value='IN_PROGRESS'>In Progress ({count('IN_PROGRESS')})</TabsTrigger>
              <TabsTrigger value='RESOLVED'>Resolved ({count('RESOLVED')})</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            placeholder='Search client, work, or issue...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-xs'
          />
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {isPending && enabled ? (
            <Skeleton className='h-40 w-full' />
          ) : filteredExceptions.length === 0 ? (
            <Card className='p-12 text-center text-muted-foreground'>
              <Icons.check className='size-12 mx-auto mb-3 text-emerald-500 opacity-80' />
              <p className='text-base font-semibold'>No exceptions in this view</p>
              <p className='text-sm text-muted-foreground'>
                Nothing here needs a decision right now.
              </p>
            </Card>
          ) : (
            filteredExceptions.map(({ exception: item, workTitle, client, assignee }) => (
              <Card
                key={item.id}
                className='overflow-hidden border-l-4'
                style={{
                  borderLeftColor:
                    item.severity === 'HIGH'
                      ? '#ef4444'
                      : item.severity === 'MEDIUM'
                        ? '#f59e0b'
                        : '#3b82f6'
                }}
              >
                <CardHeader className='pb-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={`font-mono text-xs ${
                          item.severity === 'HIGH'
                            ? 'text-red-600 border-red-500/30 bg-red-500/10'
                            : item.severity === 'MEDIUM'
                              ? 'text-amber-600 border-amber-500/30 bg-amber-500/10'
                              : 'text-blue-600 border-blue-500/30 bg-blue-500/10'
                        }`}
                      >
                        {item.severity} SEVERITY
                      </Badge>
                      <Badge variant='secondary' className='text-xs font-mono'>
                        {EXCEPTION_TYPE_LABELS[item.type]}
                      </Badge>
                      <Badge
                        variant='outline'
                        className={`text-xs ${
                          item.status === 'RESOLVED'
                            ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                            : item.status === 'IN_PROGRESS'
                              ? 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                              : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                        }`}
                      >
                        {EXCEPTION_STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    <span className='text-xs text-muted-foreground tabular-nums'>
                      {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <CardTitle className='text-base font-semibold mt-2'>
                    {client} —{' '}
                    <span className='text-muted-foreground font-normal'>{workTitle}</span>
                  </CardTitle>
                  <CardDescription className='text-sm text-foreground/90 font-sans mt-1'>
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className='pt-0'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg mb-4'>
                    <div>
                      <span className='font-semibold text-foreground'>Raised By:</span>{' '}
                      {sourceLabel(item.source)}
                    </div>
                    <div>
                      <span className='font-semibold text-foreground'>
                        {item.resolution ? 'Resolution:' : 'Work:'}
                      </span>{' '}
                      {item.resolution ?? workTitle}
                    </div>
                    <div>
                      <span className='font-semibold text-foreground'>Assigned Reviewer:</span>{' '}
                      {assignee}
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center justify-end gap-2'>
                    {item.workId && hasPermission('information.collect') && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleSendLink(item.workId)}
                      >
                        <Icons.send className='mr-1.5 h-3.5 w-3.5' /> Ask Client
                      </Button>
                    )}
                    {canManage && item.allowedTransitions.length > 0 && assignee !== 'You' && (
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={assign.isPending || transition.isPending}
                        onClick={() => void handleAssignToMe(item)}
                      >
                        <Icons.user className='mr-1.5 h-3.5 w-3.5' /> Assign to Me
                      </Button>
                    )}
                    {canManage && item.allowedTransitions.includes('RESOLVED') && (
                      <Button
                        size='sm'
                        className='bg-emerald-600 hover:bg-emerald-700 text-white'
                        onClick={() => setResolving(item)}
                      >
                        <Icons.check className='mr-1.5 h-3.5 w-3.5' /> Resolve Exception
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Dialog open={resolving !== null} onOpenChange={(open) => !open && setResolving(null)}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Resolve exception</DialogTitle>
            <DialogDescription>
              Describe what was decided. The note is stored with the exception and in the audit
              trail.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder='e.g. Confirmed with client; corrected payroll journal attached.'
            maxLength={2000}
            rows={4}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setResolving(null)}>
              Cancel
            </Button>
            <Button disabled={!resolution.trim() || transition.isPending} onClick={handleResolve}>
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
