import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Frame, Pill } from './frame';

interface PageHeroAction {
  label: string;
  href: string;
}

export function PageHero({
  pill,
  title,
  description,
  primaryAction = { label: 'Start free trial', href: '/auth/sign-up' },
  secondaryAction,
  breadcrumb
}: {
  pill: string;
  title: string;
  description: string;
  primaryAction?: PageHeroAction;
  secondaryAction?: PageHeroAction;
  breadcrumb?: { label: string; href: string };
}) {
  return (
    <Frame className='relative overflow-hidden px-6 py-16 md:px-12 md:py-24'>
      <div
        aria-hidden
        className='pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-cyan-500/10 blur-3xl'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -bottom-24 left-0 size-80 rounded-full bg-indigo-500/10 blur-3xl'
      />
      <div className='relative z-10 max-w-3xl space-y-6'>
        <div className='flex flex-wrap items-center gap-3'>
          {breadcrumb && (
            <Link
              href={breadcrumb.href}
              className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors'
            >
              <Icons.chevronLeft className='size-3.5' />
              {breadcrumb.label}
            </Link>
          )}
          <Pill>{pill}</Pill>
        </div>

        <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.1]'>
          {title}
        </h1>

        <p className='text-muted-foreground max-w-2xl text-base leading-relaxed md:text-lg'>
          {description}
        </p>

        <div className='flex flex-wrap items-center gap-3 pt-2'>
          <Link href={primaryAction.href} className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            {primaryAction.label} <Icons.arrowRight className='size-4' />
          </Link>
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 gap-2 px-5')}
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </div>
    </Frame>
  );
}
