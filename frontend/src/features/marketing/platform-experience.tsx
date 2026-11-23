'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

interface PlatformModule {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  metric: { value: string; label: string };
}

const MODULES: PlatformModule[] = [
  {
    id: 'command-center',
    label: 'Command Center',
    eyebrow: 'Executive Oversight',
    title: 'Real-time visibility across every active engagement',
    description:
      'Managing partners and directors see completion progress, overdue client items, verification pass rates, and team workload in a single executive view—without chasing status updates.',
    image: '/landing/command-center.webp',
    highlights: [
      'Live readiness tracking across all client deliverables',
      'Instant visibility into stalled requests and upcoming deadlines',
      'Organization-wide audit metrics updated in real time'
    ],
    metric: { value: '100%', label: 'Engagement visibility' }
  },
  {
    id: 'client-portal',
    label: 'Client Portal',
    eyebrow: 'Frictionless Intake',
    title: 'Passwordless client links that get answered 3x faster',
    description:
      'Send secure, expiring request links directly to clients. They answer structured questions and upload documents from any browser—no account creation or password resets required.',
    image: '/landing/client-requests.webp',
    highlights: [
      'Single-purpose expiring links scoped strictly to one engagement',
      'Automated, polite reminder schedules for overdue items',
      'Instant confirmation receipts for clients and staff'
    ],
    metric: { value: '3.2×', label: 'Faster client turnaround' }
  },
  {
    id: 'exception-queue',
    label: 'Exception Queue',
    eyebrow: 'Automated Verification',
    title: 'Catch missing periods and discrepancies before review starts',
    description:
      'Every incoming document is automatically screened and checked against your firm’s standards. Clean submissions pass straight through; discrepancies route to the Exception Queue for fast resolution.',
    image: '/landing/exception-queue.webp',
    highlights: [
      'Immediate validation of file types, coverage periods, and completeness',
      'Structured reject-and-re-request flow for incomplete uploads',
      'Mandatory recorded rationale for any reviewer override'
    ],
    metric: { value: '94%', label: 'Routine checks automated' }
  },
  {
    id: 'evidence-vault',
    label: 'Evidence Vault',
    eyebrow: 'Audit-Ready Archive',
    title: 'Tamper-evident proof for every client decision',
    description:
      'Every accepted file, client answer, and partner sign-off is cryptographically fingerprinted and archived in an immutable vault—ready for internal quality control or external regulators.',
    image: '/landing/evidence-vault.webp',
    highlights: [
      'Cryptographic fingerprinting on every uploaded document',
      'Complete chain-of-custody timeline with actor and timestamp',
      'One-click export of verified completion packages'
    ],
    metric: { value: 'Zero', label: 'Unrecorded status changes' }
  },
  {
    id: 'team-governance',
    label: 'Team Governance',
    eyebrow: 'Segregation of Duties',
    title: 'Granular permissions built for regulated firms',
    description:
      'Separate preparation, exception review, and final partner sign-off across offices and practice lines—ensuring every deliverable meets firm quality standards.',
    image: '/landing/team.webp',
    highlights: [
      'Explicit approval permissions separating preparers and partners',
      'Multi-workspace isolation for separate entities or service lines',
      'Full activity history across every team member'
    ],
    metric: { value: 'SOC-2', label: 'Enterprise control alignment' }
  }
];

export function PlatformExperience() {
  const [activeId, setActiveId] = useState(MODULES[0].id);
  const active = MODULES.find((m) => m.id === activeId) ?? MODULES[0];

  return (
    <>
      {/* Editorial Enterprise Hero */}
      <Frame className='relative overflow-hidden px-6 py-16 text-center md:px-12 md:py-24'>
        <div
          aria-hidden
          className='pointer-events-none absolute top-0 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl'
        />
        <div className='relative z-10 mx-auto max-w-3xl space-y-6'>
          <Pill>The Avenra Platform</Pill>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            One operational backbone from client intake to verified sign-off
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed md:text-lg'>
            Replace fragmented email threads, static spreadsheets, and manual checklists with a unified platform engineered for accounting, audit, legal, and advisory firms.
          </p>
          <div className='flex flex-wrap justify-center gap-3 pt-2'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-11 gap-2 px-6')}>
              Start 14-day free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/contact' className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-6')}>
              Book an enterprise demo
            </Link>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Interactive Product Module Showcase */}
      <Frame>
        <div className='flex flex-wrap items-center justify-center gap-2 border-b px-6 py-5 md:px-10'>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type='button'
              onClick={() => setActiveId(m.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                activeId === m.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className='grid lg:grid-cols-[0.9fr_1.15fr]'>
          <div className='flex flex-col justify-between space-y-6 border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
            <div className='space-y-4'>
              <p className='text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400'>
                {active.eyebrow}
              </p>
              <h2 className='text-2xl font-medium tracking-tight md:text-3xl'>{active.title}</h2>
              <p className='text-muted-foreground text-sm leading-relaxed md:text-base'>
                {active.description}
              </p>
              <ul className='space-y-3 pt-2'>
                {active.highlights.map((item) => (
                  <li key={item} className='flex items-start gap-2.5 text-sm'>
                    <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                    <span className='text-muted-foreground'>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='bg-muted/30 flex items-center justify-between rounded-xl border px-5 py-4'>
              <div>
                <p className='text-2xl font-semibold tracking-tight'>{active.metric.value}</p>
                <p className='text-muted-foreground text-xs'>{active.metric.label}</p>
              </div>
              <Link href='/auth/sign-up' className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
                Try it free <Icons.arrowRight className='size-3.5' />
              </Link>
            </div>
          </div>

          <div className='bg-muted/20 flex items-center justify-center p-6 md:p-10'>
            <div className='bg-card w-full overflow-hidden rounded-xl border p-1.5 shadow-2xl'>
              <Image
                src={active.image}
                alt={active.title}
                width={1600}
                height={1000}
                className='h-auto w-full rounded-lg'
              />
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Engagement Workflow Strip */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Standardized execution across every office and practice line'
            description='Give partners confidence that every deliverable follows your firm’s exact review and sign-off standards.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {[
            {
              step: '01',
              title: 'Scope & template',
              desc: 'Launch engagements from standardized firm templates with built-in document requirements and deadlines.'
            },
            {
              step: '02',
              title: 'Collect effortlessly',
              desc: 'Clients receive clean, branded portal links with automatic follow-ups—eliminating email chasing.'
            },
            {
              step: '03',
              title: 'Verify automatically',
              desc: 'Every submission is screened for security, completeness, and rule compliance before review begins.'
            },
            {
              step: '04',
              title: 'Approve & archive',
              desc: 'Authorized partners sign off completed engagements into an immutable, exportable evidence archive.'
            }
          ].map((s, i) => (
            <div
              key={s.step}
              className={cn(
                'space-y-3 border-b p-6 md:p-8 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <span className='text-muted-foreground font-mono text-xs font-semibold'>{s.step}</span>
              <h3 className='text-lg font-medium'>{s.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{s.desc}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      {/* Executive Conversion Band */}
      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-14 md:flex-row md:px-12'>
        <div className='space-y-1.5'>
          <h2 className='text-2xl font-medium tracking-tight'>
            Ready to modernize how your firm delivers client work?
          </h2>
          <p className='text-muted-foreground text-sm'>
            Launch a trial workspace in minutes or schedule a tailored walkthrough with our enterprise team.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/contact' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            Book a demo
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
