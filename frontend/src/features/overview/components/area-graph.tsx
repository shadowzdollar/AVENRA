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

const chartData = [
  { month: 'January', ingested: 342, verified: 335 },
  { month: 'February', ingested: 876, verified: 860 },
  { month: 'March', ingested: 512, verified: 504 },
  { month: 'April', ingested: 629, verified: 618 },
  { month: 'May', ingested: 458, verified: 450 },
  { month: 'June', ingested: 781, verified: 770 },
  { month: 'July', ingested: 394, verified: 388 },
  { month: 'August', ingested: 925, verified: 910 },
  { month: 'September', ingested: 647, verified: 638 },
  { month: 'October', ingested: 532, verified: 524 },
  { month: 'November', ingested: 803, verified: 790 },
  { month: 'December', ingested: 420, verified: 412 }
];

const chartConfig = {
  ingested: {
    label: 'Intake Documents',
    color: 'var(--chart-1)'
  },
  verified: {
    label: 'Auto-Verified',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Intake & Verification Velocity</span>
          <Badge variant='outline'>
            <Icons.trendingUp className='mr-1 h-3.5 w-3.5' />
            +18.4% YoY
          </Badge>
        </CardTitle>
        <CardDescription>Documents received via secure intake links vs verified with rules</CardDescription>
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='verified'
              type='natural'
              fill='url(#dotted-background-pattern-verified)'
              fillOpacity={0.4}
              stroke='var(--color-verified)'
              stackId='a'
              strokeWidth={1.2}
            />
            <Area
              dataKey='ingested'
              type='natural'
              fill='url(#dotted-background-pattern-ingested)'
              fillOpacity={0.4}
              stroke='var(--color-ingested)'
              stackId='a'
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
