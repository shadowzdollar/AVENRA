'use client';

import {
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconLock,
  IconLogin,
  IconMail,
  IconUser,
  IconUserPlus
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { ApiError, api, unwrap, unwrapEmpty } from '@/lib/api-client';
import { useAppForm } from '@/lib/form';
import { cn } from '@/lib/utils';

// --- Shared --------------------------------------------------------------------------------

function GoogleMark() {
  return (
    <svg className='size-4.5 shrink-0' viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='#4285F4'
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      />
      <path
        fill='#34A853'
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      />
      <path
        fill='#FBBC05'
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      />
      <path
        fill='#EA4335'
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg className='size-4.5 shrink-0 fill-current' viewBox='0 0 24 24' aria-hidden='true'>
      <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
    </svg>
  );
}

function SocialAuthButtons() {
  return (
    <div className='space-y-3'>
      <button
        type='button'
        onClick={() => toast.info('Google sign-in will be enabled once OAuth credentials are configured.')}
        className='bg-background/60 hover:bg-accent/60 border-border/80 flex h-11 w-full items-center justify-center gap-3 rounded-xl border px-4 text-sm font-medium transition-colors'
      >
        <GoogleMark />
        <span className='bg-border/60 h-4 w-px' aria-hidden />
        <span>Continue with Google</span>
      </button>
      <button
        type='button'
        onClick={() => toast.info('Apple sign-in will be enabled once OAuth credentials are configured.')}
        className='bg-background/60 hover:bg-accent/60 border-border/80 flex h-11 w-full items-center justify-center gap-3 rounded-xl border px-4 text-sm font-medium transition-colors'
      >
        <AppleMark />
        <span className='bg-border/60 h-4 w-px' aria-hidden />
        <span>Continue with Apple</span>
      </button>
      <div className='flex items-center gap-3 py-1'>
        <span className='bg-border/60 h-px flex-1' />
        <span className='text-muted-foreground text-xs'>or</span>
        <span className='bg-border/60 h-px flex-1' />
      </div>
    </div>
  );
}

function AuthIconInput({
  icon,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  error,
  ariaLabel
}: {
  icon: React.ReactNode;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  autoComplete?: string;
  error?: string;
  ariaLabel: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className='space-y-1'>
      <div
        className={cn(
          'bg-background/50 border-border/80 focus-within:border-ring focus-within:ring-ring/40 flex h-11 items-center rounded-xl border px-3.5 transition-all focus-within:ring-2',
          error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/30'
        )}
      >
        <span className='text-muted-foreground mr-3 flex shrink-0 items-center'>{icon}</span>
        <input
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={ariaLabel}
          className='placeholder:text-muted-foreground/80 h-full w-full bg-transparent text-sm outline-none'
        />
        {isPassword && (
          <button
            type='button'
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className='text-muted-foreground hover:text-foreground ml-2 shrink-0 transition-colors'
          >
            {showPassword ? <IconEye className='size-4' /> : <IconEyeOff className='size-4' />}
          </button>
        )}
      </div>
      {error && <p className='text-destructive pl-1 text-xs'>{error}</p>}
    </div>
  );
}

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
    <div className='bg-card text-card-foreground border-border/70 w-full rounded-2xl border p-7 shadow-xl sm:p-9'>
      <div className='mb-6 flex flex-col items-center text-center'>
        <div className='mb-4'>
          <AvenraIcon size={44} />
        </div>
        <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
        <p className='text-muted-foreground mt-1.5 text-sm'>{description}</p>
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
      title='Sign in to your Avenra account'
      description='Welcome back. Continue to your workspace.'
      footer={
        <>
          New to Avenra?{' '}
          <Link
            href='/auth/sign-up'
            className='font-medium text-blue-500 underline-offset-4 transition-colors hover:text-blue-400 hover:underline'
          >
            Create account
          </Link>
        </>
      }
    >
      <div className='space-y-4'>
        <SocialAuthButtons />
        <form
          className='space-y-3.5'
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name='email'>
            {(field) => (
              <AuthIconInput
                icon={<IconMail className='size-4' />}
                type='email'
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder='Work email'
                autoComplete='email'
                ariaLabel='Work email'
                error={
                  field.state.meta.errors[0]
                    ? String(
                        typeof field.state.meta.errors[0] === 'object' &&
                          field.state.meta.errors[0] !== null &&
                          'message' in field.state.meta.errors[0]
                          ? field.state.meta.errors[0].message
                          : field.state.meta.errors[0]
                      )
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name='password'>
            {(field) => (
              <AuthIconInput
                icon={<IconLock className='size-4' />}
                type='password'
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder='Password'
                autoComplete='current-password'
                ariaLabel='Password'
                error={
                  field.state.meta.errors[0]
                    ? String(
                        typeof field.state.meta.errors[0] === 'object' &&
                          field.state.meta.errors[0] !== null &&
                          'message' in field.state.meta.errors[0]
                          ? field.state.meta.errors[0].message
                          : field.state.meta.errors[0]
                      )
                    : undefined
                }
              />
            )}
          </form.Field>

          <div className='flex justify-end'>
            <Link
              href='/auth/forgot-password'
              className='text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          {error && <p className='text-destructive text-sm'>{error}</p>}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(submitting) => (
              <LoadingButton
                loading={submitting}
                type='submit'
                className='mt-2 h-11 w-full gap-2 rounded-xl text-sm font-semibold'
              >
                <IconLogin className='size-4' />
                Sign in
              </LoadingButton>
            )}
          </form.Subscribe>
        </form>
      </div>
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
      description='Join a platform built for productive work.'
      footer={
        <>
          Already have an account?{' '}
          <Link
            href='/auth/sign-in'
            className='font-medium text-blue-500 underline-offset-4 transition-colors hover:text-blue-400 hover:underline'
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className='space-y-4'>
        <SocialAuthButtons />
        <form
          className='space-y-3.5'
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name='displayName'>
            {(field) => (
              <AuthIconInput
                icon={<IconUser className='size-4' />}
                type='text'
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder='Full name'
                autoComplete='name'
                ariaLabel='Full name'
                error={
                  field.state.meta.errors[0]
                    ? String(
                        typeof field.state.meta.errors[0] === 'object' &&
                          field.state.meta.errors[0] !== null &&
                          'message' in field.state.meta.errors[0]
                          ? field.state.meta.errors[0].message
                          : field.state.meta.errors[0]
                      )
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name='email'>
            {(field) => (
              <AuthIconInput
                icon={<IconMail className='size-4' />}
                type='email'
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder='Work email'
                autoComplete='email'
                ariaLabel='Work email'
                error={
                  field.state.meta.errors[0]
                    ? String(
                        typeof field.state.meta.errors[0] === 'object' &&
                          field.state.meta.errors[0] !== null &&
                          'message' in field.state.meta.errors[0]
                          ? field.state.meta.errors[0].message
                          : field.state.meta.errors[0]
                      )
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name='password'>
            {(field) => (
              <AuthIconInput
                icon={<IconLock className='size-4' />}
                type='password'
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder='Password'
                autoComplete='new-password'
                ariaLabel='Password'
                error={
                  field.state.meta.errors[0]
                    ? String(
                        typeof field.state.meta.errors[0] === 'object' &&
                          field.state.meta.errors[0] !== null &&
                          'message' in field.state.meta.errors[0]
                          ? field.state.meta.errors[0].message
                          : field.state.meta.errors[0]
                      )
                    : undefined
                }
              />
            )}
          </form.Field>

          <p className='text-muted-foreground flex items-center gap-1.5 pl-0.5 text-xs'>
            <IconInfoCircle className='size-3.5 shrink-0' />
            <span>At least 12 characters.</span>
          </p>

          {error && <p className='text-destructive text-sm'>{error}</p>}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(submitting) => (
              <LoadingButton
                loading={submitting}
                type='submit'
                className='mt-2 h-11 w-full gap-2 rounded-xl text-sm font-semibold'
              >
                <IconUserPlus className='size-4' />
                Create account
              </LoadingButton>
            )}
          </form.Subscribe>
        </form>
      </div>
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
