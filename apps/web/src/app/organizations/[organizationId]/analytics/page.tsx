"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { BarChart } from "@/components/bar-chart";
import { Alert, Card, PageHeader } from "@/components/ui";
import { change, formatValue } from "@/lib/analytics";
import { api, ApiError, unwrap } from "@/lib/api";

type Metric = components["schemas"]["AnalyticsMetric"];
type Series = components["schemas"]["AnalyticsSeries"];
type Days = 7 | 30 | 90;

/** The headline metrics, in the order a person reads them; the rest follow. */
const HEADLINE = ["work.completed", "work.completion_rate", "work.completion_time_median", "requests.response_time_median"];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function shortDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}

function Tile({ metric }: { metric: Metric }) {
  const moved = change(metric.unit, metric.value, metric.previous);
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border p-4" data-testid={`metric-${metric.key}`}>
      <span className="text-sm text-text-secondary">{metric.label}</span>
      <span className="text-2xl font-semibold tabular-nums">{formatValue(metric.unit, metric.value)}</span>
      {moved ? <span className="text-xs text-text-secondary">{moved}</span> : null}
    </div>
  );
}

function Chart({ series }: { series: Series }) {
  return (
    <BarChart
      title={series.label}
      bars={series.points.map((point) => ({
        label: series.interval === "WEEK" ? `Week of ${shortDate(point.start)}` : shortDate(point.start),
        value: point.value,
      }))}
      format={(value) => formatValue(series.unit, value)}
    />
  );
}

function Analytics({ id }: { id: string }) {
  const [days, setDays] = useState<Days>(30);
  const report = useQuery({
    queryKey: ["organization", id, "analytics", days],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/analytics", { params: { path: { organizationId: id }, query: { days } } })),
  });
  const metrics = report.data?.metrics ?? [];
  const headline = HEADLINE.map((key) => metrics.find((metric) => metric.key === key)).filter((metric) => metric !== undefined);
  const others = metrics.filter((metric) => !HEADLINE.includes(metric.key));
  const weekly = report.data?.series.find((series) => series.key === "work.completed_weekly");
  const usage = report.data?.series.filter((series) => series.key.startsWith("usage.")) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Is work finishing faster, with fewer interventions and quicker answers?"
        actions={
        <div className="flex items-center gap-3 text-[13px]">
          <label htmlFor="analytics-period" className="text-text-secondary">
            Period
          </label>
          <select
            id="analytics-period"
            value={days}
            onChange={(event) => setDays(Number(event.target.value) as Days)}
            className="h-9 rounded-lg border border-border bg-background px-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        }
      />
      {report.error ? <Alert tone="error">{errorText(report.error)}</Alert> : null}

      {report.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {headline.map((metric) => (
              <Tile key={metric.key} metric={metric} />
            ))}
          </div>
          {weekly ? (
            <Card>
              <Chart series={weekly} />
            </Card>
          ) : null}
          <Card title="More measures">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((metric) => (
                <Tile key={metric.key} metric={metric} />
              ))}
            </div>
          </Card>
          <Card title="By type of work">
            {report.data.workTypes.length === 0 ? (
              <p className="text-sm text-text-secondary">No work was created in this period.</p>
            ) : (
              <table className="w-full text-left text-sm" data-testid="work-types">
                <thead className="text-text-secondary">
                  <tr>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 text-right font-medium">Created</th>
                    <th className="py-2 text-right font-medium">Completed</th>
                    <th className="py-2 text-right font-medium">Completion rate</th>
                    <th className="py-2 text-right font-medium">Median time</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.workTypes.map((type) => (
                    <tr key={type.type} className="border-t border-border">
                      <td className="py-2">{type.type}</td>
                      <td className="py-2 text-right tabular-nums">{type.created}</td>
                      <td className="py-2 text-right tabular-nums">{type.completed}</td>
                      <td className="py-2 text-right tabular-nums">{formatValue("PERCENT", type.completionRate)}</td>
                      <td className="py-2 text-right tabular-nums">{formatValue("SECONDS", type.medianCompletionSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title="Usage">
            <div className="grid gap-6 md:grid-cols-2">
              {usage.map((series) => (
                <Chart key={series.key} series={series} />
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <>
      <Analytics id={organizationId} />
    </>
  );
}
