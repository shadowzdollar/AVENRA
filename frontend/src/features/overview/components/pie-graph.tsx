'use client';

import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { workQueries } from '@/features/work/api/queries';
import { useOrganizationId } from '@/lib/auth/session-context';
import { useHydrated } from '@/hooks/use-hydrated';

const chartConfig = {
  count: {
    label: 'Requirements'
  },
  accepted: {
    label: 'Accepted',
    color: 'var(--chart-1)'
  },
  awaiting_review: {
    label: 'Awaiting Review',
    color: 'var(--chart-2)'
  },
  missing: {
    label: 'Missing',
    color: 'var(--chart-3)'
  },
  rejected: {
    label: 'Rejected',
    color: 'var(--chart-4)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  const hydrated = useHydrated();
  const sessionOrganizationId = useOrganizationId();
  // Until hydration, render as the server did (no data); see useHydrated.
  const organizationId = hydrated ? sessionOrganizationId : null;
  const { data: work = [] } = useQuery({
    ...workQueries.list(organizationId ?? ''),
    enabled: organizationId !== null
  });
  const active = work.filter((w) => w.status !== 'CANCELLED');
  const totals = active.reduce(
    (acc, w) => ({
      accepted: acc.accepted + w.completeness.accepted,
      awaiting_review: acc.awaiting_review + w.completeness.awaitingReview,
      missing: acc.missing + w.completeness.missing,
      rejected: acc.rejected + w.completeness.rejected
    }),
    { accepted: 0, awaiting_review: 0, missing: 0, rejected: 0 }
  );
  const chartData = (Object.keys(totals) as Array<keyof typeof totals>)
    .map((status, i) => ({ status, count: totals[status], fill: `var(--chart-${i + 1})` }))
    .filter((d) => d.count > 0);
  const required = active.reduce((n, w) => n + w.completeness.required, 0);
  const acceptedPct = required === 0 ? 0 : Math.round((totals.accepted / required) * 100);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle className='flex items-center gap-2'>
          <span>Requirement Status</span>
          <Badge variant='outline'>
            <Icons.check className='mr-1 h-3.5 w-3.5 text-emerald-500' />
            {acceptedPct}% Accepted
          </Badge>
        </CardTitle>
        <CardDescription>All requirements across work in this workspace</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey='status' hideLabel />} />
            <Pie
              data={chartData}
              innerRadius={35}
              dataKey='count'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='count'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value) => String(value ?? '')}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
