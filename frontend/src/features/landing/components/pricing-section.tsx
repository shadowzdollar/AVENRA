'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Frame, Pill, SectionHeading } from './frame';

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For solo practitioners and boutique accounting practices automating intake.',
    priceMonthly: 49,
    priceAnnual: 39,
    features: [
      'Up to 25 Active Engagements',
      'Real-time OCR document intake',
      'Deterministic rule engine (ADR-024)',
      'Automated client upload checklists',
      '1 Workspace seat included',
      'Standard email exception dispatch',
      '10 GB Encrypted Evidence Vault'
    ],
    ctaLabel: 'Start Starter Trial',
    ctaHref: '/auth/sign-up?plan=starter'
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Most Popular',
    popular: true,
    description: 'For growing practices requiring continuous verification, Kanban triage, and team delegation.',
    priceMonthly: 149,
    priceAnnual: 119,
    features: [
      'Unlimited Active Engagements',
      'Continuous verification & rule validation',
      'SHA-256 Cryptographic Evidence Vault (ADR-020)',
      'Multi-assignee Kanban & triage queue',
      '5 Team seats included (+$25/extra seat)',
      'Secure client portal with magic link uploads',
      'Automated exception resolution workflows',
      'QuickBooks & Xero webhook integration',
      '100 GB Encrypted Evidence Vault'
    ],
    ctaLabel: 'Start 14-Day Free Trial',
    ctaHref: '/auth/sign-up?plan=business'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Custom Architecture',
    description: 'For multi-entity accounting firms requiring custom rule authoring and dedicated storage.',
    priceMonthly: 399,
    priceAnnual: 319,
    features: [
      'Everything in Business, plus:',
      'Unlimited Team Seats & Firm Entities',
      'Custom deterministic rule authoring',
      'Dedicated S3 storage bucket isolation',
      'SOC-2 Type II audit ledger export packs',
      'Direct REST & Webhook API access',
      '99.9% Uptime SLA & dedicated architect',
      '1 TB+ Encrypted Evidence Vault'
    ],
    ctaLabel: 'Contact Enterprise',
    ctaHref: '/auth/sign-up?plan=enterprise'
  }
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <Frame id='pricing'>
      {/* Header & Interval Switch */}
      <div className='flex flex-col items-center px-6 py-16 text-center md:px-10'>
        <Pill>Predictable Pricing</Pill>
        <SectionHeading
          title='Transparent plans designed to scale with your firm'
          description='Continuous verification, deterministic rules, and immutable audit ledgers. Scale your practice volume without scaling manual follow-ups.'
          className='mx-auto mt-4'
        />

        {/* Monthly / Annual Toggle */}
        <div className='mt-8 inline-flex items-center gap-3 rounded-full border bg-muted/40 p-1.5 text-sm'>
          <button
            type='button'
            onClick={() => setIsAnnual(false)}
            className={cn(
              'rounded-full px-4 py-1.5 font-medium transition-all',
              !isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Monthly billing
          </button>
          <button
            type='button'
            onClick={() => setIsAnnual(true)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-all',
              isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Annual billing
            <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className='grid border-t divide-y md:grid-cols-3 md:divide-y-0 md:divide-x'>
        {PRICING_TIERS.map((tier) => {
          const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
          return (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col justify-between p-6 sm:p-8 lg:p-10',
                tier.popular && 'bg-accent/25 dark:bg-accent/15'
              )}
            >
              {tier.badge && (
                <div className='absolute -top-3.5 left-8'>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide uppercase',
                      tier.popular
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border bg-background text-muted-foreground'
                    )}
                  >
                    {tier.popular && <Icons.sparkles className='size-3' />}
                    {tier.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className='text-xl font-semibold tracking-tight'>{tier.name}</h3>
                <p className='text-muted-foreground mt-2 min-h-[44px] text-sm leading-relaxed'>
                  {tier.description}
                </p>

                <div className='mt-6 flex items-baseline gap-1'>
                  <span className='text-4xl font-bold tracking-tight lg:text-5xl'>${price}</span>
                  <span className='text-muted-foreground text-sm font-medium'>
                    /month {isAnnual && <span className='text-xs'>(billed annually)</span>}
                  </span>
                </div>

                <div className='mt-8 space-y-3.5 border-t pt-8'>
                  <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                    What&apos;s included
                  </p>
                  <ul className='space-y-3 text-sm'>
                    {tier.features.map((feature) => (
                      <li key={feature} className='flex items-start gap-3'>
                        <Icons.circleCheck className='size-4 text-emerald-500 shrink-0 mt-0.5' />
                        <span className='text-muted-foreground leading-snug'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className='mt-10 pt-6 border-t'>
                <Link
                  href={tier.ctaHref}
                  className={cn(
                    buttonVariants({
                      variant: tier.popular ? 'default' : 'outline'
                    }),
                    'w-full h-11 gap-2 font-medium transition-all shadow-sm',
                    tier.popular && 'shadow-primary/20'
                  )}
                >
                  {tier.ctaLabel} <Icons.arrowRight className='size-4' />
                </Link>
                <p className='text-muted-foreground mt-2.5 text-center text-xs'>
                  14-day free trial • No card needed
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantees Strip */}
      <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4 bg-muted/20'>
        <div className='flex items-center gap-3 border-b p-4 sm:border-r lg:border-b-0'>
          <Icons.circleCheck className='size-5 text-emerald-500 shrink-0' />
          <span className='text-xs font-medium text-muted-foreground'>
            14-Day Free Trial on All Plans
          </span>
        </div>
        <div className='flex items-center gap-3 border-b p-4 lg:border-r lg:border-b-0'>
          <Icons.creditCard className='size-5 text-primary shrink-0' />
          <span className='text-xs font-medium text-muted-foreground'>
            No Credit Card Required to Start
          </span>
        </div>
        <div className='flex items-center gap-3 border-b p-4 sm:border-r sm:border-b-0'>
          <Icons.lock className='size-5 text-cyan-500 shrink-0' />
          <span className='text-xs font-medium text-muted-foreground'>
            Zero-Knowledge Tenant Isolation
          </span>
        </div>
        <div className='flex items-center gap-3 p-4'>
          <Icons.sparkles className='size-5 text-indigo-500 shrink-0' />
          <span className='text-xs font-medium text-muted-foreground'>
            Deterministic Rules & Instant Setup
          </span>
        </div>
      </div>
    </Frame>
  );
}
