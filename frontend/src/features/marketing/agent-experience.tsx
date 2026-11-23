'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const CAPABILITIES = [
  {
    id: 'reading',
    title: 'Intelligent Document Reading',
    summary:
      'Automatically extracts key dates, balances, entity names, and tax identifiers from uploaded PDFs and statements—feeding clean data straight into your review checklists.',
    outcomes: [
      'Eliminates manual re-keying of bank statements and tax schedules',
      'Flags missing pages or mismatched reporting periods automatically',
      'Links every extracted value directly back to the source document'
    ]
  },
  {
    id: 'planning',
    title: 'Structured Work Planning',
    summary:
      'Drafts actionable step-by-step execution plans based on live engagement requirements, helping managers spot missing client inputs before deadlines slip.',
    outcomes: [
      'Drafts tailored client follow-up checklists in seconds',
      'Highlights high-priority bottlenecks across active engagements',
      'Adapts dynamically as new client evidence arrives'
    ]
  },
  {
    id: 'governance',
    title: 'Human-in-the-Loop Governance',
    summary:
      'Built specifically for regulated professional services: Avenra’s Agent proposes work, while your partners and managers retain 100% approval authority over every external action.',
    outcomes: [
      'Every plan waits for explicit human approval before running',
      'High-risk client communications require dedicated sign-off',
      'One-click halt control and full audit trail on every run'
    ]
  },
  {
    id: 'budgets',
    title: 'Predictable Cost & Usage Controls',
    summary:
      'Workspace administrators set firm-wide daily and per-engagement usage limits—guaranteeing predictable AI spend even during peak tax and audit seasons.',
    outcomes: [
      'Transparent cost estimates shown prior to approving any run',
      'Configurable daily organization limits with zero surprise overages',
      'Client documents are never used to train external AI models'
    ]
  }
];

export function AgentExperience() {
  const [activeTab, setActiveTab] = useState(CAPABILITIES[0].id);
  const current = CAPABILITIES.find((c) => c.id === activeTab) ?? CAPABILITIES[0];

  return (
    <>
      {/* Split Executive Hero with Real Product Preview */}
      <Frame className='grid lg:grid-cols-[0.95fr_1.05fr]'>
        <div className='flex flex-col justify-center space-y-6 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0 lg:py-20'>
          <div>
            <Pill>Avenra Agent Intelligence</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            AI built for the rigor of regulated client work
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Accelerate document intake, verification, and engagement planning with governed AI that never acts without authorization, never fabricates approvals, and leaves a complete audit trail.
          </p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-11 gap-2 px-6')}>
              Start 14-day free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/contact' className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-6')}>
              Request an AI walkthrough
            </Link>
          </div>
        </div>

        <div className='bg-muted/20 flex items-center justify-center p-6 md:p-10'>
          <div className='bg-card w-full overflow-hidden rounded-xl border p-1.5 shadow-2xl'>
            <Image
              src='/landing/agent-intelligence.webp'
              alt='Avenra Agent Intelligence showing governed plan proposals and approval controls'
              width={1600}
              height={1000}
              className='h-auto w-full rounded-lg'
            />
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Interactive Capabilities Explorer */}
      <Frame className='grid lg:grid-cols-[0.85fr_1.15fr]'>
        <div className='divide-y border-b lg:border-r lg:border-b-0'>
          {CAPABILITIES.map((cap, idx) => (
            <button
              key={cap.id}
              type='button'
              onClick={() => setActiveTab(cap.id)}
              className={cn(
                'flex w-full items-center justify-between px-6 py-6 text-left transition-colors md:px-8',
                activeTab === cap.id ? 'bg-accent/40' : 'hover:bg-muted/30'
              )}
            >
              <div>
                <span className='text-muted-foreground font-mono text-xs'>0{idx + 1}</span>
                <h2 className='mt-1 text-base font-medium md:text-lg'>{cap.title}</h2>
              </div>
              <Icons.chevronRight className='text-muted-foreground size-4 shrink-0' />
            </button>
          ))}
        </div>

        <div className='flex flex-col justify-center space-y-6 p-6 md:p-12'>
          <h3 className='text-2xl font-medium tracking-tight md:text-3xl'>{current.title}</h3>
          <p className='text-muted-foreground text-base leading-relaxed'>{current.summary}</p>
          <ul className='space-y-3.5 border-t pt-6'>
            {current.outcomes.map((o) => (
              <li key={o} className='flex items-start gap-3 text-sm'>
                <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Frame>
      <DottedRule />

      {/* Executive Comparison: Generic Chatbots vs Avenra Governed AI */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Why enterprise firms choose governed AI over generic chat tools'
            description='Ad-hoc prompting creates compliance risk. Avenra embeds AI inside your firm’s verified workflows, permissions, and audit controls.'
          />
        </div>
        <div className='grid border-t md:grid-cols-2'>
          <div className='space-y-4 border-b p-6 md:border-r md:border-b-0 md:p-10'>
            <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wider'>
              Generic AI Chatbots
            </p>
            <ul className='text-muted-foreground space-y-3 text-sm'>
              <li className='flex items-start gap-2.5'>
                <Icons.close className='text-destructive mt-0.5 size-4 shrink-0' />
                <span>Staff copy-paste sensitive client PDFs into unmanaged browser tabs</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <Icons.close className='text-destructive mt-0.5 size-4 shrink-0' />
                <span>No verification rules, no approval sign-off, and no audit history</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <Icons.close className='text-destructive mt-0.5 size-4 shrink-0' />
                <span>Unpredictable outputs disconnected from engagement deadlines</span>
              </li>
            </ul>
          </div>
          <div className='bg-accent/15 space-y-4 p-6 md:p-10'>
            <p className='text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400'>
              Avenra Governed Agent
            </p>
            <ul className='space-y-3 text-sm'>
              <li className='flex items-start gap-2.5'>
                <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                <span>Operates strictly inside your firm’s isolated workspace with zero model training</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                <span>Every proposal requires explicit human approval and records full provenance</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                <span>Extracted values are validated by deterministic firm rules before acceptance</span>
              </li>
            </ul>
          </div>
        </div>
      </Frame>
    </>
  );
}
