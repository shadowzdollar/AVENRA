'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';
import { billingInfoContent } from '@/config/infoconfig';
import { billingMutations, billingQueries } from '@/features/billing/api/queries';
import type { Plan } from '@/features/billing/api/types';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

function limitText(value: number | null | undefined): string {
  return value == null ? 'Unlimited' : value.toLocaleString();
}

/** Only follow checkout URLs that are real web addresses. */
function safeCheckoutUrl(url: string): string | null {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.origin === window.location.origin
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export default function BillingView() {
  const { organizationId, membership, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const queryClient = useQueryClient();
  const canRead = hasPermission('billing.read');
  const canManage = hasPermission('billing.manage');

  const { data: plans = [] } = useQuery(billingQueries.plans());
  const { data: billing, isPending } = useQuery({
    ...billingQueries.overview(orgId),
    enabled: organizationId !== null && canRead
  });

  const onError = (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : 'The billing request failed');
  const checkout = useMutation({
    ...billingMutations.checkout(orgId),
    onSuccess: (result) => {
      const url = safeCheckoutUrl(result.checkoutUrl);
      if (url) window.location.assign(url);
      else toast.error('The payment provider returned an invalid checkout address.');
    },
    onError
  });
  const cancel = useMutation({
    ...billingMutations.cancel(orgId),
    onSuccess: () => toast.success('Subscription will end at the close of the current period.'),
    onError,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: billingQueries.overview(orgId).queryKey })
  });

  const subscription = billing?.subscription;

  return (
    <PageContainer
      isLoading={canRead && isPending && organizationId !== null}
      access={!!membership && canRead}
      accessFallback={
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='space-y-2 text-center'>
            <h2 className='text-2xl font-semibold'>
              {membership ? 'Billing Is Not Available to Your Role' : 'No Organization Selected'}
            </h2>
            <p className='text-muted-foreground'>
              {membership
                ? 'Ask a workspace owner or admin for access to billing.'
                : 'Please select or create an organization to view billing information.'}
            </p>
          </div>
        </div>
      }
      infoContent={billingInfoContent}
      pageTitle='Billing & Plans'
      pageDescription={`Manage your subscription and usage limits for ${membership?.organization.name ?? 'this workspace'}`}
    >
      <div className='space-y-6'>
        {/* Info Alert */}
        <Alert>
          <Icons.info className='h-4 w-4' />
          <AlertDescription>
            {subscription
              ? `You are on the ${subscription.plan.toLowerCase()} plan (${subscription.status.toLowerCase().replace('_', ' ')}).` +
                (subscription.trialEndsAt
                  ? ` Trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}.`
                  : '') +
                (subscription.cancelAtPeriodEnd
                  ? ' It ends at the close of the current period.'
                  : '')
              : 'Choose a plan to unlock higher limits.'}
            {subscription &&
              !subscription.inGoodStanding &&
              ' Payment is overdue: new members, work, integrations, files and assistant calls are paused.'}
          </AlertDescription>
        </Alert>

        {billing && billing.entitlements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>What this workspace uses against its plan limits</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              {billing.entitlements.map((e) => (
                <div key={e.limit} className='space-y-1.5'>
                  <div className='flex justify-between text-sm'>
                    <span>{e.label}</span>
                    <span className='text-muted-foreground tabular-nums'>
                      {e.used.toLocaleString()} / {limitText(e.allowed)}
                    </span>
                  </div>
                  <Progress value={e.allowed ? Math.min(100, (e.used / e.allowed) * 100) : 0} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose a plan that fits your organization&apos;s needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mx-auto grid max-w-4xl gap-4 md:grid-cols-3'>
              {plans.map((plan) => {
                const current = subscription?.plan === plan.plan;
                return (
                  <Card key={plan.plan} className={current ? 'border-primary' : undefined}>
                    <CardHeader>
                      <CardTitle className='flex items-center justify-between'>
                        {plan.name}
                        {current && <Badge>Current</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-1.5 text-sm'>
                      {plan.limits.map((l) => (
                        <div key={l.limit} className='flex justify-between gap-2'>
                          <span className='text-muted-foreground'>{l.label}</span>
                          <span className='tabular-nums'>{limitText(l.allowed)}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter>
                      {current ? (
                        canManage &&
                        subscription?.status !== 'CANCELED' &&
                        !subscription?.cancelAtPeriodEnd && (
                          <Button
                            variant='outline'
                            className='w-full'
                            disabled={cancel.isPending}
                            onClick={() => cancel.mutate()}
                          >
                            Cancel subscription
                          </Button>
                        )
                      ) : plan.selfServe ? (
                        <Button
                          className='w-full'
                          disabled={!canManage || checkout.isPending}
                          onClick={() => checkout.mutate(plan.plan as Plan)}
                        >
                          Choose {plan.name}
                        </Button>
                      ) : (
                        <Button variant='outline' className='w-full' disabled>
                          Contact sales
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
