import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Integrations & Webhooks | Avenra',
  description:
    'Technical deep dive into Avenra signed webhooks, exponential retry queues, HMAC-SHA256 verification, S3 completion manifests, and OpenAPI 3.1 contracts.'
};

const WEBHOOK_CATALOG = [
  {
    event: 'work.completed',
    trigger: 'Engagement transitions to COMPLETED after final approval.',
    useCase: 'Trigger invoice generation in QuickBooks/Xero or archive workpapers to SharePoint/S3.'
  },
  {
    event: 'information.answer_received',
    trigger: 'Client submits a structured answer or uploads a scanned document.',
    useCase: 'Update internal CRM status or post real-time intake alerts in Slack/Teams.'
  },
  {
    event: 'exception.raised',
    trigger: 'A deterministic verification rule fails on an incoming submission.',
    useCase: 'Route high-priority compliance exceptions to your firm’s incident or triage channel.'
  },
  {
    event: 'request.expired',
    trigger: 'A client portal link passes its expiry date with incomplete items.',
    useCase: 'Escalate stalled client requests to the engagement manager automatically.'
  }
];

const RETRY_SCHEDULE = [
  { attempt: 'Attempt 1', delay: 'Immediate', behavior: 'Dispatched via transactional outbox upon DB commit.' },
  { attempt: 'Attempt 2', delay: '+10 seconds', behavior: 'Handles brief network blips or cold serverless starts.' },
  { attempt: 'Attempt 3', delay: '+1 minute', behavior: 'Retried with identical Idempotency-Key header.' },
  { attempt: 'Attempt 4', delay: '+10 minutes', behavior: 'Captures HTTP status & response snippet in delivery log.' },
  { attempt: 'Dead Letter', delay: 'Manual replay', behavior: 'Surface failed endpoint in Admin UI for 1-click replay.' }
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHero
        pill='Integrations · Webhooks & S3 Exports'
        title='Reliable, idempotent pipelines into your practice stack'
        description='Avenra connects cleanly to ERP, billing, CRM, and archival systems through HMAC-signed webhooks, transactional outbox retries, S3 completion manifests, and an OpenAPI 3.1 contract.'
        primaryAction={{ label: 'Start building free', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'View API docs', href: '/docs' }}
      />
      <DottedRule />

      {/* Event Catalog Table */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Lifecycle webhook event catalog'
            description='Subscribe only to the domain events your downstream systems care about. Every payload includes an idempotency key and organization context.'
          />
        </div>
        <div className='overflow-x-auto border-t'>
          <table className='w-full min-w-[680px] border-collapse text-left'>
            <thead>
              <tr className='bg-muted/30 border-b text-xs uppercase tracking-wider'>
                <th className='px-6 py-4 font-semibold md:px-10'>Event Name</th>
                <th className='px-6 py-4 font-semibold'>Trigger Condition</th>
                <th className='px-6 py-4 font-semibold'>Common Automation</th>
              </tr>
            </thead>
            <tbody className='divide-y text-sm'>
              {WEBHOOK_CATALOG.map((row) => (
                <tr key={row.event} className='hover:bg-muted/20 transition-colors'>
                  <td className='px-6 py-4 md:px-10'>
                    <code className='bg-primary/10 text-primary rounded px-2 py-1 font-mono text-xs font-semibold'>
                      {row.event}
                    </code>
                  </td>
                  <td className='px-6 py-4'>{row.trigger}</td>
                  <td className='text-muted-foreground px-6 py-4'>{row.useCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Frame>
      <DottedRule />

      {/* HMAC Verification & S3 Manifest Split */}
      <Frame className='grid lg:grid-cols-2'>
        <div className='space-y-5 border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <SectionHeading
            title='Verify HMAC-SHA256 webhook signatures'
            description='Every outbound request carries an X-Avenra-Signature header computed with your rotatable per-endpoint signing secret and timestamp.'
          />
          <pre className='bg-muted/40 overflow-x-auto rounded-xl border p-5 font-mono text-xs leading-relaxed'>
            {`import crypto from 'node:crypto';

export function verifyAvenraWebhook(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader, 'hex'),
    Buffer.from(expected, 'hex')
  );
}`}
          </pre>
        </div>

        <div className='space-y-5 p-6 md:p-10'>
          <SectionHeading
            title='S3 completion manifest exports'
            description='When an engagement closes, Avenra exports a self-contained JSON manifest plus SHA-256 hashed evidence pointers to AWS S3 or SeaweedFS.'
          />
          <pre className='bg-muted/40 overflow-x-auto rounded-xl border p-5 font-mono text-xs leading-relaxed'>
            {`s3://firm-workpapers-prod/
└── org_northwind_advisors/
    └── 2026/
        └── wrk_fy26_tax_return_884/
            ├── manifest.json          # Signed summary & rule outcomes
            ├── audit-trail.jsonl      # Every state transition & actor
            └── evidence/
                ├── bank_jan_sha256.pdf
                └── trial_balance_sha256.xlsx`}
          </pre>
        </div>
      </Frame>
      <DottedRule />

      {/* Transactional Outbox & Retry Guarantees */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Idempotent delivery & classified retries'
            description='External side effects are persisted in a transactional outbox so no event is lost during downtime, and every delivery attempt is visible in your dashboard.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-5'>
          {RETRY_SCHEDULE.map((item, i) => (
            <div
              key={item.attempt}
              className={cn(
                'space-y-2 border-b p-6 lg:border-b-0',
                i < 4 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <p className='font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400'>
                {item.attempt}
              </p>
              <p className='text-lg font-medium'>{item.delay}</p>
              <p className='text-muted-foreground text-xs leading-relaxed'>{item.behavior}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>
            Need custom ERP or webhook onboarding?
          </h2>
          <p className='text-muted-foreground text-sm'>
            Business and Enterprise plans include full webhook delivery logs and S3 export support.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/docs' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            Read API quickstart
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
