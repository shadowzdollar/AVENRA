'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

type StageKey = 'DRAFT' | 'REQUESTED' | 'COLLECTING' | 'VERIFYING' | 'EXCEPTION' | 'COMPLETED';

interface StageDef {
  key: StageKey;
  label: string;
  actor: string;
  permission: string;
  actionLabel: string;
  summary: string;
  logLine: string;
  hash: string;
}

const STAGES: StageDef[] = [
  {
    key: 'DRAFT',
    label: '01 · Draft',
    actor: 'Engagement Lead',
    permission: 'work.write',
    actionLabel: 'Dispatch Client Portal Link',
    summary: 'FY2026 Corporate Tax Pack created with 4 mandatory document requirements and 6 verification rules.',
    logLine: 'work.created · organization_id=org_northwind · status=DRAFT',
    hash: '9f86d081884c...7d659a2feaa0'
  },
  {
    key: 'REQUESTED',
    label: '02 · Requested',
    actor: 'Request Dispatcher',
    permission: 'request.send',
    actionLabel: 'Simulate Client Upload',
    summary: 'Single-purpose expiring link dispatched to cfo@acme.example (expires in 14 days, no client account needed).',
    logLine: 'request.sent · token_scope=wrk_884 · ttl=14d',
    hash: '4b227777d4dd...1fc61c6f884f'
  },
  {
    key: 'COLLECTING',
    label: '03 · Collecting',
    actor: 'External Client',
    permission: 'portal.token',
    actionLabel: 'Run ClamAV & Rules Engine',
    summary: 'Client uploaded Q1_Bank_Statement.pdf (1.4 MB) and Trial_Balance_2026.xlsx via secure browser dropzone.',
    logLine: 'upload.received · files=2 · bytes=1482910',
    hash: 'ef2d127de37b...942baad06145'
  },
  {
    key: 'VERIFYING',
    label: '04 · Verifying',
    actor: 'Deterministic Engine',
    permission: 'system.verify',
    actionLabel: 'Inspect Flagged Exception',
    summary: 'ClamAV scan CLEAN. 5/6 rules passed automatically; 1 variance flagged on December payroll reconciliation.',
    logLine: 'verification.run · clamav=CLEAN · passed=5 · failed=1',
    hash: 'e7f6c011776e...8db7cd330b54'
  },
  {
    key: 'EXCEPTION',
    label: '05 · Exception',
    actor: 'Senior Reviewer',
    permission: 'exception.resolve',
    actionLabel: 'Approve & Sign Off Work',
    summary: 'Reviewer inspected variance ($14.20 rounding diff) and recorded a formal override justification in the ledger.',
    logLine: 'exception.resolved · decision=OVERRIDE · reason="Immaterial rounding"',
    hash: '7902699be42c...8a8e46fbbb45'
  },
  {
    key: 'COMPLETED',
    label: '06 · Completed',
    actor: 'Signing Partner',
    permission: 'work.approve',
    actionLabel: 'Restart Simulation',
    summary: 'All evidence hashed and vaulted in S3. Signed completion manifest exported and work.completed webhook delivered.',
    logLine: 'work.completed · manifest=s3://vault/wrk_884.json · webhook=200',
    hash: '2c624232cdd2...21771294dfbb'
  }
];

type RoleKey = 'preparer' | 'reviewer' | 'partner';

const ROLES: Record<
  RoleKey,
  {
    title: string;
    subtitle: string;
    permissions: { code: string; label: string; allowed: boolean }[];
  }
> = {
  preparer: {
    title: 'Staff Preparer',
    subtitle: 'Scopes engagements, dispatches client links, and monitors incoming uploads.',
    permissions: [
      { code: 'work.read', label: 'View engagements & evidence', allowed: true },
      { code: 'work.write', label: 'Create work & send client links', allowed: true },
      { code: 'exception.resolve', label: 'Override failed verification rules', allowed: false },
      { code: 'agent.approve', label: 'Approve high-risk AI plans', allowed: false },
      { code: 'work.approve', label: 'Final partner sign-off', allowed: false }
    ]
  },
  reviewer: {
    title: 'Manager / Reviewer',
    subtitle: 'Triages exceptions, approves governed AI plans, and validates completeness.',
    permissions: [
      { code: 'work.read', label: 'View engagements & evidence', allowed: true },
      { code: 'work.write', label: 'Create work & send client links', allowed: true },
      { code: 'exception.resolve', label: 'Override failed verification rules', allowed: true },
      { code: 'agent.approve', label: 'Approve high-risk AI plans', allowed: true },
      { code: 'work.approve', label: 'Final partner sign-off', allowed: false }
    ]
  },
  partner: {
    title: 'Signing Partner',
    subtitle: 'Full segregation-of-duties authority for final approval and billing governance.',
    permissions: [
      { code: 'work.read', label: 'View engagements & evidence', allowed: true },
      { code: 'work.write', label: 'Create work & send client links', allowed: true },
      { code: 'exception.resolve', label: 'Override failed verification rules', allowed: true },
      { code: 'agent.approve', label: 'Approve high-risk AI plans', allowed: true },
      { code: 'work.approve', label: 'Final partner sign-off', allowed: true }
    ]
  }
};

export function PlatformExperience() {
  const [stepIdx, setStepIdx] = useState(0);
  const [activeRole, setActiveRole] = useState<RoleKey>('reviewer');

  const current = STAGES[stepIdx];
  const history = STAGES.slice(0, stepIdx + 1);
  const roleData = ROLES[activeRole];

  const handleAdvance = () => {
    setStepIdx((prev) => (prev + 1) % STAGES.length);
  };

  return (
    <>
      {/* Split Interactive Hero */}
      <Frame className='grid lg:grid-cols-[1fr_1.15fr]'>
        <div className='flex flex-col justify-center space-y-6 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0 lg:py-20'>
          <div>
            <Pill>Interactive Architecture · State Machine</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            Don’t just track tasks. Enforce how work gets verified.
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Step through a live Avenra engagement on the right. Every state transition is guarded by explicit permissions, ClamAV scanning, and SHA-256 audit hashing.
          </p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
              Launch your workspace <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/agent' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
              Explore AI Agent
            </Link>
          </div>
        </div>

        {/* Live State Machine Simulator */}
        <div className='bg-muted/20 flex flex-col justify-between p-6 md:p-10'>
          <div>
            <div className='flex items-center justify-between gap-2 pb-4'>
              <span className='font-mono text-xs font-semibold uppercase tracking-wider text-cyan-500'>
                Live Engagement Simulator · #WRK-884
              </span>
              <span className='bg-background rounded-full border px-2.5 py-0.5 font-mono text-[11px]'>
                Step {stepIdx + 1} / {STAGES.length}
              </span>
            </div>

            {/* Interactive Step Pills */}
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-6'>
              {STAGES.map((s, idx) => (
                <button
                  key={s.key}
                  type='button'
                  onClick={() => setStepIdx(idx)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-center font-mono text-[10px] font-medium transition-all',
                    idx === stepIdx
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : idx < stepIdx
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s.key}
                </button>
              ))}
            </div>

            {/* Active Stage Card */}
            <div className='bg-card mt-5 rounded-xl border p-5 shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-emerald-500' />
                  <h2 className='text-base font-semibold'>{current.label}</h2>
                </div>
                <code className='bg-muted rounded px-2 py-0.5 font-mono text-[11px]'>
                  guard: {current.permission}
                </code>
              </div>
              <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>{current.summary}</p>
              <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4'>
                <span className='text-muted-foreground font-mono text-[11px]'>
                  SHA-256: {current.hash}
                </span>
                <button
                  type='button'
                  onClick={handleAdvance}
                  className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                >
                  {current.actionLabel} <Icons.arrowRight className='size-3.5' />
                </button>
              </div>
            </div>
          </div>

          {/* Live Append-Only Audit Stream */}
          <div className='bg-background mt-5 rounded-xl border p-4'>
            <p className='text-muted-foreground mb-2 font-mono text-[10px] uppercase tracking-wider'>
              Append-Only Audit Ledger ({history.length} events)
            </p>
            <div className='max-h-36 space-y-1.5 overflow-y-auto font-mono text-[11px]'>
              {history.map((h, i) => (
                <div key={h.key} className='flex items-center gap-2'>
                  <span className='text-emerald-500'>✓</span>
                  <span className='text-muted-foreground'>[0{i + 1}]</span>
                  <span className='truncate'>{h.logLine}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Interactive Permission Sandbox */}
      <Frame className='grid lg:grid-cols-[0.9fr_1.1fr]'>
        <div className='space-y-5 border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <SectionHeading
            title='Test segregation of duties interactively'
            description='Avenra checks explicit permissions on every domain action rather than broad admin booleans. Switch roles to inspect exactly what each person can execute.'
          />
          <div className='flex flex-col gap-2 pt-2'>
            {(Object.keys(ROLES) as RoleKey[]).map((key) => (
              <button
                key={key}
                type='button'
                onClick={() => setActiveRole(key)}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                  activeRole === key
                    ? 'bg-accent border-primary/50 shadow-sm'
                    : 'bg-background hover:bg-muted/40'
                )}
              >
                <div>
                  <p className='text-sm font-medium'>{ROLES[key].title}</p>
                  <p className='text-muted-foreground text-xs'>{ROLES[key].subtitle}</p>
                </div>
                <Icons.chevronRight className='text-muted-foreground size-4 shrink-0' />
              </button>
            ))}
          </div>
        </div>

        <div className='flex flex-col justify-center p-6 md:p-10'>
          <div className='bg-card rounded-xl border p-6'>
            <div className='flex items-center justify-between border-b pb-4'>
              <div>
                <p className='text-xs font-mono uppercase text-muted-foreground'>Active Session</p>
                <h3 className='text-lg font-semibold'>{roleData.title}</h3>
              </div>
              <span className='rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-xs text-cyan-600 dark:text-cyan-400'>
                Server-Enforced
              </span>
            </div>
            <div className='mt-4 divide-y'>
              {roleData.permissions.map((p) => (
                <div key={p.code} className='flex items-center justify-between py-3 text-sm'>
                  <div>
                    <code className='font-mono text-xs font-semibold'>{p.code}</code>
                    <p className='text-muted-foreground text-xs'>{p.label}</p>
                  </div>
                  {p.allowed ? (
                    <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                      <Icons.check className='size-3.5' /> Allowed
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive'>
                      <Icons.close className='size-3.5' /> 403 Denied
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
    </>
  );
}
