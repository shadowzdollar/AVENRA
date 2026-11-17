'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { ApiError, api, unwrap, unwrapEmpty } from '@/lib/api-client';
import { useAppForm } from '@/lib/form';

// --- Shared --------------------------------------------------------------------------------

function AuthCard({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className='bg-card text-card-foreground w-full rounded-xl border p-6 shadow-sm sm:p-8'>
      <div className='mb-6 space-y-1.5'>
        <h1 className='text-xl font-semibold tracking-tight'>{title}</h1>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      {children}
      {footer && <div className='text-muted-foreground mt-6 text-center text-sm'>{footer}</div>}
    </div>
  );
}

/** Only same-site paths are followed after sign-in (no open redirects). */
function safeRedirect(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard/overview';
}

function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email or password is incorrect.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Verify your email address first. We sent you a link when you signed up.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Wait a minute and try again.';
    case 'INVALID_MFA_CODE':
      return 'That code is not valid. Try again.';
    case 'INVALID_TOKEN':
      return 'This link is invalid or has expired. Request a new one.';
    default:
      return error.details?.[0]?.problem ?? error.message;
  }
}

const email = z.email({ message: 'Enter a valid email address' }).max(254);
const newPassword = z
  .string()
  .min(12, { message: 'Use at least 12 characters' })
  .max(128, { message: 'Use at most 128 characters' });

// --- Sign in -------------------------------------------------------------------------------

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    router.replace(safeRedirect(params.get('redirect')));
    router.refresh();
  };

  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validators: {
      onSubmit: z.object({ email, password: z.string().min(1, 'Enter your password') })
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const result = await unwrap(api.POST('/api/v1/auth/sign-in', { body: value }));
        if (result.status === 'MFA_REQUIRED' && result.mfaChallengeId) {
          setChallengeId(result.mfaChallengeId);
          return;
        }
        finish();
      } catch (e) {
        setError(messageFor(e));
      }
    }
  });

  const mfaForm = useAppForm({
    defaultValues: { code: '' },
    validators: {
      onSubmit: z.object({
        code: z
          .string()
          .regex(
            /^[0-9]{6}$|^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/,
            'Enter the 6-digit code or a recovery code'
          )
      })
    },
    onSubmit: async ({ value }) => {
      if (!challengeId) return;
      setError(null);
      try {
        await unwrap(
          api.POST('/api/v1/auth/sign-in/mfa', {
            body: { mfaChallengeId: challengeId, code: value.code }
          })
        );
        finish();
      } catch (e) {
        setError(messageFor(e));
      }
    }
  });

  if (challengeId) {
    return (
      <AuthCard
        title='Two-step verification'
        description='Enter the code from your authenticator app, or one of your recovery codes.'
      >
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            void mfaForm.handleSubmit();
          }}
        >
          <FieldGroup>
            <mfaForm.AppField
              name='code'
              children={(field) => (
                <field.TextField
                  label='Code'
                  autoComplete='one-time-code'
                  inputMode='text'
                  autoFocus
                />
              )}
            />
          </FieldGroup>
          {error && <p className='text-destructive text-sm'>{error}</p>}
          <mfaForm.Subscribe selector={(s) => s.isSubmitting}>
            {(submitting) => (
              <LoadingButton loading={submitting} type='submit' className='w-full'>
                Verify and sign in
              </LoadingButton>
            )}
          </mfaForm.Subscribe>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='Sign in to Avenra'
      description='Welcome back. Sign in to continue to your workspace.'
      footer={
        <>
          New to Avenra?{' '}
          <Link
            href='/auth/sign-up'
            className='text-foreground font-medium underline-offset-4 hover:underline'
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='email'
            children={(field) => (
              <field.TextField
                label='Email'
                type='email'
                autoComplete='email'
                placeholder='you@firm.com'
              />
            )}
          />
          <form.AppField
            name='password'
            children={(field) => (
              <field.TextField label='Password' type='password' autoComplete='current-password' />
            )}
          />
        </FieldGroup>
        <div className='flex justify-end'>
          <Link
            href='/auth/forgot-password'
            className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className='text-destructive text-sm'>{error}</p>}
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <LoadingButton loading={submitting} type='submit' className='w-full'>
              Sign in
            </LoadingButton>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}

// --- Sign up -------------------------------------------------------------------------------

export function SignUpForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { displayName: '', email: '', password: '' },
    validators: {
      onSubmit: z.object({
        displayName: z.string().trim().min(1, 'Enter your name').max(100),
        email,
        password: newPassword
      })
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await unwrapEmpty(
          api.POST('/api/v1/auth/sign-up', {
            body: { ...value, displayName: value.displayName.trim() }
          })
        );
        setSentTo(value.email);
      } catch (e) {
        setError(messageFor(e));
      }
    }
  });

  if (sentTo) {
    return (
      <AuthCard
        title='Check your email'
        description={`If ${sentTo} can be registered, a verification link is on its way. Open it to activate your account.`}
        footer={
          <Link
            href='/auth/sign-in'
            className='text-foreground font-medium underline-offset-4 hover:underline'
          >
            Back to sign in
          </Link>
        }
      >
        <ResendVerification email={sentTo} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='Create your Avenra account'
      description='Start turning client requests into verified, completed work.'
      footer={
        <>
          Already have an account?{' '}
          <Link
            href='/auth/sign-in'
            className='text-foreground font-medium underline-offset-4 hover:underline'
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='displayName'
            children={(field) => <field.TextField label='Full name' autoComplete='name' />}
          />
          <form.AppField
            name='email'
            children={(field) => (
              <field.TextField
                label='Work email'
                type='email'
                autoComplete='email'
                placeholder='you@firm.com'
              />
            )}
          />
          <form.AppField
            name='password'
            children={(field) => (
              <field.TextField
                label='Password'
                type='password'
                autoComplete='new-password'
                description='At least 12 characters.'
              />
            )}
          />
        </FieldGroup>
        {error && <p className='text-destructive text-sm'>{error}</p>}
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <LoadingButton loading={submitting} type='submit' className='w-full'>
              Create account
            </LoadingButton>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}

function ResendVerification({ email: address }: { email: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <LoadingButton
      variant='outline'
      className='w-full'
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await unwrapEmpty(
            api.POST('/api/v1/auth/email-verification/resend', { body: { email: address } })
          );
          toast.success('If the account exists and is unverified, a new link was sent.');
        } catch (e) {
          toast.error(messageFor(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      Resend verification email
    </LoadingButton>
  );
}

// --- Email verification (link target: /verify-email?token=…) ---------------------------------

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'pending' | 'done' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState('failed');
      setError('This verification link is incomplete.');
      return;
    }
    unwrapEmpty(api.POST('/api/v1/auth/email-verification', { body: { token } }))
      .then(() => setState('done'))
      .catch((e: unknown) => {
        setState('failed');
        setError(messageFor(e));
      });
  }, [token]);

  return (
    <AuthCard
      title={
        state === 'done'
          ? 'Email verified'
          : state === 'failed'
            ? 'Verification failed'
            : 'Verifying…'
      }
      description={
        state === 'done'
          ? 'Your account is active. Sign in to set up your workspace.'
          : state === 'failed'
            ? (error ?? 'This link could not be used.')
            : 'One moment while we confirm your email address.'
      }
      footer={
        <Link
          href='/auth/sign-in'
          className='text-foreground font-medium underline-offset-4 hover:underline'
        >
          Go to sign in
        </Link>
      }
    >
      {null}
    </AuthCard>
  );
}

// --- Password reset ------------------------------------------------------------------------

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: z.object({ email }) },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await unwrapEmpty(api.POST('/api/v1/auth/password-reset', { body: value }));
        setSent(true);
      } catch (e) {
        setError(messageFor(e));
      }
    }
  });

  return (
    <AuthCard
      title={sent ? 'Check your email' : 'Reset your password'}
      description={
        sent
          ? 'If an account uses that address, a reset link is on its way.'
          : 'Enter your account email and we will send you a reset link.'
      }
      footer={
        <Link
          href='/auth/sign-in'
          className='text-foreground font-medium underline-offset-4 hover:underline'
        >
          Back to sign in
        </Link>
      }
    >
      {!sent && (
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='email'
              children={(field) => (
                <field.TextField label='Email' type='email' autoComplete='email' />
              )}
            />
          </FieldGroup>
          {error && <p className='text-destructive text-sm'>{error}</p>}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(submitting) => (
              <LoadingButton loading={submitting} type='submit' className='w-full'>
                Send reset link
              </LoadingButton>
            )}
          </form.Subscribe>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: { password: '' },
    validators: { onSubmit: z.object({ password: newPassword }) },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await unwrapEmpty(
          api.POST('/api/v1/auth/password-reset/confirm', {
            body: { token, newPassword: value.password }
          })
        );
        toast.success('Password changed. Sign in with your new password.');
        router.replace('/auth/sign-in');
      } catch (e) {
        setError(messageFor(e));
      }
    }
  });

  return (
    <AuthCard title='Choose a new password' description='Other sessions will be signed out.'>
      <form
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='password'
            children={(field) => (
              <field.TextField
                label='New password'
                type='password'
                autoComplete='new-password'
                description='At least 12 characters.'
              />
            )}
          />
        </FieldGroup>
        {!token && <p className='text-destructive text-sm'>This reset link is incomplete.</p>}
        {error && <p className='text-destructive text-sm'>{error}</p>}
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <LoadingButton loading={submitting} type='submit' className='w-full' disabled={!token}>
              Change password
            </LoadingButton>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}
