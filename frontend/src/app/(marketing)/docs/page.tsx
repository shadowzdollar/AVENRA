import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { REPOSITORY_URL } from '@/features/landing/content';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Documentation & API Reference | Avenra',
  description:
    'Quickstart guide, OpenAPI 3.1 endpoint examples, and Architecture Decision Records (ADRs) for running and integrating Avenra.'
};

const QUICKSTART_STEPS = [
  {
    step: '01',
    title: 'Verify API Health & Contract Version',
    command: `curl -s https://your-avenra-host/api/v1/meta`,
    output: `{"service":"avenra-api","apiVersion":"v1"}`
  },
  {
    step: '02',
    title: 'Create a Client Engagement (Work Item)',
    command: `curl -X POST https://your-avenra-host/api/v1/organizations/{orgId}/work \\
  -H "Content-Type: application/json" \\
  -d '{"clientId":"cli_01J9","title":"FY2026 Corporate Tax Pack","dueAt":"2026-04-15T23:59:59Z"}'`,
    output: `{"id":"wrk_01J9X8","status":"DRAFT","requirementsCount":0}`
  },
  {
    step: '03',
    title: 'Dispatch Expiring Client Portal Request',
    command: `curl -X POST https://your-avenra-host/api/v1/organizations/{orgId}/work/wrk_01J9X8/requests \\
  -H "Content-Type: application/json" \\
  -d '{"recipientEmail":"cfo@acme.example","expiresInDays":14}'`,
    output: `{"requestId":"req_01J9Y2","status":"SENT","expiresAt":"2026-04-01T18:00:00Z"}`
  }
];

const ADRS = [
  { id: 'ADR-001', title: 'Modular Monolith Core', scope: 'Spring Modulith domain boundaries & system of record.' },
  { id: 'ADR-005', title: 'Multi-Tenant RLS Isolation', scope: 'PostgreSQL row-level security & server-side tenant resolution.' },
  { id: 'ADR-008', title: 'Contract-First OpenAPI 3.1', scope: 'Single YAML source generating Java server stubs & TS clients.' },
  { id: 'ADR-016', title: 'Redis Rate Limiting', scope: 'Sliding-window abuse protection for auth & client links.' },
  { id: 'ADR-017', title: 'Application-Level Encryption', scope: 'Rotatable key IDs protecting secrets & integration tokens.' },
  { id: 'ADR-020', title: 'Cryptographic Evidence Vault', scope: 'SHA-256 hashing & immutable S3 storage for client proof.' },
  { id: 'ADR-021', title: 'ClamAV Malware Scanning', scope: 'Streamed antivirus inspection prior to vault ingestion.' },
  { id: 'ADR-024', title: 'Deterministic Verification', scope: 'Rule evaluators & structured exception resolution queue.' },
  { id: 'ADR-029', title: 'AI Service Boundary', scope: 'Isolated Python worker with strict schema & budget controls.' }
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        pill='Resources · Technical Documentation'
        title='Build, integrate, and audit on Avenra’s OpenAPI 3.1 contract'
        description='Every endpoint, webhook payload, and security guarantee is defined contract-first. Use this quickstart and ADR reference to onboard your team or wire external integrations.'
        primaryAction={{ label: 'Open workspace', href: '/auth/sign-in' }}
        secondaryAction={{ label: 'Explore webhooks', href: '/integrations' }}
      />
      <DottedRule />

      {/* 3-Step API Quickstart */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='API quickstart: from engagement creation to client intake'
            description='All API routes are versioned under /api/v1 and strictly validated against packages/contracts/openapi/avenra.v1.yaml.'
          />
        </div>
        <div className='divide-y border-t'>
          {QUICKSTART_STEPS.map((item) => (
            <div key={item.step} className='grid gap-6 p-6 lg:grid-cols-[1fr_1.4fr] md:p-10'>
              <div className='space-y-2'>
                <span className='bg-primary/10 text-primary inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold'>
                  STEP {item.step}
                </span>
                <h3 className='text-lg font-medium'>{item.title}</h3>
                <p className='text-muted-foreground text-sm'>
                  Authenticated requests use session cookies with CSRF double-submit tokens (`X-XSRF-TOKEN`).
                </p>
              </div>
              <div className='space-y-3'>
                <pre className='bg-muted/40 overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed'>
                  {item.command}
                </pre>
                <pre className='bg-card text-emerald-600 dark:text-emerald-400 overflow-x-auto rounded-lg border p-3 font-mono text-xs'>
                  {`// 200 OK\n${item.output}`}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      {/* ADR Reference Grid */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Architecture Decision Records (ADRs)'
            description='Key engineering decisions that govern how Avenra handles data isolation, verification, encryption, and AI execution.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-3'>
          {ADRS.map((adr, i) => (
            <div
              key={adr.id}
              className={cn(
                'space-y-2 border-b p-6 md:p-8',
                i % 3 !== 2 && 'lg:border-r',
                i >= 6 && 'lg:border-b-0'
              )}
            >
              <code className='bg-muted rounded px-2 py-0.5 font-mono text-xs font-semibold'>
                {adr.id}
              </code>
              <h3 className='text-base font-medium'>{adr.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{adr.scope}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>Inspect the OpenAPI spec & source</h2>
          <p className='text-muted-foreground text-sm'>
            All contracts, Flyway migrations, and ArchUnit rules live openly in the Avenra repository.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <a
            href={REPOSITORY_URL}
            target='_blank'
            rel='noreferrer'
            className={cn(buttonVariants({ variant: 'outline' }), 'h-10 gap-2 px-5')}
          >
            <Icons.github className='size-4' /> Open repository
          </a>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
