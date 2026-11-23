'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

type EventName = 'work.completed' | 'information.answer_received' | 'exception.raised' | 'request.expired';
type CodeLang = 'typescript' | 'python' | 'curl';

const EVENTS: Record<EventName, { desc: string; payload: string }> = {
  'work.completed': {
    desc: 'Fires when a partner approves all verified requirements and closes the engagement.',
    payload: `{
  "event": "work.completed",
  "idempotencyKey": "evt_01J9X8K4M2P7",
  "workId": "wrk_fy26_884",
  "organizationId": "org_northwind",
  "manifestSha256": "e3b0c44298fc1c149afbf4c8996fb924"
}`
  },
  'information.answer_received': {
    desc: 'Fires immediately when a client submits a field or uploads a scanned document.',
    payload: `{
  "event": "information.answer_received",
  "idempotencyKey": "evt_01J9X9A1Q8L2",
  "requirementId": "req_bank_q1",
  "clamavStatus": "CLEAN",
  "submittedAt": "2026-11-23T16:12:04Z"
}`
  },
  'exception.raised': {
    desc: 'Fires when a deterministic verification rule flags a discrepancy for human review.',
    payload: `{
  "event": "exception.raised",
  "idempotencyKey": "evt_01J9X9F7B4W0",
  "rule": "PERIOD_COVERAGE_12M",
  "severity": "HIGH",
  "assignedQueue": "tax-reviewers"
}`
  },
  'request.expired': {
    desc: 'Fires when an uncompleted client portal link crosses its expiry deadline.',
    payload: `{
  "event": "request.expired",
  "idempotencyKey": "evt_01J9XA02C9N5",
  "clientEmail": "cfo@acme.example",
  "missingItemsCount": 2
}`
  }
};

const CODE_SNIPPETS: Record<CodeLang, string> = {
  typescript: `import crypto from 'node:crypto';

export function verifySignature(rawBody: string, headerSig: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(headerSig, 'hex'), Buffer.from(expected, 'hex'));
}`,
  python: `import hmac, hashlib

def verify_signature(raw_body: bytes, header_sig: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(header_sig, expected)`,
  curl: `curl -X POST https://api.yourfirm.com/webhooks/avenra \\
  -H "Content-Type: application/json" \\
  -H "X-Avenra-Signature: 7f9c2ba4e881a03..." \\
  -H "Idempotency-Key: evt_01J9X8K4M2P7" \\
  -d '{"event":"work.completed","workId":"wrk_fy26_884"}'`
};

export function IntegrationsExperience() {
  const [selectedEvent, setSelectedEvent] = useState<EventName>('work.completed');
  const [simulateFail, setSimulateFail] = useState(false);
  const [deliveries, setDeliveries] = useState<
    { id: number; event: string; status: string; ms: number; note: string }[]
  >([
    {
      id: 1,
      event: 'work.completed',
      status: '200 OK',
      ms: 38,
      note: 'HMAC-SHA256 verified · outbox committed'
    }
  ]);
  const [lang, setLang] = useState<CodeLang>('typescript');

  const fireTestWebhook = () => {
    const nextId = deliveries.length + 1;
    if (simulateFail) {
      setDeliveries((prev) => [
        {
          id: nextId,
          event: selectedEvent,
          status: '503 RETRYING',
          ms: 214,
          note: 'Scheduled exponential retry #2 in +10s (same Idempotency-Key)'
        },
        ...prev.slice(0, 4)
      ]);
    } else {
      setDeliveries((prev) => [
        {
          id: nextId,
          event: selectedEvent,
          status: '200 OK',
          ms: Math.floor(28 + Math.random() * 40),
          note: 'HMAC-SHA256 verified · delivered cleanly'
        },
        ...prev.slice(0, 4)
      ]);
    }
  };

  return (
    <>
      {/* Developer Console Hero */}
      <Frame className='grid lg:grid-cols-[0.95fr_1.05fr]'>
        <div className='flex flex-col justify-center space-y-6 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0'>
          <div>
            <Pill>Developer Console · Live Webhook Simulator</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            Fire signed events straight into your ERP, CRM, or S3 archive
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Test Avenra’s transactional outbox right here. Pick a lifecycle event, toggle endpoint health, and inspect idempotent HMAC delivery logs in real time.
          </p>
          <div className='flex flex-wrap gap-3'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
              Get API credentials <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/docs' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
              Open API quickstart
            </Link>
          </div>
        </div>

        {/* Interactive Webhook Tester */}
        <div className='bg-muted/20 flex flex-col justify-between p-6 md:p-10'>
          <div className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              {(Object.keys(EVENTS) as EventName[]).map((evt) => (
                <button
                  key={evt}
                  type='button'
                  onClick={() => setSelectedEvent(evt)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
                    selectedEvent === evt
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  {evt}
                </button>
              ))}
            </div>

            <p className='text-muted-foreground text-xs'>{EVENTS[selectedEvent].desc}</p>

            <pre className='bg-card overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed'>
              {EVENTS[selectedEvent].payload}
            </pre>

            <div className='flex flex-wrap items-center justify-between gap-3'>
              <label className='flex cursor-pointer items-center gap-2 text-xs'>
                <input
                  type='checkbox'
                  checked={simulateFail}
                  onChange={(e) => setSimulateFail(e.target.checked)}
                  className='accent-primary size-3.5 rounded'
                />
                <span>Simulate 503 endpoint failure (test retry queue)</span>
              </label>
              <button
                type='button'
                onClick={fireTestWebhook}
                className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
              >
                <Icons.send className='size-3.5' /> Fire Test Event
              </button>
            </div>
          </div>

          <div className='bg-background mt-5 rounded-xl border p-4'>
            <p className='text-muted-foreground mb-2 font-mono text-[10px] uppercase tracking-wider'>
              Live Delivery Log
            </p>
            <div className='space-y-2 font-mono text-[11px]'>
              {deliveries.map((d) => (
                <div key={d.id} className='flex flex-wrap items-center justify-between gap-2 border-b pb-1.5 last:border-b-0 last:pb-0'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                        d.status.startsWith('200')
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {d.status}
                    </span>
                    <span>{d.event}</span>
                  </div>
                  <span className='text-muted-foreground'>{d.ms}ms · {d.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Copyable Verification Snippets */}
      <Frame className='grid lg:grid-cols-2'>
        <div className='space-y-4 border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <SectionHeading
            title='Verify signatures in 5 lines of code'
            description='Switch languages and copy production-ready HMAC-SHA256 verification directly into your webhook receiver.'
          />
          <div className='flex items-center justify-between pt-2'>
            <div className='flex gap-2'>
              {(['typescript', 'python', 'curl'] as CodeLang[]).map((l) => (
                <button
                  key={l}
                  type='button'
                  onClick={() => setLang(l)}
                  className={cn(
                    'rounded-md border px-3 py-1 font-mono text-xs capitalize',
                    lang === l ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              type='button'
              onClick={() => {
                void navigator.clipboard?.writeText(CODE_SNIPPETS[lang]);
                toast.success('Snippet copied to clipboard');
              }}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 text-xs')}
            >
              Copy snippet
            </button>
          </div>
          <pre className='bg-muted/40 overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed'>
            {CODE_SNIPPETS[lang]}
          </pre>
        </div>

        <div className='space-y-4 p-6 md:p-10'>
          <SectionHeading
            title='Automated S3 completion manifests'
            description='Archive every closed engagement as an immutable, self-verifying package in AWS S3 or SeaweedFS.'
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
    </>
  );
}
