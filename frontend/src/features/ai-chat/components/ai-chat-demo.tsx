'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from '@/components/ui/message-scroller';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import { agentMutations, agentQueries } from '@/features/agent/api/queries';
import { decideAgentRun, stopAgentRun } from '@/features/agent/api/service';
import type { AgentRun, AgentStep } from '@/features/agent/api/types';
import { workQueries } from '@/features/work/api/queries';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

const ACTIVE_RUN = new Set(['PLANNING', 'AWAITING_APPROVAL', 'RUNNING']);
const OPEN_WORK = new Set([
  'DRAFT',
  'READY',
  'RUNNING',
  'WAITING_FOR_INFORMATION',
  'WAITING_FOR_APPROVAL',
  'BLOCKED'
]);

function ToolMarker({
  step,
  selectable,
  selected,
  onToggle
}: {
  step: AgentStep;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const running = step.status === 'RUNNING' || step.status === 'APPROVED';
  const done = step.status === 'SUCCEEDED';
  const errored = step.status === 'FAILED' || step.status === 'REJECTED';
  const output = step.result ?? (step.status === 'PROPOSED' ? step.input : undefined);

  return (
    <div className='flex flex-col gap-1.5'>
      <Marker>
        <MarkerIcon>
          <Icons.code />
        </MarkerIcon>
        {running ? (
          <MarkerContent className='shimmer'>Running {step.tool}…</MarkerContent>
        ) : (
          <MarkerContent>
            {step.status === 'PROPOSED'
              ? 'Proposes'
              : errored
                ? 'Failed'
                : done
                  ? 'Called'
                  : 'Skipped'}{' '}
            <span className='text-foreground font-medium'>{step.tool}</span>
            <span className='text-muted-foreground'> · {step.risk.toLowerCase()} risk</span>
          </MarkerContent>
        )}
      </Marker>
      <Bubble variant='outline'>
        <BubbleContent className='space-y-1.5'>
          <p className='text-sm'>{step.description}</p>
          {step.reason && <p className='text-muted-foreground text-xs italic'>{step.reason}</p>}
          {output != null && (
            <pre className='overflow-x-auto font-mono text-xs'>
              {JSON.stringify(output, null, 2)}
            </pre>
          )}
          {selectable && (
            <label className='flex items-center gap-2 pt-1 text-xs font-medium text-amber-600'>
              <input type='checkbox' checked={selected} onChange={onToggle} />
              High-risk step: approve it explicitly
            </label>
          )}
        </BubbleContent>
      </Bubble>
      {errored && step.error && <p className='text-destructive text-sm'>{step.error}</p>}
    </div>
  );
}

export function AiChatDemo() {
  const { organizationId, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const enabled = organizationId !== null;
  const queryClient = useQueryClient();

  const { data: runs = [] } = useQuery({ ...agentQueries.list(orgId), enabled });
  const { data: work = [] } = useQuery({ ...workQueries.list(orgId), enabled });
  const openWork = work.filter((w) => OPEN_WORK.has(w.status));

  const [workId, setWorkId] = useState('');
  useEffect(() => {
    if (!workId && openWork[0]) setWorkId(openWork[0].id);
  }, [openWork, workId]);

  const run: AgentRun | undefined = useMemo(
    () =>
      runs
        .filter((r) => r.workId === workId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [runs, workId]
  );
  const [approvedHighRisk, setApprovedHighRisk] = useState<string[]>([]);
  useEffect(() => setApprovedHighRisk([]), [run?.id]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: agentQueries.all(orgId) });
  const onError = (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : 'The agent request failed');
  const start = useMutation({ ...agentMutations.start(orgId), onError, onSettled: invalidate });
  const decide = useMutation({
    mutationFn: (decision: 'APPROVE' | 'REJECT') =>
      decideAgentRun(orgId, run!.workId, run!.id, {
        decision,
        highRiskStepIds: decision === 'APPROVE' ? approvedHighRisk : undefined
      }),
    onError,
    onSettled: invalidate
  });
  const stop = useMutation({
    mutationFn: () => stopAgentRun(orgId, run!.workId, run!.id, 'Stopped from Agent Intelligence'),
    onError,
    onSettled: invalidate
  });

  const canExecute = hasPermission('work.execute');
  const canApprove = hasPermission('work.approve');
  const isBusy = run ? ACTIVE_RUN.has(run.status) : false;
  const selectedWork = work.find((w) => w.id === workId);

  return (
    <div className='relative flex flex-1'>
      <div className='bg-card absolute inset-0 mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border'>
        <div className='flex shrink-0 items-center gap-2 border-b px-4 py-3'>
          <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg'>
            <Icons.sparkles className='size-4' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>Avenra Execution Agent</p>
            <select
              aria-label='Work for the agent'
              value={workId}
              onChange={(e) => setWorkId(e.target.value)}
              className='text-muted-foreground w-full max-w-sm truncate bg-transparent text-xs focus:outline-none'
            >
              {openWork.length === 0 && <option value=''>No open work</option>}
              {openWork.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </div>
          <Badge variant='outline' className='ml-auto capitalize'>
            {run ? run.status.replace(/_/g, ' ').toLowerCase() : 'idle'}
          </Badge>
        </div>

        <MessageScrollerProvider defaultScrollPosition='end' scrollPreviousItemPeek={64}>
          <MessageScroller className='min-h-0 flex-1'>
            <MessageScrollerViewport>
              <MessageScrollerContent className='px-4 py-4'>
                {!run ? (
                  <div className='text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm'>
                    <Icons.sparkles className='size-8' />
                    <p>
                      Pick work above and press{' '}
                      <span className='text-foreground font-medium'>Start agent run</span>. The
                      agent proposes a plan; nothing runs until it is approved.
                    </p>
                  </div>
                ) : (
                  <>
                    <MessageScrollerItem messageId={`${run.id}-ask`} scrollAnchor>
                      <Message align='end'>
                        <MessageAvatar className='bg-primary text-primary-foreground size-8 self-start'>
                          <Icons.user className='size-4' />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble variant='default' align='end'>
                            <BubbleContent className='whitespace-pre-wrap'>
                              Plan what is still needed to complete “
                              {run.workTitle ?? selectedWork?.title}”.
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                    <MessageScrollerItem messageId={`${run.id}-answer`}>
                      <Message align='start'>
                        <MessageAvatar
                          className={cn('size-8 self-start', 'bg-primary/10 text-primary')}
                        >
                          <Icons.sparkles className='size-4' />
                        </MessageAvatar>
                        <MessageContent>
                          {run.status === 'PLANNING' && (
                            <Marker>
                              <MarkerContent className='shimmer'>Thinking…</MarkerContent>
                            </Marker>
                          )}
                          {run.summary && (
                            <Marker>
                              <MarkerIcon>
                                <Icons.sparkles />
                              </MarkerIcon>
                              <MarkerContent className='italic'>{run.summary}</MarkerContent>
                            </Marker>
                          )}
                          {[...run.steps]
                            .sort((a, b) => a.position - b.position)
                            .map((step) => (
                              <ToolMarker
                                key={step.id}
                                step={step}
                                selectable={
                                  run.status === 'AWAITING_APPROVAL' &&
                                  step.needsOwnApproval &&
                                  canApprove
                                }
                                selected={approvedHighRisk.includes(step.id)}
                                onToggle={() =>
                                  setApprovedHighRisk((prev) =>
                                    prev.includes(step.id)
                                      ? prev.filter((id) => id !== step.id)
                                      : [...prev, step.id]
                                  )
                                }
                              />
                            ))}
                          {run.stopReason && (
                            <Bubble variant='muted' align='start'>
                              <BubbleContent>{run.stopReason}</BubbleContent>
                            </Bubble>
                          )}
                          <p className='text-muted-foreground text-[11px]'>
                            Budget: {run.budget.modelCalls}/{run.budget.maxModelCalls} model calls ·{' '}
                            {run.budget.toolCalls}/{run.budget.maxToolCalls} tool calls
                          </p>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  </>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className='flex shrink-0 items-center gap-2 border-t px-4 py-3'>
          {run && isBusy && canExecute && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => stop.mutate()}
              disabled={stop.isPending}
            >
              Stop
            </Button>
          )}
          {run?.status === 'AWAITING_APPROVAL' && canApprove ? (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => decide.mutate('REJECT')}
                disabled={decide.isPending}
              >
                Reject plan
              </Button>
              <LoadingButton
                className='ml-auto'
                loading={decide.isPending}
                onClick={() => decide.mutate('APPROVE')}
              >
                <Icons.check className='size-4' /> Approve plan
              </LoadingButton>
            </>
          ) : (
            <LoadingButton
              className='ml-auto'
              loading={start.isPending}
              loadingLabel='Starting agent run'
              disabled={!workId || isBusy || !canExecute}
              onClick={() => start.mutate(workId)}
            >
              <Icons.send className='size-4' /> {isBusy ? 'Agent is working…' : 'Start agent run'}
            </LoadingButton>
          )}
        </div>
      </div>
    </div>
  );
}
