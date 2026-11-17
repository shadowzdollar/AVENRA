import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AGENT } from '../content';
import { Frame, Pill } from './frame';

export function AgentSection() {
  return (
    <Frame id='agent' className='grid lg:grid-cols-2'>
      <div className='space-y-6 border-b px-6 py-14 md:px-10 lg:border-r lg:border-b-0'>
        <Pill>{AGENT.pill}</Pill>
        <h2 className='max-w-[560px] text-3xl font-medium tracking-tight text-balance md:text-[2.5rem] md:leading-[1.15]'>
          {AGENT.title}
        </h2>
        <p className='text-muted-foreground max-w-[590px] leading-relaxed md:text-[17px]'>
          {AGENT.description}
        </p>
        <div className='flex max-w-[480px] flex-wrap gap-2'>
          {AGENT.chips.map((chip) => (
            <span
              key={chip}
              className='bg-background flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm'
            >
              <Icons.check className='size-4 text-emerald-500' />
              {chip}
            </span>
          ))}
        </div>
        <Link href={AGENT.cta.href} className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
          {AGENT.cta.label} <Icons.arrowRight className='size-4' />
        </Link>
      </div>
      <div className='relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[radial-gradient(80%_70%_at_40%_20%,color-mix(in_oklab,var(--foreground)_22%,transparent),transparent)]'>
        <div className='w-[92%] -rotate-3 skew-y-1 overflow-hidden rounded-xl border shadow-2xl [transform:perspective(1200px)_rotateX(18deg)_rotateZ(-4deg)]'>
          <Image
            src={AGENT.image}
            alt='Avenra Agent Intelligence proposing a plan that waits for approval'
            width={2880}
            height={1800}
            className='h-auto w-full'
          />
        </div>
        <div
          aria-hidden
          className='from-background absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t'
        />
      </div>
    </Frame>
  );
}
