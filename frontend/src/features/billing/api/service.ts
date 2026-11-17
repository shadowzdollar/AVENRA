import { api, idempotencyKey, unwrap } from '@/lib/api-client';
import type { Plan } from './types';

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

export function startCheckout(organizationId: string, plan: Plan) {
  return unwrap(
    api.POST('/api/v1/organizations/{organizationId}/billing/checkout', {
      params: { path: { organizationId }, header: { 'Idempotency-Key': idempotencyKey() } },
      body: { plan }
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
