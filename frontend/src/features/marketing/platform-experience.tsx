'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const VIEWS = [
  {
    id: 'command',
    label: 'Command Center',
    kicker: 'Executive Clarity',
    title: 'Every engagement, deadline, and exception—in one quiet view.',
    body: 'Eliminate status meetings and spreadsheet trackers. Partners see real-time completion velocity across every office and practice line.',
    image: '/landing/command-center.webp'
  },
  {
    id: 'intake',
    label: 'Client Portal',
    kicker: 'Zero-Friction Collection',
    title: 'Passwordless client links designed to get answered on the first ask.',
    body: 'Send single-purpose, expiring portal links. Clients drop files and answer structured prompts from any device—no accounts, no forgotten passwords.',
    image: '/landing/client-requests.webp'
  },
  {
    id: 'exceptions',
    label: 'Exception Queue',
    kicker: 'Automated Quality Control',
    title: 'Surface missing periods and discrepancies before review even starts.',
    body: 'Routine schedules verify themselves automatically. Only genuine variances reach your team, complete with one-click reject or recorded override.',
    image: '/landing/exception-queue.webp'
  },
  {
    id: 'vault',
    label: 'Evidence Vault',
    kicker: 'Tamper-Evident Archive',
    title: 'Cryptographic proof attached to every client deliverable.',
    body: 'Every uploaded file and partner sign-off is fingerprinted and chronologically logged—ready for peer review or regulatory inspection.',
    image: '/landing/evidence-vault.webp'
  }
];

export function PlatformExperience() {
  const [activeView, setActiveView] = useState(VIEWS[0].id);
  const current = VIEWS.find((v) => v.id === activeView) ?? VIEWS[0];

  return (
    <>
      {/* Linear-Grade Atmospheric Editorial Hero */}
      <Frame className='relative overflow-hidden px-6 pt-24 pb-12 md:px-12 md:pt-32 md:pb-20'>
        {/* Volumetric subtle top light */}
        <div
          aria-hidden
          className='pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[780px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.14),rgba(99,102,241,0.06)_50%,transparent_75%)] blur-2xl'
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='relative z-10 mx-auto max-w-4xl text-center'
        >
          <span className='border-border/70 bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium tracking-wide backdrop-blur-md'>
            <span className='size-1.5 rounded-full bg-cyan-500' />
            Avenra Platform
          </span>

          <h1 className='from-foreground via-foreground to-foreground/60 mt-7 bg-gradient-to-b bg-clip-text text-4xl font-medium tracking-[-0.04em] text-balance text-transparent sm:text-6xl md:text-[4.25rem] md:leading-[1.03]'>
            Purpose-built for verified client execution.
          </h1>

          <p className='text-muted-foreground/90 mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg'>
            Avenra unifies client intake, automated rule verification, exception triage, and tamper-evident archival into a single, calm operating system for modern firms.
          </p>

          <div className='mt-9 flex flex-wrap items-center justify-center gap-3.5'>
            <Link
              href='/auth/sign-up'
              className={cn(buttonVariants(), 'h-11 gap-2 rounded-full px-6 text-sm font-medium shadow-lg')}
            >
              Start 14-day free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link
              href='/contact'
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background/60 h-11 rounded-full px-6 text-sm backdrop-blur-md'
              )}
            >
              Book a private demo
            </Link>
          </div>
        </motion.div>

        {/* Perspective Floating Product Canvas with Specular Rim & Bottom Fade Mask */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className='relative mx-auto mt-16 max-w-5xl'
        >
          <div className='via-foreground/20 pointer-events-none absolute -top-px right-12 left-12 h-px bg-gradient-to-r from-transparent to-transparent' />
          <div className='bg-card/80 border-border/70 overflow-hidden rounded-2xl border p-2 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]'>
            <Image
              src='/landing/command-center.webp'
              alt='Avenra Command Center'
              width={2880}
              height={1800}
              loading='eager'
              className='h-auto w-full rounded-xl'
            />
          </div>
        </motion.div>
      </Frame>
      <DottedRule />

      {/* Linear-Style Asymmetric Bento Grid with Bespoke Miniature UI Compositions */}
      <Frame className='px-6 py-24 md:px-12'>
        <div className='max-w-2xl space-y-3'>
          <p className='text-xs font-medium uppercase tracking-[0.18em] text-cyan-500'>
            Engineered Precision
          </p>
          <h2 className='text-3xl font-medium tracking-[-0.03em] text-balance md:text-4xl'>
            Every detail designed to eliminate follow-up friction.
          </h2>
        </div>

        <div className='mt-12 grid gap-5 lg:grid-cols-12'>
          {/* Bento Card 1: Wide (7 cols) — Miniature Verification Pipeline Visual */}
          <div className='bg-card/50 border-border/70 relative overflow-hidden rounded-2xl border p-7 lg:col-span-7'>
            <div className='via-foreground/15 pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent' />
            <div className='max-w-md space-y-2'>
              <h3 className='text-lg font-medium tracking-tight'>Continuous Rule Verification</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Documents are screened and checked against your firm’s rules the second a client hits upload—catching missing months before a partner ever opens the file.
              </p>
            </div>

            {/* Bespoke Miniature UI Composition */}
            <div className='bg-background/80 border-border/70 mt-8 space-y-2.5 rounded-xl border p-4 shadow-inner'>
              {[
                { doc: 'Q1–Q4 Commercial Bank Statements.pdf', status: 'Verified · 12/12 months', ok: true },
                { doc: 'FY2026 General Ledger Export.xlsx', status: 'Verified · Balanced', ok: true },
                { doc: 'December Payroll Reconciliation.pdf', status: 'Exception · $14.20 variance', ok: false }
              ].map((row) => (
                <div
                  key={row.doc}
                  className='bg-card/80 border-border/60 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-xs'
                >
                  <span className='truncate font-medium'>{row.doc}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      row.ok
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Card 2: Narrow (5 cols) — Miniature Passwordless Link Card */}
          <div className='bg-card/50 border-border/70 relative overflow-hidden rounded-2xl border p-7 lg:col-span-5'>
            <div className='via-foreground/15 pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent' />
            <div className='space-y-2'>
              <h3 className='text-lg font-medium tracking-tight'>Passwordless Client Links</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Zero client logins. Scoped, expiring links that turn 2-week email chains into 4-minute uploads.
              </p>
            </div>

            <div className='bg-background/80 border-border/70 mt-8 space-y-3 rounded-xl border p-4'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground'>Portal Link · Northwind FY26</span>
                <span className='flex items-center gap-1.5 text-emerald-500'>
                  <span className='size-1.5 rounded-full bg-emerald-500' /> Active
                </span>
              </div>
              <div className='bg-muted/50 text-muted-foreground truncate rounded-lg border px-3 py-2 font-mono text-[11px]'>
                https://portal.avenra.com/r/northwind-fy26
              </div>
              <div className='text-muted-foreground flex items-center justify-between text-[11px]'>
                <span>Expires in 14 days</span>
                <span>4 of 4 items received</span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Narrow (5 cols) — Cryptographic Proof Card */}
          <div className='bg-card/50 border-border/70 relative overflow-hidden rounded-2xl border p-7 lg:col-span-5'>
            <div className='space-y-2'>
              <h3 className='text-lg font-medium tracking-tight'>Immutable Evidence Trail</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Every approval, exception override, and client file is permanently fingerprinted and timestamped.
              </p>
            </div>
            <div className='bg-background/80 border-border/70 mt-8 space-y-2.5 rounded-xl border p-4 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Partner Sign-Off</span>
                <span className='text-muted-foreground'>14:22 UTC</span>
              </div>
              <p className='text-muted-foreground font-mono text-[11px]'>
                SHA-256 · 8f434346648f6b96df89dda901c5176b
              </p>
            </div>
          </div>

          {/* Bento Card 4: Wide (7 cols) — Segregation of Duties Card */}
          <div className='bg-card/50 border-border/70 relative overflow-hidden rounded-2xl border p-7 lg:col-span-7'>
            <div className='max-w-md space-y-2'>
              <h3 className='text-lg font-medium tracking-tight'>Built for Segregation of Duties</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Preparers collect evidence, managers resolve exceptions, and signing partners execute final approval—enforced automatically across every workspace.
              </p>
            </div>
            <div className='mt-8 grid gap-3 sm:grid-cols-3'>
              {[
                { role: 'Preparer', scope: 'Collect & organize client evidence' },
                { role: 'Reviewer', scope: 'Triage & resolve flagged exceptions' },
                { role: 'Partner', scope: 'Final approval & audit lock' }
              ].map((r, i) => (
                <div key={r.role} className='bg-background/80 border-border/70 rounded-xl border p-3.5'>
                  <span className='text-muted-foreground font-mono text-[10px]'>0{i + 1}</span>
                  <p className='mt-1 text-sm font-medium'>{r.role}</p>
                  <p className='text-muted-foreground mt-1 text-xs leading-snug'>{r.scope}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Fluid Spring-Animated Product Tour */}
      <Frame className='px-6 py-24 md:px-12'>
        <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
          <div className='max-w-xl space-y-2'>
            <p className='text-xs font-medium uppercase tracking-[0.18em] text-cyan-500'>
              Interactive Tour
            </p>
            <h2 className='text-3xl font-medium tracking-[-0.03em] md:text-4xl'>
              Explore every surface of the workspace.
            </h2>
          </div>

          <div className='bg-muted/40 border-border/70 inline-flex flex-wrap gap-1 rounded-full border p-1'>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type='button'
                onClick={() => setActiveView(v.id)}
                className={cn(
                  'relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                  activeView === v.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {activeView === v.id && (
                  <motion.span
                    layoutId='platform-tour-pill'
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className='bg-primary absolute inset-0 rounded-full'
                  />
                )}
                <span className='relative z-10'>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className='mt-10 grid items-center gap-10 lg:grid-cols-[0.75fr_1.25fr]'
          >
            <div className='space-y-4'>
              <p className='text-muted-foreground text-xs font-medium uppercase tracking-widest'>
                {current.kicker}
              </p>
              <h3 className='text-2xl font-medium tracking-tight md:text-3xl'>{current.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed md:text-base'>
                {current.body}
              </p>
              <div className='pt-2'>
                <Link href='/auth/sign-up' className={cn(buttonVariants({ variant: 'outline' }), 'gap-2 rounded-full px-5')}>
                  Try {current.label} free <Icons.arrowRight className='size-3.5' />
                </Link>
              </div>
            </div>

            <div className='bg-card/80 border-border/70 overflow-hidden rounded-2xl border p-2 shadow-2xl'>
              <Image
                src={current.image}
                alt={current.title}
                width={1600}
                height={1000}
                className='h-auto w-full rounded-xl'
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </Frame>
    </>
  );
}
