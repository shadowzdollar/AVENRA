import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';
import { AvenraLogo } from '@/components/brand/avenra-logo';
import { Suspense } from 'react';
import { SignInForm } from './auth-forms';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in to Avenra.'
};

/** Split-screen frame shared by every authentication page. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Home
      </Link>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='relative z-20'>
          <AvenraLogo size='lg' showSubtitle={true} subtitleText='AUTONOMOUS WORK ENGINE' />
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-base leading-relaxed text-foreground/90 font-medium'>
              &ldquo;Autonomous accounting execution and continuous compliance with deterministic
              precision. Avenra orchestrates document intake, OCR verification, and cryptographic
              audit hashing with zero guesswork.&rdquo;
            </p>
            <footer className='text-muted-foreground text-xs font-semibold'>
              Avenra Autonomous Work Platform
            </footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SignInViewPage() {
  return (
    <AuthShell>
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
