'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

interface GuideSection {
  id: string;
  category: string;
  title: string;
  summary: string;
  steps: { heading: string; detail: string }[];
}

const GUIDES: GuideSection[] = [
  {
    id: 'getting-started',
    category: 'Onboarding',
    title: 'Getting Started with Avenra',
    summary:
      'Set up your firm workspace, invite team members with role-based approvals, and launch your first verified client engagement in under ten minutes.',
    steps: [
      {
        heading: '1. Configure your organization workspace',
        detail:
          'Create your firm profile, add practice offices or entities, and define preparer, reviewer, and partner approval permissions.'
      },
      {
        heading: '2. Build reusable engagement templates',
        detail:
          'Standardize your year-end tax packs, audit PBC lists, or KYC onboarding checklists with required fields and verification rules.'
      },
      {
        heading: '3. Dispatch passwordless client requests',
        detail:
          'Send expiring portal links directly to clients so they can answer questions and upload documents without creating an account.'
      }
    ]
  },
  {
    id: 'verification',
    category: 'Quality Control',
    title: 'Verification Rules & Exception Queue',
    summary:
      'Automate routine completeness checks on every uploaded document and route real discrepancies to designated reviewers with full audit history.',
    steps: [
      {
        heading: '1. Attach rules to any requirement',
        detail:
          'Enforce allowed file types, date range coverage, required fields, and materiality variance thresholds per deliverable.'
      },
      {
        heading: '2. Automatic intake screening',
        detail:
          'Every client upload is screened for malware, fingerprinted with SHA-256, and evaluated against your rules immediately on arrival.'
      },
      {
        heading: '3. Structured exception resolution',
        detail:
          'Reviewers can reject incomplete files to trigger a targeted re-request, or approve an exception by recording a formal justification.'
      }
    ]
  },
  {
    id: 'webhooks-api',
    category: 'Integrations',
    title: 'Enterprise API & Signed Webhooks',
    summary:
      'Connect Avenra to your practice management, billing, and archival systems using our versioned OpenAPI 3.1 interface and HMAC-signed webhooks.',
    steps: [
      {
        heading: '1. Subscribe to lifecycle events',
        detail:
          'Register HTTPS endpoints for engagement completion, client document submission, exception alerts, and expiring request notices.'
      },
      {
        heading: '2. Verify webhook authenticity',
        detail:
          'Validate the X-Avenra-Signature HMAC-SHA256 header using your workspace signing secret and deduplicate using Idempotency-Key.'
      },
      {
        heading: '3. Automate archival exports',
        detail:
          'Configure cloud storage destinations to receive signed completion manifests and verified client evidence packages automatically.'
      }
    ]
  },
  {
    id: 'security-governance',
    category: 'Compliance',
    title: 'Security & Audit Administration',
    summary:
      'Manage multi-tenant isolation, access reviews, AI usage caps, and exportable compliance audit logs for internal and external regulators.',
    steps: [
      {
        heading: '1. Enforce segregation of duties',
        detail:
          'Assign explicit permissions separating work preparation, exception overrides, AI plan approval, and final partner sign-off.'
      },
      {
        heading: '2. Set AI usage & budget guardrails',
        detail:
          'Configure daily organization token caps and require human approval on every AI-proposed engagement plan.'
      },
      {
        heading: '3. Export immutable audit histories',
        detail:
          'Download timestamped evidence logs showing every actor, decision, and cryptographic document fingerprint.'
      }
    ]
  }
];

export function DocsExperience() {
  const [activeId, setActiveId] = useState(GUIDES[0].id);
  const active = GUIDES.find((g) => g.id === activeId) ?? GUIDES[0];

  return (
    <>
      <Frame className='grid lg:grid-cols-[280px_1fr]'>
        {/* Sticky Navigation Sidebar */}
        <aside className='border-b p-6 lg:border-r lg:border-b-0'>
          <p className='text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider'>
            Documentation Guides
          </p>
          <div className='space-y-1.5'>
            {GUIDES.map((guide) => (
              <button
                key={guide.id}
                type='button'
                onClick={() => setActiveId(guide.id)}
                className={cn(
                  'flex w-full flex-col rounded-lg px-3.5 py-2.5 text-left transition-colors',
                  activeId === guide.id
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <span className='text-[11px] font-medium uppercase tracking-wider opacity-70'>
                  {guide.category}
                </span>
                <span className='text-sm font-medium'>{guide.title}</span>
              </button>
            ))}
          </div>

          <div className='mt-8 space-y-2 border-t pt-6 text-xs'>
            <p className='text-muted-foreground font-semibold uppercase tracking-wider'>
              Need assistance?
            </p>
            <p className='text-muted-foreground leading-relaxed'>
              Our implementation specialists help enterprise teams configure templates and integrations.
            </p>
            <Link
              href='/contact'
              className='text-foreground inline-flex items-center gap-1 pt-1 font-medium hover:underline'
            >
              Contact implementation team <Icons.arrowRight className='size-3.5' />
            </Link>
          </div>
        </aside>

        {/* Main Guide Content */}
        <div className='p-6 md:p-12'>
          <Pill>{active.category}</Pill>
          <h1 className='mt-4 text-3xl font-medium tracking-tight md:text-4xl'>{active.title}</h1>
          <p className='text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed'>
            {active.summary}
          </p>

          <div className='mt-10 space-y-5'>
            {active.steps.map((step) => (
              <div key={step.heading} className='bg-card rounded-xl border p-6'>
                <h2 className='text-base font-semibold'>{step.heading}</h2>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{step.detail}</p>
              </div>
            ))}
          </div>

          <div className='mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-8'>
            <p className='text-muted-foreground text-sm'>
              Ready to try this workflow in your own workspace?
            </p>
            <div className='flex flex-wrap gap-3'>
              <Link href='/contact' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
                Request guided onboarding
              </Link>
              <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
                Start 14-day free trial <Icons.arrowRight className='size-4' />
              </Link>
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />
      <Frame className='grid md:grid-cols-3'>
        <Link
          href='/platform'
          className='hover:bg-muted/30 space-y-2 border-b p-6 transition-colors md:border-r md:border-b-0 md:p-8'
        >
          <p className='text-base font-medium'>Platform Tour →</p>
          <p className='text-muted-foreground text-xs'>See screenshots of every Avenra module in action.</p>
        </Link>
        <Link
          href='/security'
          className='hover:bg-muted/30 space-y-2 border-b p-6 transition-colors md:border-r md:border-b-0 md:p-8'
        >
          <p className='text-base font-medium'>Security & Trust Center →</p>
          <p className='text-muted-foreground text-xs'>Review tenant isolation, encryption, and audit guarantees.</p>
        </Link>
        <Link
          href='/contact'
          className='hover:bg-muted/30 space-y-2 p-6 transition-colors md:p-8'
        >
          <p className='text-base font-medium'>Book an Enterprise Demo →</p>
          <p className='text-muted-foreground text-xs'>Speak directly with our solutions architects.</p>
        </Link>
      </Frame>
    </>
  );
}
