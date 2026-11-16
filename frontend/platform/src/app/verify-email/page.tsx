"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Alert, AuthLayout } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

function Verify() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"working" | "done" | "failed">(token ? "working" : "failed");
  const [message, setMessage] = useState<string>("This link is invalid or has expired.");
  const started = useRef(false);

  useEffect(() => {
    // Tokens are single-use: never send one twice (React may run effects twice in development).
    if (!token || started.current) {
      return;
    }
    started.current = true;
    api
      .POST("/api/v1/auth/email-verification", { body: { token } })
      .then((result) => {
        unwrap(result);
        setState("done");
      })
      .catch((caught: unknown) => {
        if (caught instanceof ApiError) {
          setMessage(caught.message);
        }
        setState("failed");
      });
  }, [token]);

  return (
    <AuthLayout title="Confirm your email">
      {state === "working" ? <Alert tone="info">Confirming…</Alert> : null}
      {state === "done" ? <Alert tone="success">Your email address is confirmed. You can sign in now.</Alert> : null}
      {state === "failed" ? <Alert tone="error">{message}</Alert> : null}
      <Link className="mt-6 inline-block text-sm text-brand hover:underline" href="/sign-in">
        Go to sign in
      </Link>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
