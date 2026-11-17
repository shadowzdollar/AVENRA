import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HERO } from '../content';
import { Frame, Pill } from './frame';

/** Illustrative mini-widgets layered over the screenshot, like the product's own cards. */
function RequestsCard() {
  const answered = 0.72;
  const circumference = 2 * Math.PI * 30;
  return (
    <div className='bg-card/95 absolute bottom-6 -left-4 hidden w-[270px] rounded-xl border p-4 text-left shadow-2xl backdrop-blur md:block xl:-left-20'>
      <p className='text-sm font-medium'>Requests answered</p>
      <div className='mt-3 flex items-end justify-between'>
        <div>
          <p className='text-2xl font-semibold tabular-nums'>72%</p>
          <p className='text-muted-foreground text-xs'>
            <span className='rounded bg-emerald-500/15 px-1 text-emerald-500'>+9%</span> this month
          </p>
        </div>
        <svg viewBox='0 0 80 80' className='size-20 -rotate-90' aria-hidden>
          <circle cx='40' cy='40' r='30' fill='none' strokeWidth='8' className='stroke-muted' />
          <circle
            cx='40'
            cy='40'
            r='30'
            fill='none'
            strokeWidth='8'
            strokeLinecap='round'
            stroke='url(#hero-ring)'
            strokeDasharray={`${circumference * answered} ${circumference}`}
          />
          <defs>
            <linearGradient id='hero-ring' x1='0' x2='1'>
              <stop offset='0%' stopColor='#10b981' />
              <stop offset='100%' stopColor='#3b82f6' />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className='text-muted-foreground mt-3 flex gap-4 text-xs'>
        <span className='flex items-center gap-1.5'>
          <span className='size-1.5 rounded-full bg-emerald-500' /> Answered
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='size-1.5 rounded-full bg-blue-500' /> Reminded
        </span>
      </div>
    </div>
  );
}

function WeeklyCard() {
  const bars = [38, 64, 92, 45, 70, 52, 30];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className='bg-card/95 absolute top-24 -right-4 hidden w-[200px] rounded-xl border p-4 text-left shadow-2xl backdrop-blur md:block xl:-right-20'>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-medium'>Work completed</p>
        <span className='text-muted-foreground text-xs'>⋮</span>
      </div>
      <p className='mt-3 text-lg font-semibold tabular-nums'>
        24 <span className='rounded bg-emerald-500/15 px-1 text-[10px] text-emerald-500'>+6</span>
      </p>
      <p className='text-muted-foreground text-[10px]'>Last 7 days</p>
      <div className='mt-3 flex h-28 items-end justify-between gap-1.5'>
        {bars.map((h, i) => (
          <div key={days[i]} className='flex h-full flex-1 flex-col items-center justify-end gap-1'>
            <div
              className={cn('w-full rounded-full', i === 2 ? 'bg-blue-500' : 'bg-blue-500/25')}
              style={{ height: `${Math.round(h * 0.9)}px` }}
            />
            <span className='text-muted-foreground text-[8px]'>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <Frame className='relative overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(60%_80%_at_0%_100%,rgba(59,130,246,0.18),transparent),radial-gradient(60%_80%_at_100%_100%,rgba(234,179,8,0.10),transparent)]'
      />
      <div className='relative flex flex-col items-center px-6 pt-14 text-center md:pt-[52px]'>
        <div className='flex flex-wrap justify-center gap-2.5'>
          {HERO.pills.map((pill) => (
            <Pill key={pill}>{pill}</Pill>
          ))}
        </div>
        <h1 className='mt-5 max-w-4xl text-4xl font-medium tracking-tight text-balance sm:text-5xl md:text-[3.25rem] md:leading-[1.08]'>
          {HERO.title}
        </h1>
        <p className='text-muted-foreground mt-6 max-w-[740px] text-base leading-relaxed md:text-[17px]'>
          {HERO.description.map((part, i) =>
            part.strong ? (
              <strong key={i} className='text-foreground font-medium'>
                {part.text}
              </strong>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </p>
        <div className='mt-7 flex flex-wrap justify-center gap-4'>
          <Link href={HERO.primary.href} className={cn(buttonVariants(), 'h-10 px-5 text-[15px]')}>
            {HERO.primary.label}
          </Link>
          <Link
            href={HERO.secondary.href}
            className='rounded-lg bg-[linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6,#f59e0b)] p-px'
          >
            <span className='bg-background hover:bg-accent flex h-[38px] items-center rounded-[7px] px-5 text-[15px] font-medium'>
              {HERO.secondary.label}
            </span>
          </Link>
        </div>

        <div className='relative mt-16 w-full max-w-[1040px]'>
          <div className='bg-card overflow-hidden rounded-t-xl border border-b-0 p-1.5 pb-0 shadow-2xl'>
            <Image
              src='/landing/command-center.webp'
              alt='Avenra Command Center showing active work, verification pass rate, client requests and the exception queue'
              width={2880}
              height={1800}
              priority
              className='h-auto w-full rounded-t-lg'
            />
          </div>
          <RequestsCard />
          <WeeklyCard />
        </div>
      </div>
    </Frame>
  );
}
