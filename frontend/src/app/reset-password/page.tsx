import { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/auth-forms';
import { AuthShell } from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false }
};

export default function Page() {
  return (
    <AuthShell>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
