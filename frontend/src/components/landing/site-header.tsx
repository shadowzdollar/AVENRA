'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icons } from '@/components/icons';

export function SiteHeader() {
  return (
    <header className='sticky top-0 z-50 w-full border-b border-dashed border-neutral-800/80 bg-black/95 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Left: Brand Logo & Navigation Links */}
        <div className='flex items-center gap-8'>
          <Link href='/' className='flex items-center shrink-0'>
            <div className='relative flex size-9 items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d] transition-all hover:border-neutral-700'>
              <Image
                src='/header-logo.png'
                alt='Shadcn Logo'
                width={36}
                height={36}
                className='object-contain p-1'
                priority
              />
            </div>
          </Link>

          <nav className='hidden md:flex items-center gap-7 text-sm font-medium'>
            <Link
              href='#blocks'
              className='text-neutral-300 transition-colors hover:text-white'
            >
              Blocks
            </Link>

            {/* Templates with dropdown + notification dot */}
            <div className='relative flex items-center gap-1 cursor-pointer text-neutral-300 transition-colors hover:text-white group'>
              <span className='relative'>
                Templates
                <span className='absolute -top-1.5 -right-2 size-2 rounded-full bg-red-500 ring-2 ring-black' />
              </span>
              <Icons.chevronDown className='size-3.5 text-neutral-400 transition-transform group-hover:translate-y-0.5' />
            </div>

            {/* AI Builder with notification dot */}
            <div className='relative flex items-center cursor-pointer text-neutral-300 transition-colors hover:text-white'>
              <span className='relative'>
                AI Builder
                <span className='absolute -top-1.5 -right-2 size-2 rounded-full bg-red-500 ring-2 ring-black' />
              </span>
            </div>

            <Link
              href='#components'
              className='text-neutral-300 transition-colors hover:text-white'
            >
              Components
            </Link>

            <Link
              href='#download'
              className='text-neutral-300 transition-colors hover:text-white'
            >
              Download
            </Link>

            <div className='flex items-center gap-1 cursor-pointer text-neutral-300 transition-colors hover:text-white group'>
              <span>AI Tools</span>
              <Icons.chevronDown className='size-3.5 text-neutral-400 transition-transform group-hover:translate-y-0.5' />
            </div>

            <div className='flex items-center gap-1 cursor-pointer text-neutral-300 transition-colors hover:text-white group'>
              <span>Resources</span>
              <Icons.chevronDown className='size-3.5 text-neutral-400 transition-transform group-hover:translate-y-0.5' />
            </div>
          </nav>
        </div>

        {/* Right: Actions, Log in & CTA Button */}
        <div className='flex items-center gap-2.5'>
          {/* Search Button */}
          <button
            type='button'
            className='flex size-9 items-center justify-center rounded-lg border border-neutral-800 bg-[#0d0d0d] text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white'
            aria-label='Search'
          >
            <Icons.search className='size-4' />
          </button>

          {/* Theme Toggle Button */}
          <button
            type='button'
            className='flex size-9 items-center justify-center rounded-lg border border-neutral-800 bg-[#0d0d0d] text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white'
            aria-label='Toggle theme'
          >
            <Icons.sun className='size-4' />
          </button>

          {/* GitHub Repo Button */}
          <a
            href='https://github.com/shadowzdollar/AVENRA'
            target='_blank'
            rel='noopener noreferrer'
            className='flex size-9 items-center justify-center rounded-lg border border-neutral-800 bg-[#0d0d0d] text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white'
            aria-label='GitHub repository'
          >
            <Icons.github className='size-4' />
          </a>

          {/* Log in Button */}
          <Link
            href='/auth/sign-in'
            className='inline-flex h-9 items-center justify-center rounded-lg border border-neutral-800 bg-[#161616] px-4 text-sm font-medium text-white transition-colors hover:border-neutral-700 hover:bg-[#202020]'
          >
            Log in
          </Link>

          {/* Get all access Button */}
          <Link
            href='/dashboard/overview'
            className='inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black transition-all hover:bg-neutral-200'
          >
            <Icons.pro className='size-4 stroke-[2.2]' />
            Get all access
          </Link>
        </div>
      </div>
    </header>
  );
}
