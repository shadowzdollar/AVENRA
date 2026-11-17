'use client';

import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { exceptionQueries } from '@/features/exceptions/api/queries';
import { analyticsQueries } from '@/features/overview/api/queries';
import { changePercent, metric } from '@/features/overview/api/types';
import { requestLinkQueries } from '@/features/requests/api/queries';
import { workQueries } from '@/features/work/api/queries';
import { useOrganizationId } from '@/lib/auth/session-context';
import { useHydrated } from '@/hooks/use-hydrated';

const OPEN_STATUSES = new Set([
  'READY',
  'RUNNING',
  'WAITING_FOR_INFORMATION',
  'WAITING_FOR_APPROVAL',
  'BLOCKED'
]);

function Value({ value }: { value: React.ReactNode }) {
  return value === undefined ? <Skeleton className='h-8 w-16' /> : <>{value}</>;
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? '—' : `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function KpiCards() {
  const hydrated = useHydrated();
  const sessionOrganizationId = useOrganizationId();
  // Until hydration, render as the server did (no data); see useHydrated.
  const organizationId = hydrated ? sessionOrganizationId : null;
  const enabled = organizationId !== null;
  const orgId = organizationId ?? '';

  const analytics = useQuery({ ...analyticsQueries.report(orgId), enabled });
  const work = useQuery({ ...workQueries.list(orgId), enabled });
  const exceptions = useQuery({ ...exceptionQueries.list(orgId, { open: true }), enabled });
  const requests = useQuery({ ...requestLinkQueries.list(orgId, 'ACTIVE'), enabled });

  const report = analytics.data;
  const created = metric(report, 'work.created');
  const createdChange = changePercent(created);
  const passRate = metric(report, 'verification.pass_rate');
  const checks = metric(report, 'verification.checks');
  const answeredRate = metric(report, 'requests.answered_rate');

  const openWork = work.data?.filter((w) => OPEN_STATUSES.has(w.status));
  const clientCount = openWork
    ? new Set(openWork.map((w) => w.clientId).filter(Boolean)).size
    : undefined;
  const dueThisWeek = requests.data?.filter(
    (r) => new Date(r.expiresAt).getTime() - Date.now() < 7 * 24 * 3600 * 1000
  ).length;
  const highSeverity = exceptions.data?.filter((e) => e.severity === 'HIGH').length;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Active Work</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            <Value value={openWork?.length} />
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <Icons.trendingUp className='mr-1 h-3.5 w-3.5 text-emerald-500' />
              {createdChange === undefined
                ? `${created?.value ?? 0} new`
                : `${createdChange >= 0 ? '+' : ''}${createdChange.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Across {clientCount ?? '…'} {clientCount === 1 ? 'client' : 'clients'}
          </div>
          <div className='text-muted-foreground'>
            Created in the last {report?.days ?? 30} days: {created?.value ?? 0}
          </div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Verification Pass Rate</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            <Value value={report ? formatPercent(passRate?.value) : undefined} />
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <Icons.check className='mr-1 h-3.5 w-3.5 text-emerald-500' />
              {checks?.value ?? 0} checks
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Deterministic verification rules
          </div>
          <div className='text-muted-foreground'>Last {report?.days ?? 30} days</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Open Client Requests</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            <Value value={requests.data?.length} />
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <Icons.clock className='mr-1 h-3.5 w-3.5 text-amber-500' />
              {dueThisWeek ?? 0} expire this wk
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>Awaiting client answers</div>
          <div className='text-muted-foreground'>
            Answered: {formatPercent(answeredRate?.value)}
          </div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Exception Queue</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-amber-600 dark:text-amber-400'>
            <Value value={exceptions.data?.length} />
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='border-amber-500/30 text-amber-600'>
              {highSeverity ?? 0} High
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>Open or in progress</div>
          <div className='text-muted-foreground'>Awaiting a decision</div>
        </CardFooter>
      </Card>
    </div>
  );
}
