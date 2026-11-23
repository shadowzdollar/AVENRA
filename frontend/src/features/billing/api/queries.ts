import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { orgKey } from '@/lib/live';
import {
  cancelSubscription,
  createBillingPortal,
  createEnterpriseInvoice,
  getBilling,
  listBillingHistory,
  listBillingInvoices,
  listPlans,
  reactivateSubscription,
  startCheckout
} from './service';
import type { CheckoutRequest, EnterpriseInvoiceRequest } from './types';

export const billingQueries = {
  plans: () =>
    queryOptions({
      queryKey: ['billing', 'plans'] as const,
      queryFn: listPlans,
      staleTime: 300_000
    }),
  overview: (organizationId: string) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'billing'),
      queryFn: () => getBilling(organizationId),
      refetchOnWindowFocus: true
    }),
  invoices: (organizationId: string) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'billing', 'invoices'),
      queryFn: () => listBillingInvoices(organizationId)
    }),
  history: (organizationId: string) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'billing', 'history'),
      queryFn: () => listBillingHistory(organizationId)
    })
};

export const billingMutations = {
  checkout: (organizationId: string) =>
    mutationOptions({ mutationFn: (body: CheckoutRequest) => startCheckout(organizationId, body) }),
  cancel: (organizationId: string) =>
    mutationOptions({ mutationFn: () => cancelSubscription(organizationId) }),
  reactivate: (organizationId: string) =>
    mutationOptions({ mutationFn: () => reactivateSubscription(organizationId) }),
  portal: (organizationId: string) =>
    mutationOptions({ mutationFn: () => createBillingPortal(organizationId) }),
  enterpriseInvoice: (organizationId: string) =>
    mutationOptions({
      mutationFn: (body: EnterpriseInvoiceRequest) => createEnterpriseInvoice(organizationId, body)
    })
};
