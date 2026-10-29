"use client";

import { Lock, Mail, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Alert, AuthLayout, Button, Field } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

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
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a confirmation link to ${email}. Open it to finish setting up your account.`}>
        <Link className="text-sm text-brand hover:underline" href="/sign-in">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={resend ? "Send the confirmation again" : "Create your account"}
      subtitle={resend ? undefined : "Use at least 12 characters for your password. A phrase is easiest to remember."}
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        {error && !error.fieldProblem("password") ? <Alert tone="error">{error.message}</Alert> : null}
        {resend ? null : <Field label="Name" icon={User} autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />}
        <Field label="Work email" type="email" icon={Mail} autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {resend ? null : (
          <Field
            label="Password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error?.fieldProblem("password") ? `Password ${error.fieldProblem("password")}.` : undefined}
          />
        )}
        <Button type="submit" busy={busy} className="h-10 w-full">
          {resend ? "Send confirmation" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link className="text-brand hover:underline" href="/sign-in">
          Sign in
        </Link>
      </p>
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
