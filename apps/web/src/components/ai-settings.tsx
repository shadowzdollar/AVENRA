"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

/** Millionths of a US dollar as dollars, e.g. 1234 → "$0.0012". */
export function formatCost(micros: number): string {
  const dollars = micros / 1_000_000;
  return `$${dollars < 1 ? dollars.toFixed(4) : dollars.toFixed(2)}`;
}

export function useAiSettings(organizationId: string) {
  return useQuery({
    queryKey: ["organization", organizationId, "ai", "settings"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/ai/settings", { params: { path: { organizationId } } })),
  });
}

/**
 * Whether clients' documents may be read automatically (ADR-030): off until an owner switches it
 * on; owners and admins see what the readings cost.
 */
export function AiSettingsCard({ organizationId, permissions }: { organizationId: string; permissions: Set<string> }) {
  const queries = useQueryClient();
  const settings = useAiSettings(organizationId);
  const canManage = permissions.has("ai.manage");
  const canRead = permissions.has("ai.read");
  const usage = useQuery({
    queryKey: ["organization", organizationId, "ai", "usage"],
    enabled: canRead,
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/ai/usage", { params: { path: { organizationId } } })),
  });
  const update = useMutation({
    mutationFn: async (documentReading: boolean) =>
      unwrap(
        await api.PUT("/api/v1/organizations/{organizationId}/ai/settings", {
          params: { path: { organizationId } },
          body: { documentReading },
        }),
      ),
    onSettled: () => void queries.invalidateQueries({ queryKey: ["organization", organizationId, "ai"] }),
  });
  const on = settings.data?.documentReading ?? false;

  return (
    <Card title="Automatic document reading">
      <div className="flex flex-col gap-3 text-sm" data-testid="ai-settings">
        <p>
          When this is on, documents your clients upload are read automatically to check them against the checks you define: what
          kind of document it is, and the fields you ask for. The results only flag answers for a person; they never reject or
          accept anything. Documents are sent to the AI provider for reading, and your clients are told so on their request page.
        </p>
        <p className="font-medium" data-testid="ai-status">
          Reading is {on ? "on" : "off"}.
        </p>
        {canManage ? (
          <div>
            <Button variant={on ? "secondary" : "primary"} busy={update.isPending} onClick={() => update.mutate(!on)}>
              {on ? "Switch reading off" : "Switch reading on"}
            </Button>
          </div>
        ) : (
          <p className="text-text-secondary">Only an owner can change this.</p>
        )}
        {update.error ? <Alert tone="error">{update.error instanceof ApiError ? update.error.message : "Something went wrong."}</Alert> : null}
        {usage.data ? (
          <div data-testid="ai-usage">
            <p>
              Today: {usage.data.today.calls} of {usage.data.dailyCallLimit} readings · {usage.data.today.inputTokens + usage.data.today.outputTokens}{" "}
              tokens · about {formatCost(usage.data.today.estimatedCostMicros)}
            </p>
            {usage.data.invocations.length > 0 ? (
              <table className="mt-2 w-full text-left">
                <thead className="text-text-secondary">
                  <tr>
                    <th className="py-1 font-normal">When</th>
                    <th className="py-1 font-normal">Model</th>
                    <th className="py-1 font-normal">Outcome</th>
                    <th className="py-1 font-normal">Tokens</th>
                    <th className="py-1 font-normal">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usage.data.invocations.slice(0, 20).map((call) => (
                    <tr key={call.id}>
                      <td className="py-1">{new Date(call.createdAt).toLocaleString()}</td>
                      <td className="py-1">{call.model ?? call.modelRequested}</td>
                      <td className="py-1">{call.outcome.toLowerCase().replace("_", " ")}</td>
                      <td className="py-1">{call.inputTokens + call.outputTokens}</td>
                      <td className="py-1">{call.estimatedCostMicros !== undefined && call.estimatedCostMicros !== null ? formatCost(call.estimatedCostMicros) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
