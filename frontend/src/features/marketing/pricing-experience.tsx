'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { cn } from '@/lib/utils';

export function PricingExperience() {
  const [seats, setSeats] = useState(6);
  const [engagements, setEngagements] = useState(60);
  const [hoursChasing, setHoursChasing] = useState(3);

  const recommendedPlan =
    seats > 15 || engagements > 180
      ? { name: 'Enterprise', monthly: 319 }
      : seats > 1 || engagements > 25
        ? { name: 'Business', monthly: 119 + Math.max(0, seats - 5) * 25 }
        : { name: 'Starter', monthly: 39 };

  const hoursReclaimed = Math.round(engagements * hoursChasing * 0.72);
  const billableRecovered = hoursReclaimed * 145;

  return (
    <>
      {/* Interactive ROI & Plan Estimator Hero */}
      <Frame className='grid lg:grid-cols-[1fr_1fr]'>
        <div className='flex flex-col justify-center space-y-5 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0'>
          <div>
            <Pill>Pricing & Practice ROI Calculator</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            Calculate what Avenra returns to your firm every month
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Drag the sliders to match your practice volume. Zero per-client charges, predictable team seats, and a 7-day payment grace period where your data always stays readable.
          </p>
        </div>

        {/* Live Sliders + Instant Output */}
        <div className='bg-muted/20 p-6 md:p-10'>
          <div className='space-y-5'>
            <div>
              <div className='mb-2 flex justify-between text-sm'>
                <span className='font-medium'>Team seats</span>
                <span className='font-mono font-semibold'>{seats} seats</span>
              </div>
              <input
                type='range'
                min={1}
                max={25}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className='accent-primary w-full cursor-pointer'
              />
            </div>

            <div>
              <div className='mb-2 flex justify-between text-sm'>
                <span className='font-medium'>Active client engagements / month</span>
                <span className='font-mono font-semibold'>{engagements} engagements</span>
              </div>
              <input
                type='range'
                min={10}
                max={250}
                step={5}
                value={engagements}
                onChange={(e) => setEngagements(Number(e.target.value))}
                className='accent-primary w-full cursor-pointer'
              />
            </div>

            <div>
              <div className='mb-2 flex justify-between text-sm'>
                <span className='font-medium'>Avg. hours chasing missing docs / engagement</span>
                <span className='font-mono font-semibold'>{hoursChasing} hrs</span>
              </div>
              <input
                type='range'
                min={1}
                max={8}
                value={hoursChasing}
                onChange={(e) => setHoursChasing(Number(e.target.value))}
                className='accent-primary w-full cursor-pointer'
              />
            </div>
          </div>

          <div className='bg-card mt-6 grid grid-cols-3 gap-3 rounded-xl border p-4 text-center'>
            <div>
              <p className='text-muted-foreground font-mono text-[10px] uppercase'>Recommended</p>
              <p className='mt-1 text-lg font-semibold'>{recommendedPlan.name}</p>
              <p className='text-muted-foreground text-xs'>${recommendedPlan.monthly}/mo</p>
            </div>
            <div className='border-x px-2'>
              <p className='text-muted-foreground font-mono text-[10px] uppercase'>Time Saved</p>
              <p className='mt-1 text-lg font-semibold text-emerald-500'>{hoursReclaimed} hrs</p>
              <p className='text-muted-foreground text-xs'>per month</p>
            </div>
            <div>
              <p className='text-muted-foreground font-mono text-[10px] uppercase'>Est. Value</p>
              <p className='mt-1 text-lg font-semibold text-cyan-500'>
                ${billableRecovered.toLocaleString()}
              </p>
              <p className='text-muted-foreground text-xs'>at $145/hr</p>
            </div>
          </div>

          <div className='mt-4 flex justify-end'>
            <Link
              href={`/auth/sign-up?plan=${recommendedPlan.name.toLowerCase()}`}
              className={cn(buttonVariants(), 'w-full gap-2 sm:w-auto')}
            >
              Start {recommendedPlan.name} 14-day free trial <Icons.arrowRight className='size-4' />
            </Link>
          </div>
        </div>
      </Frame>
      <DottedRule />

      <PricingSection />
      <DottedRule />

      {/* Commercial Guarantees */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Commercial terms designed for professional firms'
            description='No lock-in tricks, no client portal seat fees, and transparent billing controls.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {[
            {
              title: 'Free client seats',
              desc: 'Invite unlimited external client contacts to upload documents via passwordless portal links.'
            },
            {
              title: '7-day grace window',
              desc: 'If a payment fails, work never vanishes—your vault and audit history stay 100% readable.'
            },
            {
              title: 'Hard AI token caps',
              desc: 'Daily organization token ceilings prevent unexpected bills during peak tax or audit season.'
            },
            {
              title: 'Enterprise procurement',
              desc: 'Annual Enterprise plans support ACH/wire invoicing, custom DPAs, and dedicated S3 buckets.'
            }
          ].map((item, i) => (
            <div
              key={item.title}
              className={cn(
                'space-y-2 border-b p-6 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <h3 className='text-base font-medium'>{item.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{item.desc}</p>
            </div>
          ))}
        </div>
      </Frame>
    </>
  );
}
