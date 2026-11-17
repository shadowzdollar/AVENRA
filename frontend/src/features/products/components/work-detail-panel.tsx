'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { workMutations, workQueries } from '@/features/work/api/queries';
import { reviewRequirement } from '@/features/work/api/service';
import { WORK_STATUS_LABELS, type WorkStatus } from '@/features/work/api/types';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

const REQUIREMENT_STATE_CLASS: Record<string, string> = {
  ACCEPTED: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
  SUBMITTED: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  REJECTED: 'text-red-500 border-red-500/30 bg-red-500/10'
};

function label(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

export function WorkDetailPanel({ workId }: { workId: string }) {
  const { organizationId, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const enabled = organizationId !== null;
  const queryClient = useQueryClient();

  const { data: work } = useQuery({ ...workQueries.detail(orgId, workId), enabled });
  const { data: history = [] } = useQuery({ ...workQueries.transitions(orgId, workId), enabled });

  const transition = useMutation({
    ...workMutations.transition(orgId),
    onSuccess: (_, input) => toast.success(`Moved to ${WORK_STATUS_LABELS[input.to]}`),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Transition failed'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: workQueries.all(orgId) })
  });

  const review = useMutation({
    mutationFn: (input: {
      requirementId: string;
      itemId: string;
      decision: 'ACCEPT' | 'REJECT';
    }) => {
      const reason =
        input.decision === 'REJECT'
          ? window.prompt('Why is this answer rejected? The client will see this.')?.trim()
          : undefined;
      if (input.decision === 'REJECT' && !reason) throw new Error('A reason is needed to reject.');
      return reviewRequirement(orgId, workId, input.requirementId, {
        itemId: input.itemId,
        decision: input.decision,
        reason
      });
    },
    onSuccess: (_, input) =>
      toast.success(input.decision === 'ACCEPT' ? 'Answer accepted' : 'Answer rejected'),
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.code === 'OVERRIDE_REQUIRED'
          ? 'Checks did not pass for this answer; review it in detail before accepting.'
          : error instanceof Error
            ? error.message
            : 'Review failed'
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['org', orgId] })
  });
  const canReview = hasPermission('information.verify');

  if (!work) {
    return <Skeleton className='mx-auto h-48 w-full max-w-3xl' />;
  }

  const { completeness } = work;
  const pct =
    completeness.required === 0
      ? 0
      : Math.round((completeness.accepted / completeness.required) * 100);
  const canTransition = hasPermission('work.update') || hasPermission('work.execute');

  return (
    <Card className='mx-auto w-full max-w-3xl'>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center justify-between gap-2'>
          <span>{work.title}</span>
          <Badge variant='outline' className='font-mono text-xs'>
            {WORK_STATUS_LABELS[work.status]}
          </Badge>
        </CardTitle>
        <CardDescription>
          {completeness.accepted} of {completeness.required} requirements accepted ·{' '}
          {completeness.missing} missing · {completeness.awaitingReview} awaiting review
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Progress value={pct} />

        {canTransition && work.allowedTransitions.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {work.allowedTransitions.map((to: WorkStatus) => (
              <Button
                key={to}
                size='sm'
                variant={to === 'CANCELLED' || to === 'FAILED' ? 'outline' : 'secondary'}
                disabled={transition.isPending}
                onClick={() => transition.mutate({ workId, to, expectedStatus: work.status })}
              >
                Move to {WORK_STATUS_LABELS[to]}
              </Button>
            ))}
          </div>
        )}

        {work.requirements.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>Requirements</h3>
            <ul className='divide-y rounded-md border'>
              {work.requirements.map((r) => (
                <li
                  key={r.id}
                  className='flex items-center justify-between gap-2 px-3 py-2 text-sm'
                >
                  <span className='truncate'>
                    {r.title}
                    {!r.required && <span className='text-muted-foreground'> (optional)</span>}
                    {r.currentItem?.value && (
                      <span className='text-muted-foreground block truncate text-xs'>
                        Answer: {r.currentItem.value}
                      </span>
                    )}
                  </span>
                  <span className='flex shrink-0 items-center gap-2'>
                    {canReview && r.state === 'SUBMITTED' && r.currentItem && (
                      <>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-7 px-2 text-xs'
                          disabled={review.isPending}
                          onClick={() =>
                            review.mutate({
                              requirementId: r.id,
                              itemId: r.currentItem!.id,
                              decision: 'REJECT'
                            })
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          size='sm'
                          variant='secondary'
                          className='h-7 px-2 text-xs'
                          disabled={review.isPending}
                          onClick={() =>
                            review.mutate({
                              requirementId: r.id,
                              itemId: r.currentItem!.id,
                              decision: 'ACCEPT'
                            })
                          }
                        >
                          Accept
                        </Button>
                      </>
                    )}
                    <Badge
                      variant='outline'
                      className={`text-[11px] ${REQUIREMENT_STATE_CLASS[r.state] ?? ''}`}
                    >
                      {label(r.state)}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {history.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>History</h3>
            <ol className='text-muted-foreground space-y-1 text-xs'>
              {[...history]
                .reverse()
                .slice(0, 8)
                .map((t) => (
                  <li key={t.id}>
                    {t.from ? `${WORK_STATUS_LABELS[t.from]} → ` : ''}
                    <span className='text-foreground'>{WORK_STATUS_LABELS[t.to]}</span>
                    {t.reason ? ` · ${t.reason}` : ''} ·{' '}
                    {formatDistanceToNowStrict(new Date(t.at), { addSuffix: true })}
                  </li>
                ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
