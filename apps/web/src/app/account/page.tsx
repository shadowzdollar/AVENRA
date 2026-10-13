"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";
import { sessionKey } from "@/lib/session";

function message(error: unknown): string | null {
  return error instanceof ApiError ? error.message : error ? "Something went wrong. Please try again." : null;
}

function Sessions() {
  const queries = useQueryClient();
  const sessions = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: async () => unwrap(await api.GET("/api/v1/auth/sessions")),
  });
  const refresh = () => void queries.invalidateQueries({ queryKey: ["auth", "sessions"] });
  const revoke = useMutation({
    mutationFn: async (sessionId: string) =>
      unwrap(await api.DELETE("/api/v1/auth/sessions/{sessionId}", { params: { path: { sessionId } } })),
    onSettled: refresh,
  });
  const revokeOthers = useMutation({
    mutationFn: async () => unwrap(await api.DELETE("/api/v1/auth/sessions")),
    onSettled: refresh,
  });

  return (
    <Card
      title="Where you are signed in"
      actions={
        <Button variant="secondary" busy={revokeOthers.isPending} onClick={() => revokeOthers.mutate()}>
          Sign out everywhere else
        </Button>
      }
    >
      <ul className="divide-y divide-border text-sm">
        {sessions.data?.map((session) => (
          <li key={session.id} className="flex items-center justify-between gap-4 py-2">
            <span>
              <span className="block">{session.userAgent ?? "Unknown device"}</span>
              <span className="text-text-secondary">
                Active {new Date(session.lastSeenAt).toLocaleString()}
                {session.current ? " · this device" : ""}
              </span>
            </span>
            {session.current ? null : (
              <Button variant="secondary" onClick={() => revoke.mutate(session.id)}>
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const change = useMutation({
    mutationFn: async () =>
      unwrap(await api.PUT("/api/v1/auth/password", { body: { currentPassword: current, newPassword: next } })),
    onSuccess: () => {
      setCurrent("");
      setNext("");
    },
  });
  const error = change.error instanceof ApiError ? change.error : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    change.mutate();
  }

  return (
    <Card title="Password">
      <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">
        {change.isSuccess ? <Alert tone="success">Password changed. Your other sessions were signed out.</Alert> : null}
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={error?.fieldProblem("currentPassword") ? `Current password ${error.fieldProblem("currentPassword")}.` : undefined}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={error?.fieldProblem("newPassword") ? `New password ${error.fieldProblem("newPassword")}.` : undefined}
        />
        {error && !error.body?.details?.length ? <Alert tone="error">{error.message}</Alert> : null}
        <Button type="submit" busy={change.isPending}>
          Change password
        </Button>
      </form>
    </Card>
  );
}

function TwoStepVerification({ enabled }: { enabled: boolean }) {
  const queries = useQueryClient();
  const [enrollment, setEnrollment] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const start = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/auth/mfa/totp")),
    onSuccess: setEnrollment,
  });
  const activate = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/auth/mfa/totp/activation", { body: { code: code.trim() } })),
    onSuccess: (result) => {
      setRecoveryCodes(result.codes);
      setEnrollment(null);
      setCode("");
      void queries.invalidateQueries({ queryKey: sessionKey });
    },
  });
  const disable = useMutation({
    mutationFn: async () => unwrap(await api.DELETE("/api/v1/auth/mfa/totp", { body: { code: code.trim() } })),
    onSuccess: () => {
      setCode("");
      void queries.invalidateQueries({ queryKey: sessionKey });
    },
  });

  return (
    <Card title="Two-step verification">
      {recoveryCodes ? (
        <div className="flex flex-col gap-3">
          <Alert tone="success">Two-step verification is on. Store these recovery codes somewhere safe; each works once and they are shown only now.</Alert>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map((recovery) => (
              <li key={recovery}>{recovery}</li>
            ))}
          </ul>
        </div>
      ) : enabled ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            disable.mutate();
          }}
          className="flex max-w-sm flex-col gap-4"
        >
          <p className="text-sm text-text-secondary">Two-step verification is on. To turn it off, enter a current code.</p>
          {message(disable.error) ? <Alert tone="error">{message(disable.error)}</Alert> : null}
          <Field label="Code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" variant="danger" busy={disable.isPending}>
            Turn off
          </Button>
        </form>
      ) : enrollment ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            activate.mutate();
          }}
          className="flex max-w-md flex-col gap-4"
        >
          <p className="text-sm text-text-secondary">
            Add Avenra to your authenticator app with this setup key, then enter the 6-digit code it shows.
          </p>
          <code className="rounded-md border border-border px-3 py-2 font-mono text-sm break-all">{enrollment.secret}</code>
          <a className="text-sm text-brand hover:underline" href={enrollment.otpauthUri}>
            Open in an authenticator app on this device
          </a>
          {message(activate.error) ? <Alert tone="error">{message(activate.error)}</Alert> : null}
          <Field label="Code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" busy={activate.isPending}>
            Turn on
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-text-secondary">Protect your account with a code from an authenticator app in addition to your password.</p>
          {message(start.error) ? <Alert tone="error">{message(start.error)}</Alert> : null}
          <Button onClick={() => start.mutate()} busy={start.isPending}>
            Set up
          </Button>
        </div>
      )}
    </Card>
  );
}

function Account() {
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")),
  });
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-text-secondary">{session.data?.email}</p>
      </div>
      <TwoStepVerification enabled={session.data?.mfaEnabled ?? false} />
      <ChangePassword />
      <Sessions />
    </div>
  );
}

export default function AccountPage() {
  return (
    <AppShell>
      <Account />
    </AppShell>
  );
}
