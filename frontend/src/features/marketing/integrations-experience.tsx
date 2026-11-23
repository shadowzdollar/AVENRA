'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const NODES = [
  { label: 'Accounting & ERP', icon: 'calculator' as const },
  { label: 'Cloud Archival (S3)', icon: 'fingerprint' as const },
  { label: 'Signed Webhooks', icon: 'webhook' as const },
  { label: 'Team Alerts', icon: 'bellRinging' as const },
  { label: 'Enterprise API', icon: 'code' as const }
];

export function IntegrationsExperience() {
  return (
    <>
      {/* Minimalist Hub-and-Spoke Ecosystem Hero */}
      <Frame className='relative overflow-hidden px-6 pt-24 pb-20 text-center md:px-12 md:pt-32 md:pb-28'>
        <div
          aria-hidden
          className='pointer-events-none absolute top-0 left-1/2 h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-2xl'
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='relative z-10 mx-auto max-w-3xl'
        >
          <span className='border-border/70 bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium backdrop-blur-md'>
            Connected Practice Ecosystem
          </span>

          <h1 className='from-foreground via-foreground to-foreground/60 mt-7 bg-gradient-to-b bg-clip-text text-4xl font-medium tracking-[-0.04em] text-balance text-transparent sm:text-6xl md:leading-[1.04]'>
            Fits quietly into the tools your firm already runs.
          </h1>

          <p className='text-muted-foreground/90 mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg'>
            Keep billing, document archives, and internal notifications effortlessly synchronized through signed lifecycle webhooks, automated archival exports, and our enterprise REST API.
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
              Discuss custom integrations
            </Link>
          </div>
        </motion.div>

        {/* Minimalist Connected Ecosystem Strip */}
        <div className='relative z-10 mx-auto mt-16 max-w-4xl'>
          <div className='bg-card/50 border-border/70 relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border p-8 md:flex-row'>
            <div className='via-cyan-400/30 pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent to-transparent' />
            <div className='bg-background border-border/80 flex size-16 shrink-0 items-center justify-center rounded-2xl border shadow-xl'>
              <AvenraIcon size={36} />
            </div>
            <div className='via-border hidden h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent md:block' />
            <div className='grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:w-auto lg:grid-cols-5'>
              {NODES.map((n) => {
                const Icon = Icons[n.icon];
                return (
                  <div
                    key={n.label}
                    className='bg-background/80 border-border/70 flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center'
                  >
                    <Icon className='text-muted-foreground size-5' />
                    <span className='text-xs font-medium'>{n.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Asymmetric Showcase with Masked Real Product Preview */}
      <Frame className='grid items-center gap-12 px-6 py-24 md:px-12 lg:grid-cols-[0.85fr_1.15fr]'>
        <div className='space-y-6'>
          <p className='text-xs font-medium uppercase tracking-[0.18em] text-cyan-500'>
            Automated Handoffs
          </p>
          <h2 className='text-3xl font-medium tracking-[-0.03em]'>
            Every milestone triggers the next step automatically.
          </h2>
          <p className='text-muted-foreground text-sm leading-relaxed md:text-base'>
            Stop re-entering engagement statuses across systems. Signed webhooks and automated cloud exports deliver verified workpapers and billing triggers the moment a partner signs off.
          </p>
          <div className='space-y-3 border-t pt-6 text-sm'>
            {[
              'Cryptographically signed webhooks with automatic retries',
              'Structured completion manifests exported directly to cloud storage',
              'Full delivery logs and replay controls built into your workspace'
            ].map((line) => (
              <div key={line} className='flex items-start gap-2.5'>
                <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                <span className='text-muted-foreground'>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-card/80 border-border/70 overflow-hidden rounded-2xl border p-2 shadow-2xl'>
          <Image
            src='/landing/notifications.webp'
            alt='Avenra automated notifications and integrations'
            width={1600}
            height={1000}
            className='h-auto w-full rounded-xl'
          />
        </div>
      </Frame>
    </>
  );
}
