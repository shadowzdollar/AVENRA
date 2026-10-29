"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { components } from "@avenra/contracts";
import { AppShell } from "@/components/app-shell";
import { Alert, Button, Card } from "@/components/ui";
import { api, ApiError, idempotencyKey, unwrap } from "@/lib/api";
import { amount, fullness, standingText } from "@/lib/billing";

type Plan = components["schemas"]["Plan"];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function usePermissions(organizationId: string): Set<string> {
  const session = useQuery({ queryKey: ["auth", "session"], queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")) });
  return new Set(session.data?.organizations.find((m) => m.organization.id === organizationId)?.permissions ?? []);
}

function Billing({ id }: { id: string }) {
  const queries = useQueryClient();
  const permissions = usePermissions(id);
  const returned = useSearchParams().get("checkout") === "returned";
  const path = { params: { path: { organizationId: id } } };
  const billing = useQuery({
    queryKey: ["organization", id, "billing"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/billing", path)),
    enabled: permissions.has("billing.read"),
    // After a checkout the provider confirms in the background; look again until it has.
    refetchInterval: (query) => (returned && query.state.data?.subscription.status !== "ACTIVE" ? 2_000 : false),
  });
  const plans = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: async () => unwrap(await api.GET("/api/v1/billing/plans")),
  });
  const checkout = useMutation({
    mutationFn: async (plan: Plan) =>
      unwrap(
        await api.POST("/api/v1/organizations/{organizationId}/billing/checkout", {
          params: { path: { organizationId: id }, header: { "Idempotency-Key": idempotencyKey() } },
          body: { plan },
        }),
      ),
    onSuccess: (started) => window.location.assign(started.checkoutUrl),
  });
  const cancel = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/organizations/{organizationId}/billing/cancellation", path)),
    onSuccess: () => void queries.invalidateQueries({ queryKey: ["organization", id, "billing"] }),
  });
  const canManage = permissions.has("billing.manage");
  const subscription = billing.data?.subscription;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <nav className="flex gap-4 text-sm">
          <Link href={`/organizations/${id}`} className="text-brand hover:underline">
            Organization
          </Link>
        </nav>
      </div>
      {billing.error ? <Alert tone="error">{errorText(billing.error)}</Alert> : null}
      {checkout.error ?? cancel.error ? <Alert tone="error">{errorText(checkout.error ?? cancel.error)}</Alert> : null}
      {returned && subscription && subscription.status !== "ACTIVE" ? <Alert tone="info">Confirming your payment…</Alert> : null}

      {subscription ? (
        <Card title="Subscription">
          <p className="text-lg font-medium" data-testid="current-plan">
            {plans.data?.find((plan) => plan.plan === subscription.plan)?.name ?? subscription.plan}
          </p>
          <p className="mt-1 text-sm text-text-secondary" data-testid="subscription-standing">
            {standingText(subscription)}
          </p>
          {canManage && subscription.status !== "CANCELED" && !subscription.cancelAtPeriodEnd ? (
            <div className="mt-4">
              <Button variant="secondary" busy={cancel.isPending} onClick={() => cancel.mutate()}>
                Cancel at the end of the period
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {billing.data ? (
        <Card title="Use of your plan">
          <ul className="flex flex-col gap-3 text-sm">
            {billing.data.entitlements.map((entitlement) => (
              <li key={entitlement.limit} data-testid={`entitlement-${entitlement.limit}`}>
                <div className="flex justify-between">
                  <span>{entitlement.label}</span>
                  <span className="tabular-nums text-text-secondary">
                    {amount(entitlement.limit, entitlement.used)} of {amount(entitlement.limit, entitlement.allowed)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-brand-surface" aria-hidden>
                  <div className="h-1.5 rounded-full bg-brand" style={{ width: `${fullness(entitlement.used, entitlement.allowed)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Plans">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.data?.map((plan) => (
            <div key={plan.plan} className="flex flex-col gap-3 rounded-md border border-border p-4" data-testid={`plan-${plan.plan}`}>
              <h3 className="font-medium">{plan.name}</h3>
              <ul className="flex-1 text-sm text-text-secondary">
                {plan.limits.map((limit) => (
                  <li key={limit.limit}>
                    {amount(limit.limit, limit.allowed)} {limit.label}
                  </li>
                ))}
              </ul>
              {subscription?.plan === plan.plan && subscription.status === "ACTIVE" ? (
                <span className="text-sm font-medium">Your plan</span>
              ) : !plan.selfServe ? (
                <span className="text-sm text-text-secondary">Talk to us</span>
              ) : canManage ? (
                <Button busy={checkout.isPending && checkout.variables === plan.plan} onClick={() => checkout.mutate(plan.plan)}>
                  Choose {plan.name}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BillingRoute() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Billing id={organizationId} />;
}

export default function BillingPage() {
  return (
    <AppShell>
      <Suspense>
        <BillingRoute />
      </Suspense>
    </AppShell>
  );
}
