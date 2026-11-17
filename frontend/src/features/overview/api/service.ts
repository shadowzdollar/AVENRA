import { api, unwrap } from '@/lib/api-client';
import type { AnalyticsDays } from './types';

export function getAnalytics(organizationId: string, days: AnalyticsDays = 30) {
  return unwrap(
    api.GET('/api/v1/organizations/{organizationId}/analytics', {
      params: { path: { organizationId }, query: { days } }
    })
  );
}
