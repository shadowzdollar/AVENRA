import type { components } from "@avenra/contracts";

type AuditEvent = components["schemas"]["AuditEvent"];

/** What a person filters the audit history by; empty fields are not sent. */
export type AuditFilter = { action: string; actorUserId: string; from: string; to: string };

export const NO_FILTER: AuditFilter = { action: "", actorUserId: "", from: "", to: "" };

/**
 * The query parameters for a filter. Dates from a date input are whole days in
 * the viewer's time zone; `to` includes the chosen day.
 */
export function auditQuery(filter: AuditFilter): { action?: string; actorUserId?: string; from?: string; to?: string } {
  const query: { action?: string; actorUserId?: string; from?: string; to?: string } = {};
  if (filter.action.trim()) {
    query.action = filter.action.trim();
  }
  if (filter.actorUserId) {
    query.actorUserId = filter.actorUserId;
  }
  if (filter.from) {
    query.from = new Date(`${filter.from}T00:00:00`).toISOString();
  }
  if (filter.to) {
    const end = new Date(`${filter.to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    query.to = end.toISOString();
  }
  return query;
}

/** The export link for the same filter (a plain GET, so the browser downloads it). */
export function exportHref(organizationId: string, filter: AuditFilter): string {
  const params = new URLSearchParams(auditQuery(filter));
  const query = params.toString();
  return `/api/v1/organizations/${organizationId}/audit-events/export${query ? `?${query}` : ""}`;
}

/** Who did it, as a person reads it. */
export function actor(event: AuditEvent): string {
  if (event.actorName) {
    return event.actorName;
  }
  return event.actorUserId ? "A former member" : "Avenra or a client";
}

/** The event's details on one line, e.g. `requestLinkDays: 30`. */
export function detailsText(event: AuditEvent): string {
  return Object.entries(event.details)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(", ");
}
