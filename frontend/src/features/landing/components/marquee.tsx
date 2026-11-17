import { Icons } from '@/components/icons';
import { MARQUEE } from '../content';

/** Edge-to-edge strip of capabilities scrolling slowly, cells divided by vertical rules. */
export function CapabilityMarquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className='overflow-hidden border-y' aria-label='Platform capabilities'>
      <div className='landing-marquee flex w-max'>
        {items.map((item, i) => {
          const Icon = Icons[item.icon];
          return (
            <div
              key={`${item.label}-${i}`}
              aria-hidden={i >= MARQUEE.length}
              className='flex h-[68px] w-[225px] shrink-0 items-center justify-center gap-2.5 border-r text-[15px]'
            >
              <Icon className='text-muted-foreground size-4' />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
