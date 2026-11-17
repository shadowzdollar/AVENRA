import type { components } from '@/lib/api-client';

export type AnalyticsReport = components['schemas']['AnalyticsReport'];
export type AnalyticsMetric = components['schemas']['AnalyticsMetric'];
export type AnalyticsSeries = components['schemas']['AnalyticsSeries'];
export type AnalyticsDays = 7 | 30 | 90;

export function metric(
  report: AnalyticsReport | undefined,
  key: string
): AnalyticsMetric | undefined {
  return report?.metrics.find((m) => m.key === key);
}

export function series(
  report: AnalyticsReport | undefined,
  key: string
): AnalyticsSeries | undefined {
  return report?.series.find((s) => s.key === key);
}

/** Change against the previous period, as a signed percentage; undefined when not comparable. */
export function changePercent(m: AnalyticsMetric | undefined): number | undefined {
  if (m?.value == null || m.previous == null || m.previous === 0) return undefined;
  return ((m.value - m.previous) / m.previous) * 100;
}
