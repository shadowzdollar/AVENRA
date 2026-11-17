import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AcceptInvitation } from '@/features/auth/components/accept-invitation';
import { AuthShell } from '@/features/auth/components/sign-in-view';
import { getSession } from '@/lib/auth/server';

export const metadata: Metadata = {
  title: 'Accept invitation',
  robots: { index: false, follow: false }
};

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function Page(props: PageProps) {
  const { token } = await props.searchParams;
  const user = await getSession();
  if (!user) {
    // Come back here after signing in (or signing up) with the same token.
    const back = `/accept-invitation${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    redirect(`/auth/sign-in?redirect=${encodeURIComponent(back)}`);
  }
  return (
    <AuthShell>
      <Suspense>
        <AcceptInvitation />
      </Suspense>
    </AuthShell>
  );
}
