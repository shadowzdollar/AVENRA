import { cn } from '@/lib/utils';

/** The bordered page column every section sits in (vertical rules at both edges). */
export function Frame({
  className,
  children,
  id
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className='scroll-mt-20'>
      <div className={cn('mx-auto w-full max-w-[1348px] border-x', className)}>{children}</div>
    </section>
  );
}

/** Full-width separator: solid rule, dotted band, solid rule. */
export function DottedRule() {
  return (
    <div aria-hidden className='border-y'>
      <div className='mx-auto h-4 max-w-[1348px] border-x px-3'>
        <div className='landing-dots h-full opacity-70' />
      </div>
    </div>
  );
}

/** Small rounded pill with a green status dot. */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'bg-background/60 text-foreground inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm',
        className
      )}
    >
      <span className='size-1.5 rounded-full bg-emerald-500' />
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  description,
  className
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('max-w-5xl space-y-4', className)}>
      <h2 className='text-3xl font-medium tracking-tight text-balance md:text-[2.5rem] md:leading-[1.15]'>
        {title}
      </h2>
      {description && (
        <p className='text-muted-foreground max-w-[720px] text-base leading-relaxed md:text-lg'>
          {description}
        </p>
      )}
    </div>
  );
}
