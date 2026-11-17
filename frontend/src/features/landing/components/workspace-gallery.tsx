'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WORKSPACE } from '../content';
import { Frame, Pill } from './frame';

export function WorkspaceGallery() {
  const [active, setActive] = useState(WORKSPACE.tabs[0].id);
  const tab = WORKSPACE.tabs.find((t) => t.id === active) ?? WORKSPACE.tabs[0];

  return (
    <Frame id='workspace'>
      <div className='grid gap-10 px-6 py-16 md:px-10 lg:grid-cols-[1.4fr_1fr] lg:items-end'>
        <div className='space-y-6'>
          <Pill>{WORKSPACE.pill}</Pill>
          <h2 className='max-w-[680px] text-3xl font-medium tracking-tight text-balance md:text-[2.5rem] md:leading-[1.15]'>
            {WORKSPACE.title}
          </h2>
          <div className='flex max-w-[660px] flex-wrap gap-2'>
            {WORKSPACE.badges.map((badge) => {
              const Icon = Icons[badge.icon];
              return (
                <span
                  key={badge.label}
                  className='bg-background flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm'
                >
                  <Icon className='text-muted-foreground size-4' />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className='space-y-6'>
          <p className='text-muted-foreground leading-relaxed md:text-[17px]'>
            {WORKSPACE.description.map((part, i) =>
              part.strong ? (
                <strong key={i} className='text-foreground font-medium'>
                  {part.text}
                </strong>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </p>
          <div className='flex flex-wrap gap-3'>
            {WORKSPACE.actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(buttonVariants({ variant: action.variant }), 'h-10 px-5')}
                {...(action.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div
        role='tablist'
        aria-label='Workspace areas'
        className='grid grid-cols-2 border-y sm:grid-cols-5'
      >
        {WORKSPACE.tabs.map((t, i) => {
          const Icon = Icons[t.icon];
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              role='tab'
              type='button'
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className={cn(
                'flex h-16 items-center justify-center gap-2.5 text-[17px] transition-colors',
                i < WORKSPACE.tabs.length - 1 && 'sm:border-r',
                selected
                  ? 'bg-muted/50 text-foreground border-t-foreground -mt-px border-t-2 font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className='size-4' />
              {t.label}
            </button>
          );
        })}
      </div>

      <div role='tabpanel' className='grid gap-6 px-6 py-10 sm:grid-cols-2 md:px-10 lg:grid-cols-3'>
        {tab.items.map((item) => (
          <Link
            key={item.title}
            href='/auth/sign-up'
            className='group bg-card overflow-hidden rounded-sm border transition-colors hover:border-foreground/30'
          >
            <div className='bg-muted/40 overflow-hidden'>
              <Image
                src={item.image}
                alt={`${item.title} screen in Avenra`}
                width={2880}
                height={1800}
                className='aspect-[29/20] h-auto w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]'
              />
            </div>
            <div className='flex items-center justify-between border-t px-5 py-5'>
              <span className='text-[17px]'>{item.title}</span>
              <Icons.arrowUpRight className='size-4' />
            </div>
          </Link>
        ))}
      </div>
    </Frame>
  );
}
