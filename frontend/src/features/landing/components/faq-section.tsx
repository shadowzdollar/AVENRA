'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FAQ } from '../content';
import { Frame } from './frame';

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Frame id='faq' className='grid lg:grid-cols-[1fr_2fr]'>
      <div className='space-y-4 border-b px-6 py-14 md:px-10 lg:border-r lg:border-b-0'>
        <h2 className='text-xl font-medium text-balance'>{FAQ.aside.title}</h2>
        <p className='text-muted-foreground text-sm leading-relaxed'>{FAQ.aside.description}</p>
        <a
          href={FAQ.aside.action.href}
          target='_blank'
          rel='noreferrer'
          className={cn(buttonVariants(), 'mt-4 h-10 px-5')}
        >
          {FAQ.aside.action.label}
        </a>
      </div>
      <div>
        {FAQ.items.map((item, i) => {
          const expanded = open === i;
          return (
            <div key={item.q} className={cn(i < FAQ.items.length - 1 && 'border-b')}>
              <h3>
                <button
                  type='button'
                  aria-expanded={expanded}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(expanded ? null : i)}
                  className='flex w-full items-center justify-between gap-6 px-6 py-8 text-left text-lg font-medium md:px-8 md:text-xl'
                >
                  {item.q}
                  {expanded ? (
                    <Icons.x className='size-4 shrink-0' />
                  ) : (
                    <Icons.plus className='size-4 shrink-0' />
                  )}
                </button>
              </h3>
              {expanded && (
                <p
                  id={`faq-${i}`}
                  className='text-muted-foreground -mt-3 px-6 pb-8 leading-relaxed md:px-8'
                >
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/** Floating help bubble (bottom right), jumps to the FAQ. */
export function FloatingHelp() {
  return (
    <Link
      href='#faq'
      aria-label='Questions? Open the FAQ'
      className='bg-foreground text-background fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105'
    >
      <Icons.messageCircle className='size-7' />
    </Link>
  );
}
