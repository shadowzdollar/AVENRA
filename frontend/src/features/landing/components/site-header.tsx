'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {NAV.map((item) => {
            const isActive = item.children
              ? item.children.some((c) => pathname === c.href)
              : pathname === item.href;

            return item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger
                  className={cn(
                    linkClass,
                    'flex items-center gap-1 outline-none',
                    isActive && 'text-foreground font-medium'
                  )}
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
                        className={cn(
                          'flex flex-col items-start gap-0.5 py-2',
                          pathname === child.href && 'bg-accent'
                        )}
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
              <Link
                key={item.label}
                href={item.href}
                className={cn(linkClass, isActive && 'text-foreground font-medium')}
              >
                {item.label}
                {item.isNew && <NewDot />}
              </Link>
            );
          })}
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
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant='outline' size='icon' className='size-9 lg:hidden' />}
            >
              <Icons.ellipsis className='size-4' />
              <span className='sr-only'>Menu</span>
            </SheetTrigger>
            <SheetContent side='right' className='w-80 overflow-y-auto'>
              <SheetHeader>
                <SheetTitle>Avenra</SheetTitle>
              </SheetHeader>
              <nav className='flex flex-col gap-1 px-4 pb-6'>
                {NAV.flatMap((item) => (item.children ? item.children : [item])).map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'hover:bg-accent rounded-md px-2 py-2 text-sm transition-colors',
                      pathname === item.href && 'bg-accent font-medium'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        className='border-border/80 bg-popover/95 max-w-xl shadow-2xl backdrop-blur-xl'
      >
        <div className='relative'>
          <CommandInput placeholder='Search platform, solutions, docs, or actions…' />
          <kbd className='bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-block'>
            ESC
          </kbd>
        </div>
        <CommandList className='max-h-[380px] p-1.5'>
          <CommandEmpty className='py-10 text-center'>
            <p className='text-sm font-medium'>No matching pages or actions</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Try searching for “pricing”, “security”, “agent”, or “audit”.
            </p>
          </CommandEmpty>

          <CommandGroup heading='Quick actions'>
            <CommandItem
              onSelect={() => {
                setSearchOpen(false);
                router.push('/auth/sign-up');
              }}
              className='flex items-center justify-between rounded-lg px-3 py-2.5'
            >
              <div className='flex items-center gap-3'>
                <span className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
                  <Icons.sparkles className='size-4' />
                </span>
                <div>
                  <p className='text-sm font-medium'>Start 14-day free trial</p>
                  <p className='text-muted-foreground text-xs'>Create a firm workspace with zero card required</p>
                </div>
              </div>
              <Icons.arrowRight className='text-muted-foreground size-3.5' />
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setSearchOpen(false);
                router.push(signedIn ? '/dashboard/overview' : '/auth/sign-in');
              }}
              className='flex items-center justify-between rounded-lg px-3 py-2.5'
            >
              <div className='flex items-center gap-3'>
                <span className='bg-muted flex size-8 items-center justify-center rounded-md'>
                  <Icons.dashboard className='size-4' />
                </span>
                <div>
                  <p className='text-sm font-medium'>
                    {signedIn ? 'Open dashboard' : 'Log in to workspace'}
                  </p>
                  <p className='text-muted-foreground text-xs'>Jump directly into your engagements</p>
                </div>
              </div>
              <Icons.arrowRight className='text-muted-foreground size-3.5' />
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                setSearchOpen(false);
              }}
              className='flex items-center justify-between rounded-lg px-3 py-2.5'
            >
              <div className='flex items-center gap-3'>
                <span className='bg-muted flex size-8 items-center justify-center rounded-md'>
                  <Icons.brightness className='size-4' />
                </span>
                <div>
                  <p className='text-sm font-medium'>
                    Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
                  </p>
                  <p className='text-muted-foreground text-xs'>Toggle interface appearance</p>
                </div>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading='Explore Avenra'>
            {SEARCH_ENTRIES.filter(
              (e) => e.href !== '/auth/sign-up' && e.href !== '/auth/sign-in'
            ).map((entry) => (
              <CommandItem
                key={entry.label}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(entry.href);
                }}
                className='flex items-center justify-between rounded-lg px-3 py-2'
              >
                <span className='text-sm'>{entry.label}</span>
                <span className='text-muted-foreground font-mono text-[11px]'>{entry.href}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className='bg-muted/30 text-muted-foreground flex items-center justify-between border-t px-4 py-2.5 text-[11px]'>
          <div className='flex items-center gap-3'>
            <span className='flex items-center gap-1'>
              <kbd className='bg-background rounded border px-1 font-mono'>↑↓</kbd> Navigate
            </span>
            <span className='flex items-center gap-1'>
              <kbd className='bg-background rounded border px-1 font-mono'>↵</kbd> Open
            </span>
          </div>
          <span className='font-mono'>⌘K Search</span>
        </div>
      </CommandDialog>
    </header>
  );
}
