'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

type Topic = 'Enterprise Demo' | 'Security Review' | 'Pricing & Volume' | 'Support';

const TOPICS: Topic[] = ['Enterprise Demo', 'Security Review', 'Pricing & Volume', 'Support'];
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
    setSubmittedRef(`AVR-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <>
      <Frame className='relative overflow-hidden px-6 py-20 md:px-12 md:py-28'>
        <div
          aria-hidden
          className='pointer-events-none absolute -top-32 right-0 h-[380px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.10),transparent_70%)] blur-2xl'
        />

        <div className='relative z-10 grid items-start gap-16 lg:grid-cols-[0.9fr_1.1fr]'>
          {/* Left Minimalist Editorial Column */}
          <div className='space-y-8 pt-2'>
            <div className='space-y-5'>
              <span className='border-border/70 bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium'>
                Contact Avenra
              </span>
              <h1 className='from-foreground via-foreground to-foreground/60 bg-gradient-to-b bg-clip-text text-4xl font-medium tracking-[-0.04em] text-balance text-transparent md:text-5xl md:leading-[1.06]'>
                Talk to our enterprise team.
              </h1>
              <p className='text-muted-foreground max-w-md text-base leading-relaxed'>
                Book a private walkthrough, request our security package, or design a tailored rollout across your firm’s offices.
              </p>
            </div>

            <div className='space-y-6 border-t pt-8'>
              {[
                {
                  title: 'Under 4-hour response',
                  desc: 'Dedicated solutions architects reply to every inquiry within one business half-day.'
                },
                {
                  title: 'Security & procurement ready',
                  desc: 'Data Processing Addenda (DPA), architecture briefs, and multi-entity licensing.'
                },
                {
                  title: 'White-glove onboarding',
                  desc: 'We help migrate your existing checklists and client intake templates cleanly.'
                }
              ].map((item) => (
                <div key={item.title} className='flex items-start gap-3'>
                  <Icons.circleCheck className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                  <div>
                    <p className='text-sm font-medium'>{item.title}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs leading-relaxed'>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Floating Specular Glass Form Card */}
          <div className='relative'>
            <div className='via-foreground/20 pointer-events-none absolute -top-px right-12 left-12 h-px bg-gradient-to-r from-transparent to-transparent' />
            {submittedRef ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className='bg-card/80 border-border/70 rounded-2xl border p-10 text-center shadow-2xl backdrop-blur-md'
              >
                <div className='mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500'>
                  <Icons.circleCheck className='size-6' />
                </div>
                <p className='text-muted-foreground font-mono text-xs'>REFERENCE · {submittedRef}</p>
                <h2 className='mt-2 text-2xl font-medium tracking-tight'>We’ve received your request</h2>
                <p className='text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed'>
                  Thank you, <strong className='text-foreground'>{fullName}</strong>. Our{' '}
                  <strong className='text-foreground'>{topic}</strong> team will reach out to{' '}
                  <span className='text-foreground'>{workEmail}</span> shortly.
                </p>
                <div className='mt-8 flex flex-wrap justify-center gap-3'>
                  <Link href='/platform' className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full px-5')}>
                    Explore platform
                  </Link>
                  <Link href='/auth/sign-up' className={cn(buttonVariants(), 'gap-2 rounded-full px-5')}>
                    Start free trial <Icons.arrowRight className='size-4' />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className='bg-card/80 border-border/70 space-y-5 rounded-2xl border p-7 shadow-2xl backdrop-blur-md sm:p-10'
              >
                <div>
                  <p className='text-muted-foreground mb-2.5 text-xs font-medium uppercase tracking-wider'>
                    Inquiry Topic
                  </p>
                  <div className='bg-muted/40 border-border/60 inline-flex flex-wrap gap-1 rounded-xl border p-1'>
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => setTopic(t)}
                        className={cn(
                          'relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          topic === t ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {topic === t && (
                          <motion.span
                            layoutId='contact-topic-pill'
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            className='bg-primary absolute inset-0 rounded-lg'
                          />
                        )}
                        <span className='relative z-10'>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-1.5'>
                    <label htmlFor='c-name' className='text-xs font-medium'>
                      Full name
                    </label>
                    <input
                      id='c-name'
                      type='text'
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder='Jordan Ellis'
                      className='bg-background/70 border-border/80 focus:ring-ring h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:ring-2'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label htmlFor='c-email' className='text-xs font-medium'>
                      Work email
                    </label>
                    <input
                      id='c-email'
                      type='email'
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder='jordan@northwindcpa.com'
                      className='bg-background/70 border-border/80 focus:ring-ring h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:ring-2'
                    />
                  </div>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-1.5'>
                    <label htmlFor='c-firm' className='text-xs font-medium'>
                      Firm or organization
                    </label>
                    <input
                      id='c-firm'
                      type='text'
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder='Northwind Advisors LLP'
                      className='bg-background/70 border-border/80 focus:ring-ring h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:ring-2'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label htmlFor='c-size' className='text-xs font-medium'>
                      Team size
                    </label>
                    <select
                      id='c-size'
                      value={firmSize}
                      onChange={(e) => setFirmSize(e.target.value)}
                      className='bg-background/70 border-border/80 focus:ring-ring h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:ring-2'
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
                  <label htmlFor='c-msg' className='text-xs font-medium'>
                    How can we help?
                  </label>
                  <textarea
                    id='c-msg'
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder='Tell us about your practice workflows, timeline, or compliance requirements…'
                    className='bg-background/70 border-border/80 focus:ring-ring w-full rounded-xl border p-3.5 text-sm outline-none focus:ring-2'
                  />
                </div>

                {error && <p className='text-destructive text-xs'>{error}</p>}

                <button
                  type='submit'
                  className={cn(buttonVariants(), 'h-11 w-full gap-2 rounded-xl text-sm font-medium')}
                >
                  Send inquiry <Icons.arrowRight className='size-4' />
                </button>
              </form>
            )}
          </div>
        </div>
      </Frame>
      <DottedRule />
      <Frame className='grid md:grid-cols-3'>
        <div className='space-y-1 border-b px-8 py-8 md:border-r md:border-b-0'>
          <p className='text-muted-foreground text-xs uppercase tracking-wider'>Enterprise Sales</p>
          <p className='text-sm font-medium'>sales@avenra.com</p>
        </div>
        <div className='space-y-1 border-b px-8 py-8 md:border-r md:border-b-0'>
          <p className='text-muted-foreground text-xs uppercase tracking-wider'>Security & Trust</p>
          <p className='text-sm font-medium'>security@avenra.com</p>
        </div>
        <div className='space-y-1 px-8 py-8'>
          <p className='text-muted-foreground text-xs uppercase tracking-wider'>Customer Support</p>
          <p className='text-sm font-medium'>support@avenra.com</p>
        </div>
      </Frame>
    </>
  );
}
