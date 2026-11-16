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

const chartData = [
  { status: 'auto_verified', count: 320, fill: 'var(--chart-1)' },
  { status: 'partner_approved', count: 85, fill: 'var(--chart-2)' },
  { status: 'awaiting_client', count: 48, fill: 'var(--chart-3)' },
  { status: 'open_exceptions', count: 18, fill: 'var(--chart-4)' }
];

const chartConfig = {
  count: {
    label: 'Requirements'
  },
  auto_verified: {
    label: 'Auto-Verified',
    color: 'var(--chart-1)'
  },
  partner_approved: {
    label: 'Partner Approved',
    color: 'var(--chart-2)'
  },
  awaiting_client: {
    label: 'Awaiting Client',
    color: 'var(--chart-3)'
  },
  open_exceptions: {
    label: 'Exceptions Flagged',
    color: 'var(--chart-4)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle className='flex items-center gap-2'>
          <span>Requirement Status</span>
          <Badge variant='outline'>
            <Icons.check className='mr-1 h-3.5 w-3.5 text-emerald-500' />
            86% Resolved
          </Badge>
        </CardTitle>
        <CardDescription>All requirements across active engagements</CardDescription>
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
