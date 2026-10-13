"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Alert, AuthLayout, Button, Field } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      unwrap(await api.POST("/api/v1/auth/password-reset/confirm", { body: { token, newPassword: password } }));
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, undefined));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="All your sessions will be signed out.">
      {done ? (
        <Alert tone="success">Your password is changed. Sign in with the new one.</Alert>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          {error && !error.fieldProblem("newPassword") ? <Alert tone="error">{error.message}</Alert> : null}
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error?.fieldProblem("newPassword") ? `Password ${error.fieldProblem("newPassword")}.` : undefined}
          />
          <Button type="submit" busy={busy}>
            Change password
          </Button>
        </form>
      )}
      <Link className="mt-6 inline-block text-sm text-brand hover:underline" href="/sign-in">
        Go to sign in
      </Link>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
