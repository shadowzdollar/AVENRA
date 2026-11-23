import { api, idempotencyKey, unwrap } from '@/lib/api-client';
import type { CheckoutRequest, EnterpriseInvoiceRequest } from './types';

export function listPlans() {
  return unwrap(api.GET('/api/v1/billing/plans'));
}

export function getBilling(organizationId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/billing', {
      params: { path: { organizationId } }
    })
  );
}

export function startCheckout(organizationId: string, body: CheckoutRequest) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/billing/checkout', {
      params: { path: { organizationId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body
    })
  );
}

export function cancelSubscription(organizationId: string) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/billing/cancellation', {
      params: { path: { organizationId } }
    })
  );
}

export function reactivateSubscription(organizationId: string) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/billing/reactivation', {
      params: { path: { organizationId } }
    })
  );
}

export function createBillingPortal(organizationId: string) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/billing/portal', {
      params: { path: { organizationId } }
    })
  );
}

export function listBillingInvoices(organizationId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/billing/invoices', {
      params: { path: { organizationId } }
    })
  );
}

export function createEnterpriseInvoice(organizationId: string, body: EnterpriseInvoiceRequest) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/billing/enterprise-invoices', {
      params: { path: { organizationId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body
    })
  );
}

export function listBillingHistory(organizationId: string) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/billing/history', {
      params: { path: { organizationId } }
    })
  );
}
