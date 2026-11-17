'use client';

import { Bar, BarChart, XAxis } from 'recharts';

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
import { analyticsQueries } from '@/features/overview/api/queries';
import { metric } from '@/features/overview/api/types';
import { useOrganizationId } from '@/lib/auth/session-context';
import { useHydrated } from '@/hooks/use-hydrated';

const chartConfig = {
  audit: {
    label: 'Created',
    color: 'var(--chart-1)'
  },
  tax: {
    label: 'Completed',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const hydrated = useHydrated();
  const sessionOrganizationId = useOrganizationId();
  // Until hydration, render as the server did (no data); see useHydrated.
  const organizationId = hydrated ? sessionOrganizationId : null;
  const { data: report } = useQuery({
    ...analyticsQueries.report(organizationId ?? ''),
    enabled: organizationId !== null
  });
  const chartData = (report?.workTypes ?? []).map((t) => ({
    month: t.type,
    audit: t.created,
    tax: t.completed
  }));
  const rate = metric(report, 'work.completion_rate')?.value;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Work by Type</span>
          <Badge variant='outline'>
            <Icons.trendingUp className='mr-1 h-3.5 w-3.5' />
            {rate == null ? '—' : `${Math.round(rate)}%`} completion
          </Badge>
        </CardTitle>
        <CardDescription>
          Created vs completed in the last {report?.days ?? 30} days, by work type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <rect
              x='0'
              y='0'
              width='100%'
              height='85%'
              fill='url(#default-multiple-pattern-dots)'
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) =>
                value.length > 14 ? `${value.slice(0, 13)}…` : value
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
            <Bar
              dataKey='audit'
              color='var(--chart-1)'
              fill='var(--color-audit)'
              shape={<CustomHatchedBar isHatched={false} />}
              radius={4}
            />
            <Bar dataKey='tax' fill='var(--color-tax)' shape={<CustomHatchedBar />} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const CustomHatchedBar = (
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string;
    isHatched?: boolean;
  }
) => {
  const { fill, x, y, width, height } = props;
  const isHatched = props.isHatched ?? true;

  return (
    <>
      <rect rx={4} x={x} y={y} width={width} height={height} stroke='none' fill={fill} />
      {isHatched && (
        <rect
          rx={4}
          x={x}
          y={y}
          width={width}
          height={height}
          stroke='none'
          fill='url(#default-multiple-pattern-dots)'
        />
      )}
    </>
  );
};

const DottedBackgroundPattern = () => {
  return (
    <pattern
      id='default-multiple-pattern-dots'
      x='0'
      y='0'
      width='8'
      height='8'
      patternUnits='userSpaceOnUse'
    >
      <circle cx='2' cy='2' r='1' fill='var(--foreground)' opacity='0.15' />
    </pattern>
  );
};
