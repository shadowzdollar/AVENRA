import Link from 'next/link';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COMPARISON, CTA, INTEGRATIONS, STATS, TRUST } from '../content';
import { Frame, SectionHeading } from './frame';

export function IntegrationsSection() {
  return (
    <Frame id='integrations'>
      <div className='px-6 py-14 md:px-10'>
        <SectionHeading title={INTEGRATIONS.title} description={INTEGRATIONS.description} />
      </div>
      <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
        {INTEGRATIONS.items.map((item, i) => {
          const Icon = Icons[item.icon];
          return (
            <div
              key={item.title}
              className={cn(
                'space-y-3 border-b p-6 md:p-10 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <span className='flex size-10 items-center justify-center rounded-md border'>
                <Icon className='size-5' />
              </span>
              <h3 className='text-lg font-medium'>{item.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

export function StatsSection() {
  return (
    <Frame className='grid md:grid-cols-3'>
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            'space-y-4 border-b px-6 py-12 md:border-b-0 md:px-10',
            i < 2 && 'md:border-r'
          )}
        >
          <p className='text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase'>
            {stat.label}
          </p>
          <p className='text-5xl font-medium tracking-tight'>{stat.value}</p>
          <p className='text-muted-foreground max-w-[360px] leading-relaxed'>{stat.description}</p>
        </div>
      ))}
    </Frame>
  );
}

const TOOL_TONES: Partial<Record<keyof typeof Icons, string>> = {
  brandDropbox: 'text-blue-500',
  mail: 'text-orange-400',
  fileTypeXls: 'text-emerald-500',
  spreadsheet: 'text-emerald-500',
  fileTypePdf: 'text-red-500',
  brandSlack: 'text-fuchsia-400',
  brandWhatsapp: 'text-green-500',
  brandGoogleDrive: 'text-amber-400',
  fileTypeDoc: 'text-sky-500',
  folder: 'text-sky-400',
  calendar: 'text-rose-400',
  messageCircle: 'text-cyan-400'
};

const TOOL_WALL: (keyof typeof Icons)[][] = [
  ['brandDropbox', 'messages', 'chat', 'mail', 'page', 'fileTypeXls', 'fileZip', 'folder'],
  [
    'brandGoogleDrive',
    'spreadsheet',
    'fileTypePdf',
    'brandSlack',
    'logo',
    'brandWhatsapp',
    'phone',
    'calendar',
    'paperclip'
  ],
  ['fileTypeDoc', 'upload', 'post', 'messageCircle', 'send', 'share', 'media', 'clock']
];

export function ComparisonSection() {
  return (
    <Frame className='grid lg:grid-cols-2'>
      <div className='space-y-6 border-b px-6 py-14 md:px-10 lg:border-r lg:border-b-0'>
        <h2 className='text-3xl font-medium tracking-tight text-balance md:text-[2.5rem] md:leading-[1.15]'>
          {COMPARISON.title}
        </h2>
        {COMPARISON.paragraphs.map((p, i) => (
          <p key={i} className='text-muted-foreground leading-relaxed md:text-[17px]'>
            {typeof p === 'string'
              ? p
              : p.map((part, j) =>
                  part.strong ? (
                    <span key={j} className='text-foreground'>
                      {part.text}
                    </span>
                  ) : (
                    <span key={j}>{part.text}</span>
                  )
                )}
          </p>
        ))}
        <p className='font-medium md:text-[17px]'>{COMPARISON.closing}</p>
      </div>
      <div className='relative flex items-center justify-center overflow-hidden py-14'>
        <div className='space-y-4 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]'>
          {TOOL_WALL.map((row, r) => (
            <div key={r} className={cn('flex gap-4', r === 1 && '-ml-10')}>
              {row.map((icon, c) => {
                const center = r === 1 && icon === 'logo';
                if (center) {
                  return (
                    <div
                      key={`${icon}-${c}`}
                      className='bg-background relative z-10 -my-6 flex size-28 shrink-0 items-center justify-center rounded-3xl border-[3px] border-foreground shadow-2xl'
                    >
                      <AvenraIcon size={64} />
                    </div>
                  );
                }
                const Icon = Icons[icon];
                return (
                  <div
                    key={`${icon}-${c}`}
                    className='bg-muted/30 flex size-16 shrink-0 items-center justify-center rounded-xl border'
                  >
                    <Icon className={cn('size-7', TOOL_TONES[icon] ?? 'text-muted-foreground')} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function TrustSection() {
  return (
    <Frame id='trust'>
      <div className='px-6 py-14 md:px-10'>
        <SectionHeading title={TRUST.title} />
      </div>
      <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
        {TRUST.items.map((item, i) => {
          const Icon = Icons[item.icon];
          return (
            <div
              key={item.title}
              className={cn(
                'space-y-3 border-b p-6 md:p-10 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <Icon className='size-6' />
              <h3 className='text-lg font-medium'>{item.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

export function CtaSection() {
  return (
    <Frame id='cta' className='flex flex-col items-center px-6 py-16 text-center'>
      <h2 className='text-3xl font-medium tracking-tight md:text-[2.5rem]'>{CTA.title}</h2>
      <Link href={CTA.action.href} className={cn(buttonVariants(), 'mt-8 h-10 gap-2 px-5')}>
        {CTA.action.label} <Icons.arrowUpRight className='size-4' />
      </Link>
      <p className='text-muted-foreground mt-8 text-sm'>{CTA.note}</p>
    </Frame>
  );
}
