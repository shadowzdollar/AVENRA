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

const chartData = [
  { month: 'January', audit: 18, tax: 28 },
  { month: 'February', audit: 24, tax: 35 },
  { month: 'March', audit: 30, tax: 45 },
  { month: 'April', audit: 22, tax: 62 },
  { month: 'May', audit: 26, tax: 38 },
  { month: 'June', audit: 32, tax: 40 }
];

const chartConfig = {
  audit: {
    label: 'Audit & Attestation',
    color: 'var(--chart-1)'
  },
  tax: {
    label: 'Corporate Tax & Compliance',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Completed Engagements by Practice</span>
          <Badge variant='outline'>
            <Icons.trendingUp className='mr-1 h-3.5 w-3.5' />
            +22.6%
          </Badge>
        </CardTitle>
        <CardDescription>Monthly engagement completions across major service categories</CardDescription>
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' />}
            />
            <Bar
              dataKey='audit'
              color='var(--chart-1)'
              fill='var(--color-audit)'
              shape={<CustomHatchedBar isHatched={false} />}
              radius={4}
            />
            <Bar
              dataKey='tax'
              fill='var(--color-tax)'
              shape={<CustomHatchedBar />}
              radius={4}
            />
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
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke='none'
        fill={fill}
      />
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
