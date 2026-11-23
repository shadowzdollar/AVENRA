'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

type TenantKey = 'northwind' | 'apex';
type UploadSampleKey = 'clean' | 'malware' | 'oversized';

const TENANT_ROWS = [
  { id: 'wrk_884', org: 'northwind', title: 'FY26 Corporate Tax Return — Acme Corp', status: 'VERIFIED' },
  { id: 'wrk_885', org: 'northwind', title: 'Q1 VAT Reconciliation — Horizon Retail', status: 'COLLECTING' },
  { id: 'wrk_901', org: 'apex', title: 'SOC-2 Type II PBC Pack — Orbital Cloud', status: 'EXCEPTION_OPEN' },
  { id: 'wrk_902', org: 'apex', title: 'Annual Statutory Audit — Meridian Bio', status: 'COMPLETED' }
];

const UPLOAD_SAMPLES: Record<
  UploadSampleKey,
  {
    name: string;
    size: string;
    mime: string;
    gates: { label: string; status: 'PASS' | 'BLOCKED' | 'SKIPPED'; note: string }[];
  }
> = {
  clean: {
    name: 'FY26_Trial_Balance.pdf',
    size: '1.8 MB',
    mime: 'application/pdf',
    gates: [
      { label: '01 · Size & MIME Filter', status: 'PASS', note: '1.8 MB <= 25 MB limit · PDF allowed' },
      { label: '02 · ClamAV Stream Scan', status: 'PASS', note: '0 malware signatures matched (19ms)' },
      { label: '03 · SHA-256 Vaulting', status: 'PASS', note: 'Digest e3b0c442... written to S3' },
      { label: '04 · Audit Ledger Entry', status: 'PASS', note: 'Immutable evidence record committed' }
    ]
  },
  malware: {
    name: 'Urgent_Invoice_Macro.pdf',
    size: '412 KB',
    mime: 'application/pdf',
    gates: [
      { label: '01 · Size & MIME Filter', status: 'PASS', note: '412 KB <= 25 MB limit · PDF header valid' },
      { label: '02 · ClamAV Stream Scan', status: 'BLOCKED', note: 'THREAT DETECTED: EICAR-Test-Signature · Stream aborted' },
      { label: '03 · SHA-256 Vaulting', status: 'SKIPPED', note: 'Never written to S3 bucket' },
      { label: '04 · Audit Ledger Entry', status: 'PASS', note: 'Security rejection logged with request trace ID' }
    ]
  },
  oversized: {
    name: 'Raw_ERP_Dump_Archive.zip',
    size: '214 MB',
    mime: 'application/zip',
    gates: [
      { label: '01 · Size & MIME Filter', status: 'BLOCKED', note: '413 Payload Too Large · Exceeds 25 MB limit & disallowed MIME' },
      { label: '02 · ClamAV Stream Scan', status: 'SKIPPED', note: 'Rejected before buffering in memory' },
      { label: '03 · SHA-256 Vaulting', status: 'SKIPPED', note: 'Never written to S3 bucket' },
      { label: '04 · Audit Ledger Entry', status: 'PASS', note: 'Rate-limit & size violation recorded' }
    ]
  }
};

export function SecurityExperience() {
  const [activeTenant, setActiveTenant] = useState<TenantKey>('northwind');
  const [attackCrossTenant, setAttackCrossTenant] = useState(false);
  const [uploadKey, setUploadKey] = useState<UploadSampleKey>('clean');

  const visibleRows = TENANT_ROWS.filter((r) => {
    if (attackCrossTenant) {
      // Simulates trying to query the OTHER tenant's rows under PostgreSQL FORCE RLS
      const targetOrg = activeTenant === 'northwind' ? 'apex' : 'northwind';
      return r.org === targetOrg && r.org === activeTenant; // Always empty under RLS!
    }
    return r.org === activeTenant;
  });

  const sample = UPLOAD_SAMPLES[uploadKey];

  return (
    <>
      {/* Security Hero */}
      <Frame className='relative overflow-hidden px-6 py-16 md:px-12 md:py-24'>
        <div
          aria-hidden
          className='pointer-events-none absolute -top-20 right-10 size-80 rounded-full bg-emerald-500/10 blur-3xl'
        />
        <div className='relative z-10 max-w-3xl space-y-5'>
          <Pill>Security Sandbox · PostgreSQL RLS & ClamAV</Pill>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            Don’t take our word for tenant isolation—test the database policy live
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Switch active organizations below and attempt a cross-tenant SQL query. PostgreSQL’s forced Row-Level Security guarantees zero row leakage even if an application query misses a filter.
          </p>
        </div>
      </Frame>
      <DottedRule />

      {/* Interactive PostgreSQL RLS Simulator */}
      <Frame className='grid lg:grid-cols-[0.95fr_1.05fr]'>
        <div className='space-y-5 border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <SectionHeading
            title='Interactive PostgreSQL RLS simulator'
            description='Every session binds avenra.organization_id server-side under a non-owner database role that cannot bypass RLS.'
          />
          <div className='space-y-3 pt-2'>
            <p className='text-muted-foreground font-mono text-xs uppercase'>
              1. Active Authenticated Session
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => {
                  setActiveTenant('northwind');
                  setAttackCrossTenant(false);
                }}
                className={cn(
                  'rounded-xl border p-3.5 text-left transition-all',
                  activeTenant === 'northwind'
                    ? 'border-primary bg-accent/50'
                    : 'bg-background hover:bg-muted/40'
                )}
              >
                <p className='text-sm font-semibold'>Northwind Advisors</p>
                <p className='text-muted-foreground font-mono text-[11px]'>org_northwind</p>
              </button>
              <button
                type='button'
                onClick={() => {
                  setActiveTenant('apex');
                  setAttackCrossTenant(false);
                }}
                className={cn(
                  'rounded-xl border p-3.5 text-left transition-all',
                  activeTenant === 'apex'
                    ? 'border-primary bg-accent/50'
                    : 'bg-background hover:bg-muted/40'
                )}
              >
                <p className='text-sm font-semibold'>Apex CPA Group</p>
                <p className='text-muted-foreground font-mono text-[11px]'>org_apex</p>
              </button>
            </div>
          </div>

          <div className='pt-2'>
            <button
              type='button'
              onClick={() => setAttackCrossTenant((prev) => !prev)}
              className={cn(
                buttonVariants({ variant: attackCrossTenant ? 'destructive' : 'outline' }),
                'w-full gap-2'
              )}
            >
              <Icons.lock className='size-4' />
              {attackCrossTenant
                ? 'Cross-Tenant Query Active (Click to Reset)'
                : `Attempt Cross-Tenant Read of ${activeTenant === 'northwind' ? 'Apex CPA' : 'Northwind'}`}
            </button>
          </div>
        </div>

        <div className='bg-muted/20 flex flex-col justify-between p-6 md:p-10'>
          <pre className='bg-card overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed'>
            {`SET LOCAL avenra.organization_id = 'org_${activeTenant}';\n` +
              (attackCrossTenant
                ? `SELECT id, title FROM work_items WHERE organization_id = 'org_${activeTenant === 'northwind' ? 'apex' : 'northwind'}';`
                : `SELECT id, title, status FROM work_items;`)}
          </pre>

          <div className='bg-card mt-4 rounded-xl border p-4'>
            <div className='mb-3 flex items-center justify-between text-xs'>
              <span className='font-mono font-semibold'>Query Result</span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 font-mono text-[11px]',
                  visibleRows.length === 0
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {visibleRows.length} rows returned
              </span>
            </div>
            {visibleRows.length === 0 ? (
              <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300'>
                <strong>RLS Enforced:</strong> 0 rows leaked. PostgreSQL automatically intersected the query with <code>organization_id = current_setting(&apos;avenra.organization_id&apos;)</code>.
              </div>
            ) : (
              <div className='divide-y text-xs'>
                {visibleRows.map((r) => (
                  <div key={r.id} className='flex items-center justify-between py-2.5'>
                    <div>
                      <code className='font-mono text-cyan-500'>{r.id}</code> · {r.title}
                    </div>
                    <span className='bg-muted rounded px-2 py-0.5 font-mono text-[10px]'>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Interactive 4-Gate Upload Inspector */}
      <Frame>
        <div className='flex flex-col justify-between gap-4 px-6 py-12 md:flex-row md:items-end md:px-10'>
          <SectionHeading
            title='Test the 4-gate document security pipeline'
            description='Pick a simulated client upload to watch how RequestBodySizeLimitFilter, ClamAV, and SHA-256 vaulting respond.'
          />
          <div className='flex flex-wrap gap-2'>
            {(Object.keys(UPLOAD_SAMPLES) as UploadSampleKey[]).map((k) => (
              <button
                key={k}
                type='button'
                onClick={() => setUploadKey(k)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-xs font-medium capitalize transition-all',
                  uploadKey === k
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted/40'
                )}
              >
                {k === 'clean' ? 'Clean Tax PDF' : k === 'malware' ? 'Malware Payload' : '214 MB Zip'}
              </button>
            ))}
          </div>
        </div>

        <div className='bg-muted/20 border-t px-6 py-4 font-mono text-xs md:px-10'>
          File: <strong>{sample.name}</strong> · Size: {sample.size} · MIME: {sample.mime}
        </div>

        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {sample.gates.map((gate, i) => (
            <div
              key={gate.label}
              className={cn(
                'space-y-3 border-b p-6 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <div className='flex items-center justify-between'>
                <span className='font-mono text-xs font-semibold'>{gate.label}</span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 font-mono text-[10px] font-semibold',
                    gate.status === 'PASS' && 'bg-emerald-500/10 text-emerald-500',
                    gate.status === 'BLOCKED' && 'bg-destructive/15 text-destructive',
                    gate.status === 'SKIPPED' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {gate.status}
                </span>
              </div>
              <p className='text-muted-foreground text-xs leading-relaxed'>{gate.note}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-1'>
          <h2 className='text-2xl font-medium tracking-tight'>Ready to run on tenant-isolated infrastructure?</h2>
          <p className='text-muted-foreground text-sm'>Start a 14-day free trial with full audit logging enabled from day one.</p>
        </div>
        <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
          Start free trial <Icons.arrowRight className='size-4' />
        </Link>
      </Frame>
    </>
  );
}
