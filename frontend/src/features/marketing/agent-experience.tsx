'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const CAPABILITIES = [
  {
    id: 'reading',
    label: 'Document Reading',
    title: 'Extract structured evidence from raw client PDFs in seconds.',
    body: 'Bank statements, tax forms, and corporate resolutions are read automatically and checked against your firm’s rules—eliminating hours of manual data entry.',
    metrics: [
      { value: '< 2s', label: 'Per document' },
      { value: '100%', label: 'Source linked' }
    ]
  },
  {
    id: 'planning',
    label: 'Work Planning',
    title: 'Propose clear next steps based on live engagement status.',
    body: 'The Agent inspects missing requirements, upcoming filing deadlines, and client response history to draft tailored follow-up plans for your team.',
    metrics: [
      { value: '3×', label: 'Faster scoping' },
      { value: 'Zero', label: 'Missed items' }
    ]
  },
  {
    id: 'governance',
    label: 'Human Approval',
    title: 'AI proposes. Your firm authorizes.',
    body: 'Every execution plan waits in a clean approval queue. High-risk external communications require explicit sign-off, and any reviewer can pause a run immediately.',
    metrics: [
      { value: '100%', label: 'Human authorized' },
      { value: 'Full', label: 'Audit provenance' }
    ]
  }
];

export function AgentExperience() {
  const [activeId, setActiveId] = useState(CAPABILITIES[0].id);
  const current = CAPABILITIES.find((c) => c.id === activeId) ?? CAPABILITIES[0];

  return (
    <>
      {/* Atmospheric AI Hero */}
      <Frame className='relative overflow-hidden px-6 pt-24 pb-16 md:px-12 md:pt-32 md:pb-24'>
        <div
          aria-hidden
          className='pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(129,140,248,0.16),rgba(56,189,248,0.08)_45%,transparent_75%)] blur-2xl'
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='relative z-10 mx-auto max-w-4xl text-center'
        >
          <span className='border-border/70 bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium backdrop-blur-md'>
            <Icons.sparkles className='size-3.5 text-indigo-400' />
            Avenra Agent Intelligence
          </span>

          <h1 className='from-foreground via-foreground to-foreground/60 mt-7 bg-gradient-to-b bg-clip-text text-4xl font-medium tracking-[-0.04em] text-balance text-transparent sm:text-6xl md:text-[4.25rem] md:leading-[1.03]'>
            Intelligence that respects your firm’s rules.
          </h1>

          <p className='text-muted-foreground/90 mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg'>
            Built from the ground up for regulated professional services. Avenra reads client documents and drafts execution plans—while keeping partners in complete control of every approval and budget.
          </p>

          <div className='mt-9 flex flex-wrap justify-center gap-3.5'>
            <Link
              href='/auth/sign-up'
              className={cn(buttonVariants(), 'h-11 gap-2 rounded-full px-6 text-sm font-medium shadow-lg')}
            >
              Start free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link
              href='/contact'
              className={cn(buttonVariants({ variant: 'outline' }), 'h-11 rounded-full px-6 text-sm')}
            >
              Schedule an AI briefing
            </Link>
          </div>
        </motion.div>

        {/* Floating Masked Agent Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className='relative mx-auto mt-16 max-w-5xl'
        >
          <div className='via-indigo-400/30 pointer-events-none absolute -top-px right-16 left-16 h-px bg-gradient-to-r from-transparent to-transparent' />
          <div className='bg-card/80 border-border/70 overflow-hidden rounded-2xl border p-2 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.45)] [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]'>
            <Image
              src='/landing/agent-intelligence.webp'
              alt='Avenra Agent Intelligence workspace'
              width={1600}
              height={1000}
              loading='eager'
              className='h-auto w-full rounded-xl'
            />
          </div>
        </motion.div>
      </Frame>
      <DottedRule />

      {/* Minimalist Interactive Capability Switcher */}
      <Frame className='px-6 py-24 md:px-12'>
        <div className='mx-auto max-w-4xl'>
          <div className='bg-muted/40 border-border/70 mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-full border p-1'>
            {CAPABILITIES.map((cap) => (
              <button
                key={cap.id}
                type='button'
                onClick={() => setActiveId(cap.id)}
                className={cn(
                  'relative rounded-full px-5 py-2 text-xs font-medium transition-colors sm:text-sm',
                  activeId === cap.id
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {activeId === cap.id && (
                  <motion.span
                    layoutId='agent-cap-pill'
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className='bg-primary absolute inset-0 rounded-full'
                  />
                )}
                <span className='relative z-10'>{cap.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode='wait'>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className='bg-card/50 border-border/70 mt-10 grid items-center gap-8 rounded-2xl border p-8 md:grid-cols-[1.4fr_0.6fr] md:p-12'
            >
              <div className='space-y-3'>
                <h2 className='text-2xl font-medium tracking-tight md:text-3xl'>{current.title}</h2>
                <p className='text-muted-foreground text-sm leading-relaxed md:text-base'>
                  {current.body}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-1'>
                {current.metrics.map((m) => (
                  <div key={m.label} className='bg-background/80 border-border/60 rounded-xl border p-4 text-center'>
                    <p className='text-2xl font-semibold tracking-tight'>{m.value}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>{m.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Frame>
      <DottedRule />

      {/* Minimalist Contrast: Chatbots vs Governed Execution */}
      <Frame className='px-6 py-24 md:px-12'>
        <div className='mx-auto max-w-5xl'>
          <h2 className='text-center text-3xl font-medium tracking-[-0.03em] md:text-4xl'>
            Chatbots guess. Avenra verifies.
          </h2>
          <div className='mt-12 grid gap-6 md:grid-cols-2'>
            <div className='border-border/60 bg-background/40 space-y-4 rounded-2xl border p-8'>
              <p className='text-muted-foreground text-xs font-semibold uppercase tracking-widest'>
                Unmanaged AI Tools
              </p>
              <ul className='text-muted-foreground space-y-3.5 text-sm'>
                <li className='flex items-start gap-3'>
                  <Icons.close className='text-destructive mt-0.5 size-4 shrink-0' />
                  <span>Sensitive client filings pasted into unmonitored chat windows</span>
                </li>
                <li className='flex items-start gap-3'>
                  <Icons.close className='text-destructive mt-0.5 size-4 shrink-0' />
                  <span>No verification gates, no partner sign-off, and no audit history</span>
                </li>
                <li className='flex items-start gap-3'>
                  <Icons.close className='text-destructive mt-0.5 size-4 shrink-0' />
                  <span>Unpredictable spend with zero organizational guardrails</span>
                </li>
              </ul>
            </div>

            <div className='border-primary/30 bg-card/80 relative space-y-4 overflow-hidden rounded-2xl border p-8 shadow-xl'>
              <div className='via-cyan-400/40 pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent' />
              <p className='text-xs font-semibold uppercase tracking-widest text-cyan-500'>
                Avenra Governed Agent
              </p>
              <ul className='space-y-3.5 text-sm'>
                <li className='flex items-start gap-3'>
                  <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                  <span>Strictly isolated inside your firm’s workspace with zero external training</span>
                </li>
                <li className='flex items-start gap-3'>
                  <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                  <span>Every proposal waits for explicit human approval with full audit provenance</span>
                </li>
                <li className='flex items-start gap-3'>
                  <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                  <span>Hard daily usage limits keep peak-season AI costs 100% predictable</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Frame>
    </>
  );
}
