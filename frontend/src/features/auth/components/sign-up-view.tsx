import { Metadata } from 'next';
import { AuthShell } from './sign-in-view';
import { SignUpForm } from './auth-forms';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Create an Avenra account.'
};

export default function SignUpViewPage() {
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
