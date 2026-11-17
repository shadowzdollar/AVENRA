import { queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import { getAnalytics } from './service';
import type { AnalyticsDays } from './types';

export const analyticsQueries = {
  report: (organizationId: string, days: AnalyticsDays = 30) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'analytics', days),
      queryFn: () => getAnalytics(organizationId, days),
      ...live,
      refetchInterval: 60_000
    })
};
