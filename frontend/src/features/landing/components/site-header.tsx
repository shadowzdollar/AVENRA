'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { Icons } from '@/components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { NAV, SEARCH_ENTRIES } from '../content';

const linkClass = 'text-foreground/90 hover:text-foreground relative text-[15px] transition-colors';

function NewDot() {
  return (
    <span aria-hidden className='absolute -top-0.5 -right-1.5 size-1.5 rounded-full bg-red-500' />
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const iconButton = cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-9 rounded-md');

  return (
    <header className='bg-background/85 sticky top-0 z-40 border-b backdrop-blur'>
      <div className='mx-auto flex h-[78px] max-w-[1348px] items-center gap-8 border-x px-6'>
        <Link
          href='/'
          aria-label='Avenra home'
          className='flex size-9 items-center justify-center rounded-md border'
        >
          <AvenraIcon size={22} />
        </Link>

        <nav aria-label='Main' className='hidden items-center gap-6 lg:flex'>
          {NAV.map((item) =>
            item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger
                  className={cn(linkClass, 'flex items-center gap-1 outline-none')}
                >
                  <span className='relative'>
                    {item.label}
                    {item.isNew && <NewDot />}
                  </span>
                  <Icons.chevronDown className='size-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-72'>
                  <DropdownMenuGroup>
                    {item.children.map((child) => (
                      <DropdownMenuItem
                        key={child.label}
                        className='flex flex-col items-start gap-0.5 py-2'
                        onClick={() => router.push(child.href)}
                      >
                        <span className='font-medium'>{child.label}</span>
                        <span className='text-muted-foreground text-xs'>{child.description}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={item.label} href={item.href} className={linkClass}>
                {item.label}
                {item.isNew && <NewDot />}
              </Link>
            )
          )}
        </nav>

        <div className='ml-auto flex items-center gap-2.5'>
          <button
            type='button'
            aria-label='Search'
            className={iconButton}
            onClick={() => setSearchOpen(true)}
          >
            <Icons.search className='size-4' />
          </button>
          <button
            type='button'
            aria-label='Toggle theme'
            className={cn(iconButton, 'hidden sm:inline-flex')}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Icons.brightness className='size-4' />
          </button>
          {signedIn ? (
            <Link href='/dashboard/overview' className={cn(buttonVariants(), 'h-9 gap-1.5 px-4')}>
              <Icons.dashboard className='size-4' /> Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href='/auth/sign-in'
                className={cn(
                  buttonVariants({ variant: 'secondary' }),
                  'hidden h-9 px-4 sm:inline-flex'
                )}
              >
                Log in
              </Link>
              <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-9 gap-1.5 px-4')}>
                <Icons.crown className='size-4' /> Start free trial
              </Link>
            </>
          )}
          <Sheet>
            <SheetTrigger
              render={<Button variant='outline' size='icon' className='size-9 lg:hidden' />}
            >
              <Icons.ellipsis className='size-4' />
              <span className='sr-only'>Menu</span>
            </SheetTrigger>
            <SheetContent side='right' className='w-80'>
              <SheetHeader>
                <SheetTitle>Avenra</SheetTitle>
              </SheetHeader>
              <nav className='flex flex-col gap-1 px-4'>
                {NAV.flatMap((item) => (item.children ? item.children : [item])).map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className='hover:bg-accent rounded-md px-2 py-2 text-sm'
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder='Search Avenra…' />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading='Jump to'>
            {SEARCH_ENTRIES.map((entry) => (
              <CommandItem
                key={entry.label}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(entry.href);
                }}
              >
                {entry.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
