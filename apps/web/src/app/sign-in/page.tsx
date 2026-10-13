"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Alert, AuthLayout, Button, Field } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";
import { safeNext } from "@/lib/session";

function SignInForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, undefined));
    } finally {
      setBusy(false);
    }
  }

  function signIn(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const result = unwrap(await api.POST("/api/v1/auth/sign-in", { body: { email, password } }));
      if (result.status === "MFA_REQUIRED" && result.mfaChallengeId) {
        setChallenge(result.mfaChallengeId);
      } else {
        router.replace(next);
      }
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      unwrap(
        await api.POST("/api/v1/auth/sign-in/mfa", {
          body: { mfaChallengeId: challenge ?? "", code: code.trim() },
        }),
      );
      router.replace(next);
    });
  }

  if (challenge) {
    return (
      <AuthLayout title="Two-step verification" subtitle="Enter the 6-digit code from your authenticator app, or a recovery code.">
        <form onSubmit={verify} className="flex flex-col gap-4">
          {error ? <Alert tone="error">{error.message}</Alert> : null}
          <Field label="Code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" busy={busy}>
            Verify
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Sign in" subtitle="From Intent to Completed Work.">
      <form onSubmit={signIn} className="flex flex-col gap-4">
        {error ? (
          <Alert tone="error">
            {error.message}
            {error.code === "EMAIL_NOT_VERIFIED" ? (
              <>
                {" "}
                <Link className="underline" href={`/sign-up?resend=${encodeURIComponent(email)}`}>
                  Send it again
                </Link>
              </>
            ) : null}
          </Alert>
        ) : null}
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" busy={busy}>
          Sign in
        </Button>
      </form>
      <div className="mt-6 flex justify-between text-sm">
        <Link className="text-brand hover:underline" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="text-brand hover:underline" href="/sign-up">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
