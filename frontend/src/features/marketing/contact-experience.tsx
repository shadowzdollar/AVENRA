'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

type Topic = 'Enterprise Demo' | 'Security & Compliance' | 'Pricing & Procurement' | 'General Support';

const TOPICS: Topic[] = [
  'Enterprise Demo',
  'Security & Compliance',
  'Pricing & Procurement',
  'General Support'
];

const FIRM_SIZES = ['1–10 professionals', '11–50 professionals', '51–250 professionals', '250+ professionals'];

export function ContactExperience() {
  const [topic, setTopic] = useState<Topic>('Enterprise Demo');
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [firmName, setFirmName] = useState('');
  const [firmSize, setFirmSize] = useState(FIRM_SIZES[1]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !workEmail.trim() || !firmName.trim()) {
      setError('Please complete your name, work email, and firm name.');
      return;
    }
    if (!workEmail.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }
    setError(null);
    const refId = `AVR-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(refId);
  };

  return (
    <>
      <Frame className='grid lg:grid-cols-[0.95fr_1.05fr]'>
        {/* Left Column: Executive Context & SLAs */}
        <div className='flex flex-col justify-between space-y-10 border-b px-6 py-16 md:px-12 lg:border-r lg:border-b-0 lg:py-20'>
          <div className='space-y-6'>
            <div>
              <Pill>Contact Avenra</Pill>
            </div>
            <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
              Speak with our enterprise advisory team
            </h1>
            <p className='text-muted-foreground max-w-lg text-base leading-relaxed'>
              Whether you are evaluating Avenra for a 20-person tax practice or rolling out standardized audit intake across multiple offices, our specialists will walk you through a tailored deployment plan.
            </p>
          </div>

          <div className='space-y-5 border-t pt-8'>
            <div className='flex items-start gap-3.5'>
              <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                <Icons.clock className='size-4' />
              </span>
              <div>
                <h2 className='text-sm font-semibold'>Under 4-hour enterprise response</h2>
                <p className='text-muted-foreground mt-0.5 text-sm'>
                  Dedicated solutions architects respond to every firm inquiry within one business half-day.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                <Icons.lock className='size-4' />
              </span>
              <div>
                <h2 className='text-sm font-semibold'>Security & procurement packages</h2>
                <p className='text-muted-foreground mt-0.5 text-sm'>
                  Request our security architecture brief, Data Processing Addendum (DPA), and multi-entity licensing options.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                <Icons.users className='size-4' />
              </span>
              <div>
                <h2 className='text-sm font-semibold'>Guided firm onboarding</h2>
                <p className='text-muted-foreground mt-0.5 text-sm'>
                  White-glove template migration from legacy spreadsheets, portals, and email checklists.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Enterprise Contact Form */}
        <div className='bg-muted/15 flex items-center justify-center p-6 md:p-12'>
          {submittedRef ? (
            <div className='bg-card w-full max-w-lg rounded-2xl border p-8 text-center shadow-sm'>
              <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500'>
                <Icons.circleCheck className='size-6' />
              </div>
              <p className='text-muted-foreground font-mono text-xs'>REFERENCE · {submittedRef}</p>
              <h2 className='mt-2 text-2xl font-semibold tracking-tight'>Inquiry received</h2>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                Thank you, <strong className='text-foreground'>{fullName}</strong>. Our{' '}
                <strong className='text-foreground'>{topic}</strong> team has received your request for{' '}
                <strong className='text-foreground'>{firmName}</strong> and will reach out to{' '}
                <span className='text-foreground'>{workEmail}</span> shortly.
              </p>
              <div className='mt-8 flex flex-wrap justify-center gap-3'>
                <Link href='/platform' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
                  Explore the platform
                </Link>
                <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
                  Start 14-day free trial <Icons.arrowRight className='size-4' />
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className='bg-card w-full max-w-lg space-y-5 rounded-2xl border p-7 shadow-sm sm:p-9'
            >
              <div>
                <p className='text-sm font-medium'>How can we help your firm?</p>
                <div className='mt-2.5 flex flex-wrap gap-2'>
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type='button'
                      onClick={() => setTopic(t)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        topic === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <label htmlFor='contact-name' className='text-xs font-medium'>
                    Full name *
                  </label>
                  <input
                    id='contact-name'
                    type='text'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder='Jordan Ellis'
                    className='bg-background border-input focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2'
                  />
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='contact-email' className='text-xs font-medium'>
                    Work email *
                  </label>
                  <input
                    id='contact-email'
                    type='email'
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder='jordan@northwindcpa.com'
                    className='bg-background border-input focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2'
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <label htmlFor='contact-firm' className='text-xs font-medium'>
                    Firm or organization *
                  </label>
                  <input
                    id='contact-firm'
                    type='text'
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder='Northwind Advisors LLP'
                    className='bg-background border-input focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2'
                  />
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='contact-size' className='text-xs font-medium'>
                    Team size
                  </label>
                  <select
                    id='contact-size'
                    value={firmSize}
                    onChange={(e) => setFirmSize(e.target.value)}
                    className='bg-background border-input focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2'
                  >
                    {FIRM_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='space-y-1.5'>
                <label htmlFor='contact-message' className='text-xs font-medium'>
                  Tell us about your practice and timeline
                </label>
                <textarea
                  id='contact-message'
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='Share your primary workflows (tax, audit, legal onboarding, advisory) and any security or integration requirements…'
                  className='bg-background border-input focus:ring-ring w-full rounded-lg border p-3 text-sm outline-none focus:ring-2'
                />
              </div>

              {error && <p className='text-destructive text-xs'>{error}</p>}

              <button
                type='submit'
                className={cn(buttonVariants(), 'h-11 w-full gap-2 rounded-xl text-sm font-medium')}
              >
                Submit inquiry <Icons.arrowRight className='size-4' />
              </button>

              <p className='text-muted-foreground text-center text-xs'>
                Prefer to evaluate immediately?{' '}
                <Link href='/auth/sign-up' className='text-foreground font-medium hover:underline'>
                  Start a 14-day free trial
                </Link>
              </p>
            </form>
          )}
        </div>
      </Frame>
      <DottedRule />
      <Frame className='grid md:grid-cols-3'>
        <div className='space-y-1.5 border-b p-6 md:border-r md:border-b-0 md:p-8'>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>Sales & Demos</p>
          <p className='text-base font-medium'>sales@avenra.com</p>
          <p className='text-muted-foreground text-xs'>Tailored walkthroughs for accounting, audit, and legal teams.</p>
        </div>
        <div className='space-y-1.5 border-b p-6 md:border-r md:border-b-0 md:p-8'>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>Security & Trust</p>
          <p className='text-base font-medium'>security@avenra.com</p>
          <p className='text-muted-foreground text-xs'>Compliance documentation, DPAs, and architecture reviews.</p>
        </div>
        <div className='space-y-1.5 p-6 md:p-8'>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>Customer Support</p>
          <p className='text-base font-medium'>support@avenra.com</p>
          <p className='text-muted-foreground text-xs'>Dedicated onboarding and workspace administration help.</p>
        </div>
      </Frame>
    </>
  );
}
