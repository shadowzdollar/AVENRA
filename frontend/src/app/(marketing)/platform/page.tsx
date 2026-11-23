import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { UnifiedSystem } from '@/features/landing/components/unified-system';
import { WorkspaceGallery } from '@/features/landing/components/workspace-gallery';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Platform | Avenra',
  description:
    'Explore how Avenra unifies client requests, deterministic rule verification, exception queues, and immutable evidence vaults in one work execution platform.'
};

const PILLARS = [
  {
    icon: 'send' as const,
    title: 'Passwordless Client Requests',
    description:
      'Dispatch expiring, single-purpose links so clients answer structured questions and upload documents without creating another login.'
  },
  {
    icon: 'listCheck' as const,
    title: 'Deterministic Verification Engine',
    description:
      'Every submission is checked immediately against your firm rules—file formats, date coverage, required fields, and materiality thresholds.'
  },
  {
    icon: 'warning' as const,
    title: 'Structured Exception Queue',
    description:
      'Failed checks never disappear into email threads. They surface in a dedicated triage queue where reviewers reject or override with a recorded reason.'
  },
  {
    icon: 'fingerprint' as const,
    title: 'Cryptographic Evidence Vault',
    description:
      'Uploaded files are malware-scanned via ClamAV, fingerprinted with SHA-256, and stored in tenant-isolated S3 storage.'
  },
  {
    icon: 'history' as const,
    title: 'State-Machine Audit Trail',
    description:
      'Work statuses only advance through validated state transitions. Every actor, timestamp, and decision is permanently logged.'
  },
  {
    icon: 'bellRinging' as const,
    title: 'Automated Follow-Up Cadence',
    description:
      'Scheduled reminders nudge clients on missing items before deadlines without pulling your engagement team out of billable work.'
  }
];

export default function PlatformPage() {
  return (
    <>
      <PageHero
        pill='Avenra Platform'
        title='One execution engine from client intake to verified sign-off'
        description='Avenra replaces scattered emails, spreadsheets, and ad-hoc checklists with a deterministic system of record built specifically for professional services firms.'
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'See pricing', href: '/pricing' }}
      />
      <DottedRule />
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Six core primitives working as one'
            description='Every engagement runs on the same audited backbone—so whether you run 10 clients or 1,000, nothing slips through.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-3'>
          {PILLARS.map((item, i) => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.title}
                className={cn(
                  'space-y-3 border-b p-6 md:p-10',
                  i % 3 !== 2 && 'lg:border-r',
                  i % 2 === 0 && 'sm:border-r lg:border-r-0',
                  i % 3 !== 2 && 'lg:border-r',
                  i >= 3 && 'lg:border-b-0'
                )}
              >
                <span className='flex size-10 items-center justify-center rounded-md border'>
                  <Icon className='size-5' />
                </span>
                <h3 className='text-lg font-medium'>{item.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
              </div>
            );
          })}
        </div>
      </Frame>
      <DottedRule />
      <UnifiedSystem />
      <DottedRule />
      <WorkspaceGallery />
      <DottedRule />
      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>Want to see the AI Agent in action?</h2>
          <p className='text-muted-foreground text-sm'>
            Learn how Avenra drafts governed execution plans with explicit approval gates and budgets.
          </p>
        </div>
        <Link href='/agent' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 gap-2 px-5')}>
          Explore Agent Intelligence <Icons.arrowRight className='size-4' />
        </Link>
      </Frame>
      <DottedRule />
      <PricingSection />
    </>
  );
}
