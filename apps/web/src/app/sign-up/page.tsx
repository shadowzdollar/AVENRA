"use client";

import { Inbox, MailCheck, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { EmailField, PasswordField, PasswordGuidance, TrustRow } from "@/components/auth";
import { Alert, AuthLayout, Button, Field } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

/** A resend waits this long, so a mail server is not flooded by impatience. */
const RESEND_AFTER_SECONDS = 60;

const noSubscription = () => () => undefined;

/** Running on this machine: email goes to the local mail catcher, not to real inboxes. */
function useLocalDevelopment(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => ["localhost", "127.0.0.1"].includes(window.location.hostname),
    () => false,
  );
}

function CheckYourEmail({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const local = useLocalDevelopment();
  const [wait, setWait] = useState(RESEND_AFTER_SECONDS);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait(wait - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  async function resend() {
    setError(null);
    try {
      unwrap(await api.POST("/api/v1/auth/email-verification/resend", { body: { email } }));
      setResent(true);
      setWait(RESEND_AFTER_SECONDS);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The email could not be sent again. Try again in a moment.");
    }
  }

  return (
    <AuthLayout icon={MailCheck} title="Check your email" subtitle={`We sent a confirmation link to ${email}. Open it to finish setting up your account.`}>
      <ol className="flex flex-col gap-3 text-[13px]">
        {["Open the email from Avenra.", "Select the confirmation link. It works once and expires after a day.", "Sign in and create your organization."].map(
          (step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-surface text-[11px] font-semibold text-brand">{index + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ),
        )}
      </ol>
      {local ? (
        <div className="mt-5">
          <Alert tone="info">
            <span className="flex items-start gap-2">
              <Inbox className="mt-0.5 size-4 shrink-0" />
              <span>
                Running locally: no email leaves this computer. Find it in the local inbox at{" "}
                <a className="font-medium text-brand underline" href="http://127.0.0.1:18025" target="_blank" rel="noreferrer">
                  127.0.0.1:18025
                </a>
                .
              </span>
            </span>
          </Alert>
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-3">
        {resent ? <Alert tone="success">Sent again. Check your spam folder too.</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button variant="secondary" className="h-10 w-full" disabled={wait > 0} onClick={() => void resend()}>
          {wait > 0 ? `Didn't get it? Send again in ${wait}s` : "Send the email again"}
        </Button>
        <div className="flex justify-between text-[13px]">
          <button type="button" className="text-text-secondary hover:text-text-primary" onClick={onChangeEmail}>
            Use a different email
          </button>
          <Link className="font-medium text-brand hover:underline" href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

function SignUpForm() {
  const resend = useSearchParams().get("resend");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(resend ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (resend) {
        unwrap(await api.POST("/api/v1/auth/email-verification/resend", { body: { email } }));
      } else {
        unwrap(await api.POST("/api/v1/auth/sign-up", { body: { email, password, displayName: name } }));
      }
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, undefined));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <CheckYourEmail email={email} onChangeEmail={() => setSent(false)} />;
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={resend ? "Send the confirmation again" : "Create your account"}
      subtitle={resend ? "We will send a new confirmation link." : "Set up Avenra for your firm in a few minutes. Your organization comes next."}
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        {error && !error.fieldProblem("password") ? <Alert tone="error">{error.message}</Alert> : null}
        {resend ? null : <Field label="Name" icon={User} autoComplete="name" required maxLength={100} placeholder="Jane Mugisha" value={name} onChange={(e) => setName(e.target.value)} />}
        <EmailField label="Work email" autoComplete="email" required value={email} onChange={setEmail} placeholder="you@firm.com" />
        {resend ? null : (
          <>
            <PasswordField
              label="Password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={setPassword}
              error={error?.fieldProblem("password") ? `Password ${error.fieldProblem("password")}.` : undefined}
            />
            <PasswordGuidance password={password} email={email} />
          </>
        )}
        <Button type="submit" busy={busy} className="h-10 w-full">
          {resend ? "Send confirmation" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link className="font-medium text-brand hover:underline" href="/sign-in">
          Sign in
        </Link>
      </p>
      <TrustRow />
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
