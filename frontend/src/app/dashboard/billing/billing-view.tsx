'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { billingInfoContent } from '@/config/infoconfig';
import { billingMutations, billingQueries } from '@/features/billing/api/queries';
import type {
  BillingInterval,
  BillingInvoice,
  PaymentMethodType,
  Plan
} from '@/features/billing/api/types';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS: {
  id: PaymentMethodType;
  label: string;
  subtitle: string;
  badge: string;
}[] = [
  {
    id: 'CARD',
    label: 'Debit & Credit Cards',
    subtitle: 'Visa, Mastercard, American Express & regional cards',
    badge: 'Instant'
  },
  {
    id: 'MOBILE_MONEY',
    label: 'Mobile Money',
    subtitle: 'MTN MoMo, Airtel Money, M-Pesa & regional wallets',
    badge: 'Auto-renew'
  },
  {
    id: 'DIGITAL_WALLET',
    label: 'Digital Wallets',
    subtitle: 'Apple Pay, Google Pay, and Stripe Link',
    badge: '1-Click'
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Bank Transfer / ACH / Wire',
    subtitle: 'Direct bank transfer or custom Enterprise invoice',
    badge: 'Net 30'
  }
];

const PLAN_PRICES: Record<Plan, { monthly: number; annual: number }> = {
  STARTER: { monthly: 49, annual: 39 },
  BUSINESS: { monthly: 149, annual: 119 },
  ENTERPRISE: { monthly: 399, annual: 319 }
};

function limitText(value: number | null | undefined): string {
  return value == null ? 'Unlimited' : value.toLocaleString();
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function safeRedirectUrl(url: string): string | null {
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

  const [interval, setInterval] = useState<BillingInterval>('ANNUAL');
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currency, setCurrency] = useState('USD');

  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [billingEmail, setBillingEmail] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 · Annual Bank Transfer');
  const [seats, setSeats] = useState(20);
  const [activeReceipt, setActiveReceipt] = useState<BillingInvoice | null>(null);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: billingQueries.overview(orgId).queryKey });
    void queryClient.invalidateQueries({ queryKey: billingQueries.invoices(orgId).queryKey });
    void queryClient.invalidateQueries({ queryKey: billingQueries.history(orgId).queryKey });
  };

  const { data: plans = [] } = useQuery(billingQueries.plans());
  const { data: billing, isPending } = useQuery({
    ...billingQueries.overview(orgId),
    enabled: organizationId !== null && canRead
  });
  const { data: invoices = [] } = useQuery({
    ...billingQueries.invoices(orgId),
    enabled: organizationId !== null && canRead
  });
  const { data: history = [] } = useQuery({
    ...billingQueries.history(orgId),
    enabled: organizationId !== null && canRead
  });

  const onError = (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : 'The billing request failed');

  const checkout = useMutation({
    ...billingMutations.checkout(orgId),
    onSuccess: (result) => {
      setCheckoutPlan(null);
      const url = safeRedirectUrl(result.checkoutUrl);
      if (url && !url.startsWith(window.location.origin)) {
        window.location.assign(url);
      } else {
        toast.success('Subscription updated and payment verified.');
        invalidateAll();
      }
    },
    onError
  });

  const cancel = useMutation({
    ...billingMutations.cancel(orgId),
    onSuccess: () => toast.success('Subscription will end at the close of the current period.'),
    onError,
    onSettled: invalidateAll
  });

  const reactivate = useMutation({
    ...billingMutations.reactivate(orgId),
    onSuccess: () => toast.success('Automatic renewal has been restored.'),
    onError,
    onSettled: invalidateAll
  });

  const portal = useMutation({
    ...billingMutations.portal(orgId),
    onSuccess: (result) => {
      const url = safeRedirectUrl(result.portalUrl);
      if (url && !url.startsWith(window.location.origin)) {
        window.location.assign(url);
      } else {
        toast.info('Payment method portal opens automatically once Stripe live keys are configured.');
      }
    },
    onError
  });

  const enterpriseInvoice = useMutation({
    ...billingMutations.enterpriseInvoice(orgId),
    onSuccess: (inv) => {
      setEnterpriseOpen(false);
      setActiveReceipt(inv);
      toast.success(`Enterprise invoice ${inv.invoiceNumber} generated with wire instructions.`);
      invalidateAll();
    },
    onError
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
      pageTitle='Billing & Payments'
      pageDescription={`Subscriptions, payment methods, invoices, and usage for ${membership?.organization.name ?? 'this workspace'}`}
    >
      <div className='space-y-6'>
        {/* Active Subscription Status Banner */}
        <Card>
          <CardHeader className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <CardTitle className='text-lg'>
                  {subscription ? `${subscription.plan} Plan` : 'Subscription'}
                </CardTitle>
                {subscription && (
                  <>
                    <Badge variant={subscription.inGoodStanding ? 'default' : 'destructive'}>
                      {subscription.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant='outline'>{subscription.billingInterval}</Badge>
                    <Badge variant='secondary'>
                      {subscription.paymentMethod.replace('_', ' ')}
                    </Badge>
                  </>
                )}
              </div>
              <CardDescription>
                {subscription?.trialEndsAt && subscription.status === 'TRIALING'
                  ? `Free trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}. `
                  : ''}
                {subscription?.currentPeriodEnd
                  ? `${subscription.cancelAtPeriodEnd ? 'Ends' : 'Automatically renews'} on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`
                  : 'Select a monthly or annual plan below to activate automatic renewal.'}
              </CardDescription>
            </div>
            {canManage && subscription && (
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={portal.isPending}
                  onClick={() => portal.mutate()}
                >
                  <Icons.creditCard className='mr-1.5 size-4' />
                  Manage Payment Methods
                </Button>
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    size='sm'
                    disabled={reactivate.isPending}
                    onClick={() => reactivate.mutate()}
                  >
                    Resume Auto-Renewal
                  </Button>
                ) : (
                  subscription.status !== 'CANCELED' && (
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate()}
                    >
                      Cancel at Period End
                    </Button>
                  )
                )}
              </div>
            )}
          </CardHeader>

          {subscription && (subscription.failedPaymentAttempts > 0 || !subscription.inGoodStanding) && (
            <CardContent className='pt-0'>
              <Alert variant='destructive'>
                <Icons.warning className='h-4 w-4' />
                <AlertDescription>
                  {subscription.failedPaymentAttempts > 0
                    ? `Payment failed (${subscription.failedPaymentAttempts} attempt${subscription.failedPaymentAttempts > 1 ? 's' : ''}). `
                    : ''}
                  {subscription.nextRetryAt
                    ? `Next automatic retry scheduled for ${new Date(subscription.nextRetryAt).toLocaleString()}. `
                    : ''}
                  {!subscription.inGoodStanding
                    ? 'Grace period elapsed: new activity is paused while your existing data remains readable.'
                    : 'Update your payment method to avoid service interruption.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Plans & Upgrade/Downgrade Section */}
        <Card>
          <CardHeader className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Upgrade, downgrade, or switch between monthly and annual billing anytime
              </CardDescription>
            </div>
            <div className='bg-muted/50 inline-flex items-center gap-1 rounded-full border p-1 text-xs'>
              <button
                type='button'
                onClick={() => setInterval('MONTHLY')}
                className={cn(
                  'rounded-full px-3.5 py-1.5 font-medium transition-colors',
                  interval === 'MONTHLY'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                Monthly
              </button>
              <button
                type='button'
                onClick={() => setInterval('ANNUAL')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-colors',
                  interval === 'ANNUAL'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                Annual
                <span className='rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-500'>
                  -20%
                </span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              {plans.map((plan) => {
                const planKey = plan.plan as Plan;
                const isCurrent =
                  subscription?.plan === planKey && subscription?.billingInterval === interval;
                const price =
                  interval === 'ANNUAL' ? PLAN_PRICES[planKey].annual : PLAN_PRICES[planKey].monthly;

                return (
                  <Card key={plan.plan} className={cn(isCurrent && 'border-primary')}>
                    <CardHeader>
                      <CardTitle className='flex items-center justify-between text-base'>
                        {plan.name}
                        {isCurrent && <Badge>Active</Badge>}
                      </CardTitle>
                      <div className='pt-2'>
                        <span className='text-3xl font-bold'>${price}</span>
                        <span className='text-muted-foreground text-xs'>
                          /mo {interval === 'ANNUAL' && '(billed annually)'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-1.5 text-sm'>
                      {plan.limits.map((l) => (
                        <div key={l.limit} className='flex justify-between gap-2'>
                          <span className='text-muted-foreground'>{l.label}</span>
                          <span className='tabular-nums font-medium'>{limitText(l.allowed)}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter>
                      {plan.selfServe ? (
                        <Button
                          variant={isCurrent ? 'outline' : 'default'}
                          className='w-full'
                          disabled={!canManage || isCurrent}
                          onClick={() => setCheckoutPlan(planKey)}
                        >
                          {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                        </Button>
                      ) : (
                        <Button
                          variant='outline'
                          className='w-full'
                          disabled={!canManage}
                          onClick={() => setEnterpriseOpen(true)}
                        >
                          Request Bank Transfer Invoice
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Usage & Entitlements */}
        {billing && billing.entitlements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workspace Usage & Limits</CardTitle>
              <CardDescription>Live metering against your active plan entitlements</CardDescription>
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

        {/* Invoices & Receipts + Subscription History */}
        <div className='grid gap-6 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Invoices & Receipts</CardTitle>
              <CardDescription>Paid receipts and open Enterprise bank transfer invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className='text-muted-foreground py-6 text-center text-sm'>
                  No invoices yet. Invoices and receipts appear here automatically after checkout.
                </p>
              ) : (
                <div className='divide-y'>
                  {invoices.map((inv) => (
                    <div key={inv.id} className='flex items-center justify-between gap-3 py-3 text-sm'>
                      <div>
                        <p className='font-mono text-xs font-semibold'>{inv.invoiceNumber}</p>
                        <p className='text-muted-foreground text-xs'>
                          {inv.plan} · {inv.billingInterval} · {inv.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='font-medium tabular-nums'>
                            {formatMoney(inv.amountCents, inv.currency)}
                          </p>
                          <Badge
                            variant={inv.status === 'PAID' ? 'default' : 'outline'}
                            className='text-[10px]'
                          >
                            {inv.status}
                          </Badge>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setActiveReceipt(inv)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription History</CardTitle>
              <CardDescription>Audited timeline of renewals, upgrades, retries, and webhooks</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className='text-muted-foreground py-6 text-center text-sm'>
                  Subscription lifecycle events will be recorded here automatically.
                </p>
              ) : (
                <div className='divide-y'>
                  {history.map((item) => (
                    <div key={item.eventId} className='flex items-center justify-between gap-3 py-3 text-xs'>
                      <div>
                        <p className='font-medium'>{item.type}</p>
                        <p className='text-muted-foreground'>
                          via {item.provider} · {new Date(item.occurredAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant='outline' className='font-mono text-[10px]'>
                        {item.outcome}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Rail Self-Service Checkout Dialog */}
      <Dialog open={checkoutPlan !== null} onOpenChange={(open) => !open && setCheckoutPlan(null)}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              Complete {checkoutPlan} Subscription ({interval})
            </DialogTitle>
            <DialogDescription>
              Select your preferred payment method. Automatic renewal can be managed anytime.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2'>
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type='button'
                onClick={() => setPaymentMethod(pm.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all',
                  paymentMethod === pm.id
                    ? 'border-primary bg-accent/40'
                    : 'hover:bg-muted/40'
                )}
              >
                <div>
                  <p className='text-sm font-medium'>{pm.label}</p>
                  <p className='text-muted-foreground text-xs'>{pm.subtitle}</p>
                </div>
                <Badge variant='secondary' className='text-[10px]'>
                  {pm.badge}
                </Badge>
              </button>
            ))}

            {paymentMethod === 'MOBILE_MONEY' && (
              <div className='bg-muted/30 grid gap-3 rounded-xl border p-3.5 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <label className='text-xs font-medium'>Mobile Money Number</label>
                  <input
                    type='tel'
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder='+250 788 000 000'
                    className='bg-background border-input h-9 w-full rounded-lg border px-3 text-sm'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-medium'>Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className='bg-background border-input h-9 w-full rounded-lg border px-3 text-sm'
                  >
                    <option value='USD'>USD</option>
                    <option value='RWF'>RWF (Rwanda)</option>
                    <option value='KES'>KES (Kenya)</option>
                    <option value='UGX'>UGX (Uganda)</option>
                    <option value='GHS'>GHS (Ghana)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setCheckoutPlan(null)}>
              Cancel
            </Button>
            <Button
              disabled={checkout.isPending || !checkoutPlan}
              onClick={() => {
                if (!checkoutPlan) return;
                checkout.mutate({
                  plan: checkoutPlan,
                  interval,
                  paymentMethod,
                  phoneNumber: phoneNumber.trim() || undefined,
                  currency
                });
              }}
            >
              {checkout.isPending ? 'Connecting…' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enterprise Annual Bank Transfer Invoice Dialog */}
      <Dialog open={enterpriseOpen} onOpenChange={setEnterpriseOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Enterprise Annual Contract & Bank Transfer</DialogTitle>
            <DialogDescription>
              Generate an official custom invoice with wire transfer reference and negotiated terms.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3.5 py-2'>
            <div className='space-y-1'>
              <label className='text-xs font-medium'>Billing Contact Email *</label>
              <input
                type='email'
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder='ap@firm.com'
                className='bg-background border-input h-10 w-full rounded-lg border px-3 text-sm'
              />
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-1'>
                <label className='text-xs font-medium'>Purchase Order (PO) #</label>
                <input
                  type='text'
                  value={purchaseOrder}
                  onChange={(e) => setPurchaseOrder(e.target.value)}
                  placeholder='PO-2026-041'
                  className='bg-background border-input h-10 w-full rounded-lg border px-3 text-sm'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium'>Estimated Seats</label>
                <input
                  type='number'
                  min={5}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className='bg-background border-input h-10 w-full rounded-lg border px-3 text-sm'
                />
              </div>
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium'>Payment Terms</label>
              <input
                type='text'
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className='bg-background border-input h-10 w-full rounded-lg border px-3 text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEnterpriseOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={enterpriseInvoice.isPending || !billingEmail.includes('@')}
              onClick={() =>
                enterpriseInvoice.mutate({
                  billingEmail: billingEmail.trim(),
                  purchaseOrder: purchaseOrder.trim() || undefined,
                  paymentTerms: paymentTerms.trim() || undefined,
                  seats,
                  currency: 'USD'
                })
              }
            >
              {enterpriseInvoice.isPending ? 'Generating…' : 'Generate Wire Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice / Receipt Detail Modal */}
      <Dialog open={activeReceipt !== null} onOpenChange={(open) => !open && setActiveReceipt(null)}>
        <DialogContent className='sm:max-w-md'>
          {activeReceipt && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice {activeReceipt.invoiceNumber}</DialogTitle>
                <DialogDescription>
                  Issued {new Date(activeReceipt.createdAt).toLocaleDateString()} · Status:{' '}
                  {activeReceipt.status}
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-2.5 rounded-xl border p-4 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Plan</span>
                  <span className='font-medium'>
                    {activeReceipt.plan} ({activeReceipt.billingInterval})
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Payment Method</span>
                  <span className='font-medium'>{activeReceipt.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Amount</span>
                  <span className='font-semibold'>
                    {formatMoney(activeReceipt.amountCents, activeReceipt.currency)}
                  </span>
                </div>
                {activeReceipt.wireReference && (
                  <div className='border-t pt-2.5'>
                    <p className='text-muted-foreground text-xs'>Wire Reference (include in memo)</p>
                    <p className='font-mono text-xs font-semibold'>{activeReceipt.wireReference}</p>
                  </div>
                )}
                {activeReceipt.paymentTerms && (
                  <div className='border-t pt-2.5'>
                    <p className='text-muted-foreground text-xs'>Terms & Wire Instructions</p>
                    <p className='text-xs'>{activeReceipt.paymentTerms}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                {activeReceipt.receiptUrl && activeReceipt.receiptUrl.startsWith('https://') && (
                  <Button
                    variant='outline'
                    onClick={() => window.open(activeReceipt.receiptUrl, '_blank', 'noreferrer')}
                  >
                    Open Provider Receipt
                  </Button>
                )}
                <Button onClick={() => setActiveReceipt(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
