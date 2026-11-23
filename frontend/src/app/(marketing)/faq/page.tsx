import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { FaqSection } from '@/features/landing/components/faq-section';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'FAQ | Avenra',
  description:
    'Answers to frequently asked questions about Avenra client portals, deterministic verification rules, AI agent governance, data isolation, and pricing.'
};

const QUICK_LINKS = [
  {
    title: 'Platform Overview',
    description: 'See how client requests, verification, and evidence vaults fit together.',
    href: '/platform',
    icon: 'dashboard' as const
  },
  {
    title: 'Security & Isolation',
    description: 'Deep dive into PostgreSQL RLS, ClamAV scanning, and SHA-256 hashing.',
    href: '/security',
    icon: 'lock' as const
  },
  {
    title: 'Pricing & Plans',
    description: 'Compare Starter, Business, and Enterprise tiers with 14-day free trials.',
    href: '/pricing',
    icon: 'creditCard' as const
  }
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        pill='Resources · FAQ'
        title='Frequently asked questions'
        description='Everything you need to know about running client engagements, verification rules, governed AI agents, and tenant isolation on Avenra.'
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read documentation', href: '/docs' }}
      />
      <DottedRule />
      <FaqSection />
      <DottedRule />
      <Frame className='grid md:grid-cols-3'>
        {QUICK_LINKS.map((item, i) => {
          const Icon = Icons[item.icon];
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                'group hover:bg-muted/30 flex flex-col justify-between space-y-4 border-b p-6 transition-colors md:border-b-0 md:p-8',
                i < 2 && 'md:border-r'
              )}
            >
              <div className='space-y-3'>
                <span className='flex size-9 items-center justify-center rounded-md border'>
                  <Icon className='size-4' />
                </span>
                <h3 className='text-base font-medium group-hover:underline'>{item.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
              </div>
              <span className='text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 text-xs font-medium'>
                Explore <Icons.arrowRight className='size-3.5' />
              </span>
            </Link>
          );
        })}
      </Frame>
    </>
  );
}
