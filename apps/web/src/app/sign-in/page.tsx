"use client";

import { LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { CodeInput, EmailField, PasswordField, TrustRow } from "@/components/auth";
import { Alert, AuthLayout, Button } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";
import { safeNext } from "@/lib/session";

function SignInForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
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

  function verify(event?: FormEvent) {
    event?.preventDefault();
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
    const complete = recovery ? code.trim().length >= 8 : /^\d{6}$/.test(code);
    return (
      <AuthLayout icon={ShieldCheck} title="Two-step verification" subtitle="Your account is protected by a second step. Enter the code to continue.">
        <form onSubmit={verify} className="flex flex-col gap-5">
          {error ? <Alert tone="error">{error.message}</Alert> : null}
          <CodeInput value={code} onChange={setCode} recovery={recovery} onRecoveryChange={setRecovery} />
          <Button type="submit" busy={busy} disabled={!complete} className="h-10 w-full">
            Verify and sign in
          </Button>
          <button
            type="button"
            className="text-[13px] text-text-secondary hover:text-text-primary"
            onClick={() => {
              setChallenge(null);
              setCode("");
              setError(null);
            }}
          >
            Sign in with a different account
          </button>
        </form>
        <TrustRow />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={LogIn} title="Sign in to your workspace" subtitle="Enter your email and password to continue.">
      <form onSubmit={signIn} className="flex flex-col gap-4">
        {error ? (
          <Alert tone="error">
            {error.message}
            {error.code === "EMAIL_NOT_VERIFIED" ? (
              <>
                {" "}
                <Link className="font-medium underline" href={`/sign-up?resend=${encodeURIComponent(email)}`}>
                  Send the confirmation again
                </Link>
              </>
            ) : null}
          </Alert>
        ) : null}
        <EmailField label="Email" autoComplete="email" required autoFocus value={email} onChange={setEmail} placeholder="you@firm.com" />
        <div className="flex flex-col gap-1">
          <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={setPassword} />
          <Link className="self-end text-[12px] font-medium text-brand hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" busy={busy} className="h-10 w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-text-secondary">
        New to Avenra?{" "}
        <Link className="font-medium text-brand hover:underline" href="/sign-up">
          Create an account
        </Link>
      </p>
      <TrustRow />
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
