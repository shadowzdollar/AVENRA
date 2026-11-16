'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className='relative overflow-hidden pt-12 md:pt-16 lg:pt-20'>
      {/* Background Subtle Dotted Grid */}
      <div
        className='pointer-events-none absolute inset-0 -z-10 opacity-30'
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Three Feature Pills */}
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <div className='inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#0a0a0a] px-3.5 py-1 text-xs sm:text-sm font-normal text-neutral-300 shadow-sm'>
            <span className='size-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]' />
            Open Source
          </div>

          <div className='inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#0a0a0a] px-3.5 py-1 text-xs sm:text-sm font-normal text-neutral-300 shadow-sm'>
            <span className='size-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]' />
            209+ Blocks &amp; 440+ Components
          </div>

          <div className='inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#0a0a0a] px-3.5 py-1 text-xs sm:text-sm font-normal text-neutral-300 shadow-sm'>
            <span className='size-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]' />
            Lifetime Updates
          </div>
        </div>

        {/* Hero Title */}
        <div className='mt-8 text-center'>
          <h1 className='mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4rem] leading-[1.12]'>
            Build admin panel better with the
            <br />
            complete shadcn dashboard kit
          </h1>

          {/* Subheading */}
          <p className='mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-neutral-400 sm:text-base md:text-lg'>
            A production-ready{' '}
            <span className='font-semibold text-neutral-200'>
              shadcn dashboard kit
            </span>{' '}
            with reusable UI blocks, components, and built-in AI prompts for React,
            Next.js, TypeScript, Tailwind CSS, and Supabase. Built on{' '}
            <span className='font-semibold text-neutral-200'>
              Base UI primitives
            </span>{' '}
            for modern, scalable applications.
          </p>

          {/* CTA Buttons */}
          <div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
            <Link
              href='/dashboard/overview'
              className='inline-flex h-11 items-center justify-center rounded-lg bg-white px-7 text-sm font-semibold text-black transition-all hover:bg-neutral-200 shadow-lg'
            >
              Explore More
            </Link>

            <Link
              href='/dashboard/overview'
              className='group relative inline-flex h-11 items-center justify-center rounded-lg border border-blue-500/80 bg-black px-7 text-sm font-semibold text-white shadow-[0_0_12px_rgba(59,130,246,0.35)] transition-all hover:border-blue-400 hover:shadow-[0_0_16px_rgba(59,130,246,0.5)]'
            >
              Generate with AI Builder
            </Link>
          </div>
        </div>

        {/* Dashboard Showcase Preview Mockup */}
        <div className='relative mt-12 md:mt-16 flex justify-center'>
          {/* Subtle Top Ambient Lighting */}
          <div className='absolute -top-10 left-1/2 -z-10 h-32 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl' />

          <div className='relative w-full max-w-6xl overflow-hidden rounded-t-xl border-t border-x border-neutral-800/80 bg-[#070707] shadow-2xl'>
            <Image
              src='/hero-showcase.png'
              alt='Shadcn Dashboard Kit Interactive Showcase'
              width={1570}
              height={376}
              className='w-full object-cover object-top'
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
