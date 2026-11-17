'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth/types';
import { ApiError } from '@/lib/api-client';
import { acceptInvitation } from '@/features/organizations/api/service';

export function AcceptInvitation() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setError('This invitation link is incomplete.');
      return;
    }
    acceptInvitation(token)
      .then((membership) => {
        document.cookie = `${ACTIVE_ORG_COOKIE}=${membership.organization.id}; Path=/; Max-Age=31536000; SameSite=Lax`;
        router.replace('/dashboard/overview');
        router.refresh();
      })
      .catch((e: unknown) =>
        setError(
          e instanceof ApiError && e.code === 'INVALID_TOKEN'
            ? 'This invitation is invalid, expired, or meant for a different email address.'
            : e instanceof Error
              ? e.message
              : 'The invitation could not be accepted.'
        )
      );
  }, [token, router]);

  return (
    <div className='bg-card w-full rounded-xl border p-6 shadow-sm sm:p-8'>
      <h1 className='text-xl font-semibold tracking-tight'>
        {error ? 'Invitation not accepted' : 'Joining workspace…'}
      </h1>
      <p className='text-muted-foreground mt-2 text-sm'>
        {error ?? 'One moment while we add you to the team.'}
      </p>
      {error && (
        <Link
          href='/dashboard'
          className='mt-6 inline-block text-sm font-medium underline-offset-4 hover:underline'
        >
          Go to dashboard
        </Link>
      )}
    </div>
  );
}
