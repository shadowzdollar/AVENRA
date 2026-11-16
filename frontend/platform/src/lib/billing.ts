import type { components } from "@avenra/contracts";

type Subscription = components["schemas"]["Subscription"];
type Limit = components["schemas"]["BillingLimit"];

/** A limit's amount as a person reads it; bytes become KB, MB or GB. */
export function amount(limit: Limit, value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Unlimited";
  }
  if (limit !== "documents.bytes") {
    return value.toLocaleString("en");
  }
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? size : size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
}

/** How full a limit is, 0–100; unlimited is never full. */
export function fullness(used: number, allowed: number | null | undefined): number {
  if (allowed === null || allowed === undefined || allowed <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / allowed) * 100));
}

function day(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" }) : "";
}

/** One sentence about where the subscription stands. */
export function standingText(subscription: Subscription): string {
  const ends = subscription.cancelAtPeriodEnd ? " It ends at the end of the period." : "";
  switch (subscription.status) {
    case "TRIALING":
      return `Trial until ${day(subscription.trialEndsAt)}.${ends}`;
    case "ACTIVE":
      return subscription.currentPeriodEnd
        ? `Active; the current period ends ${day(subscription.currentPeriodEnd)}.${ends}`
        : `Active.${ends}`;
    case "PAST_DUE":
      return subscription.inGoodStanding
        ? "A payment is overdue. Please update the payment to keep adding work."
        : "A payment is overdue, so nothing new can be added. Your records stay available.";
    case "CANCELED":
      return "Canceled. Nothing new can be added; your records stay available. Choose a plan to continue.";
  }
}
