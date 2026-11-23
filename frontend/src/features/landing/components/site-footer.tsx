import Link from 'next/link';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { Icons } from '@/components/icons';
import { FOOTER, REPOSITORY_URL } from '../content';
import { Frame } from './frame';

export function SiteFooter() {
  const practices = [...FOOTER.practices, ...FOOTER.practices];
  return (
    <footer>
      <Frame>
        <div className='grid gap-10 px-6 py-12 md:px-12 lg:grid-cols-[1.7fr_1fr_1fr_1fr]'>
          <div className='space-y-5'>
            <span className='flex size-8 items-center justify-center rounded-md border'>
              <AvenraIcon size={20} />
            </span>
            <p className='text-muted-foreground max-w-[380px] leading-relaxed'>{FOOTER.tagline}</p>
            <div className='flex gap-2'>
              <a
                href={REPOSITORY_URL}
                target='_blank'
                rel='noreferrer'
                aria-label='GitHub'
                className='hover:bg-accent flex size-10 items-center justify-center rounded-full border'
              >
                <Icons.github className='size-4' />
              </a>
              <a
                href={`${REPOSITORY_URL}/issues`}
                target='_blank'
                rel='noreferrer'
                aria-label='Report an issue'
                className='hover:bg-accent flex size-10 items-center justify-center rounded-full border'
              >
                <Icons.messages className='size-4' />
              </a>
            </div>
          </div>
          {FOOTER.columns.map((column) => (
            <div key={column.title} className='space-y-4'>
              <p className='text-muted-foreground'>{column.title}</p>
              <ul className='space-y-2.5'>
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        target='_blank'
                        rel='noreferrer'
                        className='hover:underline'
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className='hover:underline'>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className='grid border-t md:grid-cols-[1fr_2fr]'>
          <p className='text-muted-foreground flex items-center px-6 py-6 md:border-r md:px-10'>
            {FOOTER.marqueeTitle}
          </p>
          <div className='overflow-hidden'>
            <div className='landing-marquee flex w-max items-center gap-14 py-6 pr-14'>
              {practices.map((p, i) => {
                const Icon = Icons[p.icon];
                return (
                  <span
                    key={`${p.label}-${i}`}
                    aria-hidden={i >= FOOTER.practices.length}
                    className='flex items-center gap-2 text-lg font-semibold'
                  >
                    <Icon className='size-6' /> {p.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </Frame>
    </footer>
  );
}
