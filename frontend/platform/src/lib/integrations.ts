import type { components } from "@avenra/contracts";

type Connection = components["schemas"]["IntegrationConnection"];
type EventType = components["schemas"]["IntegrationEventType"];

export const EVENT_LABELS: Record<EventType, string> = {
  "work.completed": "Work completed",
  "information.answer_received": "An answer was received",
  "request.expired": "A request expired before it was complete",
};

export const PROVIDER_LABELS: Record<Connection["provider"], string> = {
  WEBHOOK: "Webhook",
  S3_EXPORT: "Storage export (S3-compatible)",
};

/** One line describing where a connection sends data, never including secrets. */
export function destination(connection: Connection): string {
  if (connection.provider === "WEBHOOK") {
    return connection.settings.url ?? "";
  }
  const where = connection.settings.endpoint ? new URL(connection.settings.endpoint).host : "AWS S3";
  return `${where} · ${connection.settings.bucket ?? ""}/${connection.settings.prefix ?? ""}`;
}

export function statusText(connection: Connection): string {
  if (connection.status === "PAUSED") {
    return connection.consecutiveFailures > 0 ? `Paused after ${connection.consecutiveFailures} failed deliveries` : "Paused";
  }
  return connection.status === "ACTIVE" ? "Active" : "Revoked";
}
