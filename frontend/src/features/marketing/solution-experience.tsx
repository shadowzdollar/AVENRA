'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import type { SolutionData } from '@/features/landing/solutions-content';
import { cn } from '@/lib/utils';

type ItemState = 'verified' | 'exception' | 'missing';

export function SolutionExperience({
  solution,
  otherSolutions
}: {
  solution: SolutionData;
  otherSolutions: SolutionData[];
}) {
  const [statuses, setStatuses] = useState<ItemState[]>(() =>
    solution.deliverables.slice(0, 4).map((_, i) => (i < 2 ? 'verified' : i === 2 ? 'exception' : 'missing'))
  );

  const cycleStatus = (idx: number) => {
    setStatuses((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        return s === 'missing' ? 'verified' : s === 'verified' ? 'exception' : 'missing';
      })
    );
  };

  const verifiedCount = statuses.filter((s) => s === 'verified').length;
  const exceptionCount = statuses.filter((s) => s === 'exception').length;
  const readiness = Math.round((verifiedCount / statuses.length) * 100);

  return (
    <>
      {/* Asymmetric Interactive Practice Hero */}
      <Frame className='grid lg:grid-cols-[1.05fr_0.95fr]'>
        <div className='flex flex-col justify-center space-y-6 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0'>
          <div className='flex items-center gap-3'>
            <Link
              href='/'
              className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs'
            >
              <Icons.chevronLeft className='size-3.5' /> Home
            </Link>
            <Pill>{solution.pill}</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            {solution.headline}
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>{solution.description}</p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
              Start free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/pricing' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
              Calculate firm ROI
            </Link>
          </div>
        </div>

        {/* Interactive Readiness Board */}
        <div className='bg-muted/20 flex flex-col justify-between p-6 md:p-10'>
          <div className='bg-card rounded-2xl border p-5 shadow-sm'>
            <div className='flex items-center justify-between border-b pb-4'>
              <div>
                <p className='text-muted-foreground font-mono text-[10px] uppercase'>
                  Interactive {solution.shortTitle} Checklist
                </p>
                <h2 className='text-base font-semibold'>Live Readiness Score</h2>
              </div>
              <div className='text-right'>
                <span className='text-2xl font-bold tabular-nums'>{readiness}%</span>
                <p className='text-muted-foreground text-[11px]'>
                  {exceptionCount > 0 ? `${exceptionCount} exception open` : 'Ready for sign-off'}
                </p>
              </div>
            </div>

            <div className='bg-muted mt-4 h-2 w-full overflow-hidden rounded-full'>
              <div
                className='bg-emerald-500 h-full transition-all duration-300'
                style={{ width: `${readiness}%` }}
              />
            </div>

            <p className='text-muted-foreground mt-4 text-xs'>
              Click any deliverable below to cycle its live verification status:
            </p>

            <div className='mt-3 space-y-2.5'>
              {solution.deliverables.slice(0, 4).map((deliv, i) => {
                const st = statuses[i];
                return (
                  <button
                    key={deliv}
                    type='button'
                    onClick={() => cycleStatus(i)}
                    className='hover:bg-muted/40 flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm transition-colors'
                  >
                    <span className='font-medium'>{deliv}</span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
                        st === 'verified' && 'bg-emerald-500/10 text-emerald-500',
                        st === 'exception' && 'bg-amber-500/10 text-amber-500',
                        st === 'missing' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {st}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Practice Metrics */}
      <Frame className='grid md:grid-cols-3'>
        {solution.metrics.map((metric, i) => (
          <div
            key={metric.label}
            className={cn(
              'space-y-3 border-b px-6 py-10 md:border-b-0 md:px-10',
              i < 2 && 'md:border-r'
            )}
          >
            <p className='text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase'>
              {metric.label}
            </p>
            <p className='text-4xl font-medium tracking-tight md:text-5xl'>{metric.value}</p>
            <p className='text-muted-foreground text-sm leading-relaxed'>{metric.detail}</p>
          </div>
        ))}
      </Frame>
      <DottedRule />

      {/* 4-Step Workflow & Rules */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title={`Deterministic ${solution.shortTitle.toLowerCase()} execution`}
            description='Every requirement carries automated checks so reviewers focus exclusively on real exceptions.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {solution.workflow.map((item, i) => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.step}
                className={cn(
                  'space-y-3 border-b p-6 md:p-8 lg:border-b-0',
                  i < 3 && 'lg:border-r',
                  i % 2 === 0 && 'sm:border-r'
                )}
              >
                <div className='flex items-center justify-between'>
                  <span className='flex size-9 items-center justify-center rounded-md border'>
                    <Icon className='size-4' />
                  </span>
                  <span className='text-muted-foreground font-mono text-xs'>{item.step}</span>
                </div>
                <h3 className='text-base font-medium'>{item.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
              </div>
            );
          })}
        </div>
      </Frame>
      <DottedRule />

      {/* Other Solutions */}
      <Frame className='grid md:grid-cols-3'>
        {otherSolutions.map((other, i) => {
          const Icon = Icons[other.icon];
          return (
            <Link
              key={other.slug}
              href={`/solutions/${other.slug}`}
              className={cn(
                'group hover:bg-muted/30 flex flex-col justify-between space-y-4 border-b p-6 transition-colors md:border-b-0 md:p-8',
                i < 2 && 'md:border-r'
              )}
            >
              <div className='space-y-2'>
                <span className='flex size-8 items-center justify-center rounded-md border'>
                  <Icon className='size-4' />
                </span>
                <h3 className='text-base font-medium group-hover:underline'>{other.title}</h3>
                <p className='text-muted-foreground line-clamp-2 text-xs'>{other.headline}</p>
              </div>
              <span className='text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 text-xs font-medium'>
                Explore solution <Icons.arrowRight className='size-3.5' />
              </span>
            </Link>
          );
        })}
      </Frame>
    </>
  );
}
