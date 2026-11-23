import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { TrustSection } from '@/features/landing/components/closing-sections';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Security & Trust | Avenra',
  description:
    'Learn how Avenra protects client engagements with PostgreSQL Row-Level Security, ClamAV malware scanning, application-level encryption, and immutable SHA-256 audit ledgers.'
};

const CONTROLS = [
  {
    adr: 'ADR-005',
    icon: 'lock' as const,
    title: 'PostgreSQL Row-Level Security (RLS)',
    description:
      'Every tenant-owned table enforces strict organization_id policies at the database layer. Tenant context is resolved server-side from your authenticated session—never trusted from client input.'
  },
  {
    adr: 'ADR-017',
    icon: 'fingerprint' as const,
    title: 'Application-Level Encryption',
    description:
      'Sensitive tokens, webhook secrets, and integration credentials are encrypted at the application layer with rotatable key IDs before touching persistent storage.'
  },
  {
    adr: 'ADR-021',
    icon: 'warning' as const,
    title: 'ClamAV Malware Inspection',
    description:
      'Every client upload is streamed through an isolated ClamAV daemon before entering the Evidence Vault, stopping infected files before any staff member downloads them.'
  },
  {
    adr: 'ADR-020',
    icon: 'history' as const,
    title: 'Immutable SHA-256 Evidence Vault',
    description:
      'Accepted documents and verification decisions are cryptographically hashed and stored in S3-compatible object storage with complete actor and timestamp provenance.'
  },
  {
    adr: 'ADR-016',
    icon: 'bellRinging' as const,
    title: 'Redis Rate Limiting & Abuse Protection',
    description:
      'Public client portal links and authentication endpoints are protected by sliding-window rate limits, CSRF protection, and revocable single-purpose tokens.'
  },
  {
    adr: '§143',
    icon: 'users' as const,
    title: 'Explicit Permission Authorization',
    description:
      'Every endpoint and state transition checks explicit permissions (such as work.approve or billing.manage) rather than coarse admin booleans.'
  }
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        pill='Security & Compliance Architecture'
        title='Engineered for firms that cannot afford guesswork'
        description='Security in Avenra is not a marketing badge—it is enforced by database row-level security, cryptographic hashing, malware scanning, and automated isolation tests on every build.'
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read technical docs', href: '/docs' }}
      />
      <DottedRule />
      <TrustSection />
      <DottedRule />

      {/* Architecture Controls Grid */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Defense in depth, verified by architecture decision records'
            description='Every security boundary in Avenra is documented, codified in automated ArchUnit and integration tests, and audited continuously.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-3'>
          {CONTROLS.map((control, i) => {
            const Icon = Icons[control.icon];
            return (
              <div
                key={control.title}
                className={cn(
                  'space-y-3 border-b p-6 md:p-10',
                  i % 3 !== 2 && 'lg:border-r',
                  i >= 3 && 'lg:border-b-0'
                )}
              >
                <div className='flex items-center justify-between'>
                  <span className='flex size-10 items-center justify-center rounded-md border'>
                    <Icon className='size-5' />
                  </span>
                  <span className='bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-xs'>
                    {control.adr}
                  </span>
                </div>
                <h3 className='text-lg font-medium'>{control.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {control.description}
                </p>
              </div>
            );
          })}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>Have a security questionnaire?</h2>
          <p className='text-muted-foreground text-sm'>
            Review common compliance answers in our FAQ or start an enterprise evaluation workspace.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/faq' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            View FAQ
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
