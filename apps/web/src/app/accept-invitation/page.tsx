"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

function Accept() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const membership = unwrap(await api.POST("/api/v1/invitations/acceptance", { body: { token } }));
      router.replace(`/organizations/${membership.organization.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, undefined));
      setBusy(false);
    }
  }

  return (
    <Card title="Join an organization">
      <p className="mb-4 text-sm text-text-secondary">
        You were invited to an organization on Avenra. Accepting adds you as a member with the role you were invited with.
      </p>
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error.message}</Alert>
        </div>
      ) : null}
      <Button onClick={() => void accept()} busy={busy} disabled={!token}>
        Accept invitation
      </Button>
    </Card>
  );
}

export default function AcceptInvitationPage() {
  return (
    <AppShell>
      <Suspense>
        <Accept />
      </Suspense>
    </AppShell>
  );
}
