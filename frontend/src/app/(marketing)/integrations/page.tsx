import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { IntegrationsSection } from '@/features/landing/components/closing-sections';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Integrations & Webhooks | Avenra',
  description:
    'Connect Avenra to your practice stack with signed webhooks, S3 completion manifest exports, OpenAPI 3.1 contracts, and idempotent delivery logs.'
};

const WEBHOOK_EVENTS = [
  {
    event: 'work.completed',
    description:
      'Fired when all requirements pass verification and an engagement reaches a verified completed state. Ideal for triggering billing or ERP archival.'
  },
  {
    event: 'information.answer_received',
    description:
      'Fired the moment a client submits an answer or uploads a scanned document through their secure portal link.'
  },
  {
    event: 'request.expired',
    description:
      'Fired when a client portal link passes its configured expiry window without completion, enabling automated CRM or Slack escalation.'
  }
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHero
        pill='Integrations · OpenAPI 3.1 & Webhooks'
        title='Plug Avenra directly into your firm’s existing stack'
        description='Emit HMAC-signed webhooks on every lifecycle milestone, export verified completion manifests to S3-compatible storage, and build against a contract-first OpenAPI 3.1 surface.'
        primaryAction={{ label: 'Get started free', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read documentation', href: '/docs' }}
      />
      <DottedRule />
      <IntegrationsSection />
      <DottedRule />

      {/* Webhook Events & S3 Manifest Showcase */}
      <Frame className='grid lg:grid-cols-2'>
        <div className='border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <SectionHeading
            title='Signed, idempotent webhooks'
            description='Every delivery is cryptographically signed, retried with exponential backoff, and logged with full response status history.'
          />
          <div className='mt-8 space-y-4'>
            {WEBHOOK_EVENTS.map((item) => (
              <div key={item.event} className='rounded-lg border p-4'>
                <div className='flex items-center gap-2'>
                  <Icons.webhook className='size-4 text-cyan-500' />
                  <code className='font-mono text-sm font-semibold'>{item.event}</code>
                </div>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col justify-between p-6 md:p-10'>
          <div>
            <SectionHeading
              title='Completion manifest exports'
              description='Automatically push structured JSON manifests and SHA-256 hashed evidence packages to AWS S3, SeaweedFS, or any S3-compatible archive.'
            />
            <pre className='bg-muted/40 mt-8 overflow-x-auto rounded-xl border p-5 font-mono text-xs leading-relaxed'>
              {`{
  "event": "work.completed",
  "idempotencyKey": "evt_01J9X8K4M2P7Q9",
  "organizationId": "org_northwind_advisors",
  "workId": "wrk_2026_fy_close_884",
  "verification": {
    "status": "PASSED",
    "rulesEvaluated": 14,
    "exceptionsResolved": 1
  },
  "manifest": {
    "bucket": "avenra-vault-prod",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
  }
}`}
            </pre>
          </div>

          <div className='mt-8 flex flex-wrap items-center gap-3 border-t pt-6'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
              Configure your first webhook <Icons.arrowRight className='size-4' />
            </Link>
            <Link
              href='/security'
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}
            >
              Inspect security controls
            </Link>
          </div>
        </div>
      </Frame>
    </>
  );
}
