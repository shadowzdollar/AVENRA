import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { orgKey } from '@/lib/live';
import { cancelSubscription, getBilling, listPlans, startCheckout } from './service';
import type { Plan } from './types';

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
    })
};

export const billingMutations = {
  checkout: (organizationId: string) =>
    mutationOptions({ mutationFn: (plan: Plan) => startCheckout(organizationId, plan) }),
  cancel: (organizationId: string) =>
    mutationOptions({ mutationFn: () => cancelSubscription(organizationId) })
};
