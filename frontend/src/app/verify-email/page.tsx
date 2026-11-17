import { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmail } from '@/features/auth/components/auth-forms';
import { AuthShell } from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Verify email',
  robots: { index: false, follow: false }
};

export default function Page() {
  return (
    <AuthShell>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
