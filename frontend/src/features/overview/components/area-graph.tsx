'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsQueries } from '@/features/overview/api/queries';
import { metric, series } from '@/features/overview/api/types';
import { workQueries } from '@/features/work/api/queries';
import { useOrganizationId } from '@/lib/auth/session-context';
import { useHydrated } from '@/hooks/use-hydrated';

const chartConfig = {
  ingested: {
    label: 'Work Created',
    color: 'var(--chart-1)'
  },
  verified: {
    label: 'Work Completed',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

const WEEK_MS = 7 * 24 * 3600 * 1000;

export function AreaGraph() {
  const hydrated = useHydrated();
  const sessionOrganizationId = useOrganizationId();
  // Until hydration, render as the server did (no data); see useHydrated.
  const organizationId = hydrated ? sessionOrganizationId : null;
  const enabled = organizationId !== null;
  const { data: report } = useQuery({
    ...analyticsQueries.report(organizationId ?? '', 90),
    enabled
  });
  const { data: work = [] } = useQuery({ ...workQueries.list(organizationId ?? ''), enabled });

  const completed = series(report, 'work.completed_weekly')?.points ?? [];
  const chartData = completed.map((point) => {
    const start = new Date(`${point.start}T00:00:00Z`).getTime();
    const ingested = work.filter((w) => {
      const t = new Date(w.createdAt).getTime();
      return t >= start && t < start + WEEK_MS;
    }).length;
    return { month: point.start, ingested, verified: point.value };
  });
  const created = metric(report, 'work.created');
  const finished = metric(report, 'work.completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Work Throughput</span>
          <Badge variant='outline'>
            <Icons.trendingUp className='mr-1 h-3.5 w-3.5' />
            {finished?.value ?? 0} / {created?.value ?? 0} done
          </Badge>
        </CardTitle>
        <CardDescription>Work created vs completed per week, last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) =>
                new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='verified'
              type='monotone'
              fill='url(#dotted-background-pattern-verified)'
              fillOpacity={0.4}
              stroke='var(--color-verified)'
              strokeWidth={1.2}
            />
            <Area
              dataKey='ingested'
              type='monotone'
              fill='url(#dotted-background-pattern-ingested)'
              fillOpacity={0.4}
              stroke='var(--color-ingested)'
              strokeWidth={1.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x='0'
          y='0'
          width='7'
          height='7'
          patternUnits='userSpaceOnUse'
        >
          <circle cx='1.5' cy='1.5' r='1' fill={value} />
        </pattern>
      ))}
    </>
  );
};
