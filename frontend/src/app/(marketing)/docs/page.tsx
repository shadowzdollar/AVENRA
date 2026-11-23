import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { REPOSITORY_URL } from '@/features/landing/content';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Documentation | Avenra',
  description:
    'Get started with Avenra: architecture overview, OpenAPI 3.1 contract-first design, webhook verification, and workspace onboarding guides.'
};

const GUIDES = [
  {
    category: 'Getting Started',
    icon: 'sparkles' as const,
    items: [
      {
        title: 'Create your firm workspace',
        description:
          'Sign up, configure your organization profile, and invite team members with explicit permissions.'
      },
      {
        title: 'Launch your first client engagement',
        description:
          'Define work requirements, attach deterministic rules, and send a passwordless client portal link.'
      },
      {
        title: 'Resolve exceptions & approve work',
        description:
          'Review flagged submissions in the Exception Queue and sign off verified evidence into the vault.'
      }
    ]
  },
  {
    category: 'API & Architecture',
    icon: 'code' as const,
    items: [
      {
        title: 'OpenAPI 3.1 Contract-First (ADR-008)',
        description:
          'Every API endpoint and payload is generated from packages/contracts/openapi/avenra.v1.yaml.'
      },
      {
        title: 'Webhook signature verification',
        description:
          'Validate HMAC headers on work.completed, information.answer_received, and request.expired events.'
      },
      {
        title: 'S3 Completion Manifest Exports',
        description:
          'Connect AWS S3 or SeaweedFS buckets to automatically archive SHA-256 verified engagement packs.'
      }
    ]
  }
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        pill='Resources · Documentation'
        title='Everything you need to run and integrate Avenra'
        description='From onboarding your first practice engagement to verifying signed webhooks and auditing row-level tenant isolation.'
        primaryAction={{ label: 'Open workspace', href: '/auth/sign-in' }}
        secondaryAction={{ label: 'Explore integrations', href: '/integrations' }}
      />
      <DottedRule />

      <Frame className='grid lg:grid-cols-2'>
        {GUIDES.map((group, idx) => {
          const Icon = Icons[group.icon];
          return (
            <div
              key={group.category}
              className={cn(
                'space-y-6 border-b p-6 md:p-10 lg:border-b-0',
                idx === 0 && 'lg:border-r'
              )}
            >
              <div className='flex items-center gap-3'>
                <span className='flex size-9 items-center justify-center rounded-md border'>
                  <Icon className='size-4' />
                </span>
                <h2 className='text-xl font-medium tracking-tight'>{group.category}</h2>
              </div>
              <div className='space-y-4'>
                {group.items.map((item) => (
                  <div key={item.title} className='rounded-lg border p-5'>
                    <h3 className='text-base font-medium'>{item.title}</h3>
                    <p className='text-muted-foreground mt-1.5 text-sm leading-relaxed'>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Frame>
      <DottedRule />

      <Frame className='px-6 py-14 md:px-10'>
        <div className='flex flex-col justify-between gap-6 md:flex-row md:items-center'>
          <SectionHeading
            title='Inspect the full source & ADRs'
            description='Avenra’s engineering guidelines, OpenAPI contracts, and architecture decision records live directly in the repository.'
          />
          <div className='flex flex-wrap gap-3'>
            <a
              href={REPOSITORY_URL}
              target='_blank'
              rel='noreferrer'
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 gap-2 px-5')}
            >
              <Icons.github className='size-4' /> View on GitHub
            </a>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
              Start free trial <Icons.arrowRight className='size-4' />
            </Link>
          </div>
        </div>
      </Frame>
    </>
  );
}
