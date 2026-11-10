import type { components } from "@avenra/contracts";

type RequestLink = components["schemas"]["RequestLink"];

export type RequestState = "ANSWERED" | "WAITING" | "EXPIRING" | "EXPIRED" | "REVOKED";

/** Two days before it expires, an unanswered request needs a nudge. */
const EXPIRING_WITHIN_MS = 2 * 24 * 60 * 60 * 1000;

/** Where a request stands for the team: answered, waiting, about to expire, or over. */
export function requestState(request: RequestLink, now: Date): RequestState {
  if (request.status === "REVOKED") return "REVOKED";
  if ((request.answeredCount ?? 0) >= request.requirementIds.length && request.requirementIds.length > 0) return "ANSWERED";
  if (request.status === "EXPIRED") return "EXPIRED";
  return new Date(request.expiresAt).getTime() - now.getTime() < EXPIRING_WITHIN_MS ? "EXPIRING" : "WAITING";
}
