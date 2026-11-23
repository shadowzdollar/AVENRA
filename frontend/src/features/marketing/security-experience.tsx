'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const LAYERS = [
  {
    id: 'isolation',
    num: '01',
    title: 'Database-Enforced Tenant Isolation',
    summary:
      'Every firm workspace is isolated at the PostgreSQL database level—guaranteeing client data can never cross organizational boundaries.',
    bullets: [
      'Server-side organization resolution from authenticated sessions',
      'Automated cross-tenant isolation testing on every release',
      'Dedicated storage isolation options for Enterprise firms'
    ]
  },
  {
    id: 'screening',
    num: '02',
    title: 'Real-Time Malware & Threat Screening',
    summary:
      'Every client attachment is scanned in real time before entering your vault—stopping infected or malformed files before staff ever touch them.',
    bullets: [
      'Automatic file-type and payload size validation at intake',
      'Streamed antivirus inspection prior to encrypted storage',
      'Zero unscreened documents ever reach team downloads'
    ]
  },
  {
    id: 'vault',
    num: '03',
    title: 'Tamper-Evident Evidence Vault',
    summary:
      'Accepted files and partner decisions are fingerprinted with SHA-256 and recorded in an append-only audit ledger built for external inspection.',
    bullets: [
      'AES-256 encryption at rest and TLS 1.3 in transit',
      'Cryptographic integrity verification on every document',
      'One-click audit trail export for peer or regulatory review'
    ]
  },
  {
    id: 'governance',
    num: '04',
    title: 'Granular Approval & AI Privacy Controls',
    summary:
      'Strict segregation of duties across preparers, reviewers, and signing partners—with zero external AI model training on your client files.',
    bullets: [
      'Explicit approval permissions for exceptions and final sign-offs',
      'Revocable, expiring passwordless client portal links',
      'Enterprise Data Processing Addenda (DPA) available'
    ]
  }
];

export function SecurityExperience() {
  const [openLayer, setOpenLayer] = useState(LAYERS[0].id);

  return (
    <>
      {/* Monolithic Minimalist Trust Hero */}
      <Frame className='relative overflow-hidden px-6 pt-24 pb-20 text-center md:px-12 md:pt-32 md:pb-28'>
        <div
          aria-hidden
          className='pointer-events-none absolute top-0 left-1/2 h-[380px] w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_70%)] blur-2xl'
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='relative z-10 mx-auto max-w-3xl'
        >
          <div className='bg-card/80 border-border/80 mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl border shadow-xl'>
            <Icons.lock className='size-6 text-emerald-500' />
          </div>

          <h1 className='from-foreground via-foreground to-foreground/60 bg-gradient-to-b bg-clip-text text-4xl font-medium tracking-[-0.04em] text-balance text-transparent sm:text-6xl md:leading-[1.04]'>
            Trust, engineered into every layer.
          </h1>

          <p className='text-muted-foreground/90 mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg'>
            Confidential tax returns, audit workpapers, and corporate filings deserve more than checkboxes. Avenra enforces tenant isolation, encryption, and immutable auditability by design.
          </p>

          <div className='mt-9 flex flex-wrap justify-center gap-3.5'>
            <Link
              href='/contact'
              className={cn(buttonVariants(), 'h-11 gap-2 rounded-full px-6 text-sm font-medium shadow-lg')}
            >
              Request security package <Icons.arrowRight className='size-4' />
            </Link>
            <Link
              href='/auth/sign-up'
              className={cn(buttonVariants({ variant: 'outline' }), 'h-11 rounded-full px-6 text-sm')}
            >
              Start free trial
            </Link>
          </div>
        </motion.div>
      </Frame>
      <DottedRule />

      {/* 3 Monolithic Trust KPIs */}
      <Frame className='grid md:grid-cols-3'>
        {[
          { value: 'AES-256', label: 'Encryption at rest & TLS 1.3 in transit' },
          { value: '100%', label: 'Client uploads screened before vaulting' },
          { value: 'SHA-256', label: 'Cryptographic fingerprint on every record' }
        ].map((stat, i) => (
          <div
            key={stat.value}
            className={cn(
              'space-y-2 border-b px-8 py-12 text-center md:border-b-0',
              i < 2 && 'md:border-r'
            )}
          >
            <p className='text-3xl font-medium tracking-tight md:text-4xl'>{stat.value}</p>
            <p className='text-muted-foreground text-sm'>{stat.label}</p>
          </div>
        ))}
      </Frame>
      <DottedRule />

      {/* Interactive Layered Defense Accordion + Vault Preview */}
      <Frame className='grid items-center gap-12 px-6 py-24 md:px-12 lg:grid-cols-[1fr_1.05fr]'>
        <div className='space-y-3'>
          <p className='text-xs font-medium uppercase tracking-[0.18em] text-emerald-500'>
            Defense in Depth
          </p>
          <h2 className='pb-4 text-3xl font-medium tracking-[-0.03em]'>
            Four safeguards protecting every engagement.
          </h2>

          <div className='space-y-2.5'>
            {LAYERS.map((layer) => {
              const isOpen = openLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  className={cn(
                    'rounded-2xl border transition-all',
                    isOpen ? 'bg-card/80 border-border shadow-sm' : 'border-border/60 bg-background/40'
                  )}
                >
                  <button
                    type='button'
                    onClick={() => setOpenLayer(layer.id)}
                    className='flex w-full items-center justify-between px-5 py-4 text-left'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-muted-foreground font-mono text-xs'>{layer.num}</span>
                      <span className='text-sm font-medium md:text-base'>{layer.title}</span>
                    </div>
                    <Icons.chevronDown
                      className={cn(
                        'text-muted-foreground size-4 transition-transform',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className='space-y-3 border-t px-5 py-4'>
                      <p className='text-muted-foreground text-sm leading-relaxed'>{layer.summary}</p>
                      <ul className='space-y-2'>
                        {layer.bullets.map((b) => (
                          <li key={b} className='flex items-center gap-2 text-xs'>
                            <Icons.circleCheck className='size-3.5 shrink-0 text-emerald-500' />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className='bg-card/80 border-border/70 overflow-hidden rounded-2xl border p-2 shadow-2xl'>
          <Image
            src='/landing/evidence-vault.webp'
            alt='Avenra Evidence Vault'
            width={1600}
            height={1000}
            className='h-auto w-full rounded-xl'
          />
        </div>
      </Frame>
    </>
  );
}
