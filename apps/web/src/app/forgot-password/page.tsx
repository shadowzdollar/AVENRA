"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, AuthLayout, Button, Field } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      unwrap(await api.POST("/api/v1/auth/password-reset", { body: { email } }));
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, undefined));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We will email you a link to choose a new password.">
      {sent ? (
        <Alert tone="success">If an account exists for {email}, a reset link is on its way. It works once and expires in 30 minutes.</Alert>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          {error ? <Alert tone="error">{error.message}</Alert> : null}
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" busy={busy}>
            Send reset link
          </Button>
        </form>
      )}
      <Link className="mt-6 inline-block text-sm text-brand hover:underline" href="/sign-in">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
