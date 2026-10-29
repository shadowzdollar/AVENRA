import type { components } from "@avenra/contracts";
import { amount } from "./billing";

type Unit = components["schemas"]["AnalyticsUnit"];

/** A duration in seconds as a person reads it: 45 s, 12 min, 3.5 h, 2.1 days. */
export function duration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  if (seconds < 86_400) {
    return `${(seconds / 3600).toFixed(1)} h`;
  }
  return `${(seconds / 86_400).toFixed(1)} days`;
}

/** A metric's value in its unit; "—" when there was nothing to measure. */
export function formatValue(unit: Unit, value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  switch (unit) {
    case "PERCENT":
      return `${value.toLocaleString("en", { maximumFractionDigits: 1 })}%`;
    case "SECONDS":
      return duration(value);
    case "BYTES":
      return amount("documents.bytes", value);
    case "COUNT":
      return value.toLocaleString("en", { maximumFractionDigits: 1 });
  }
}

/** How the value moved against the previous period, in words, or null when it cannot be said. */
export function change(unit: Unit, value: number | null | undefined, previous: number | null | undefined): string | null {
  if (value === null || value === undefined || previous === null || previous === undefined) {
    return null;
  }
  if (value === previous) {
    return "same as the period before";
  }
  const direction = value > previous ? "up" : "down";
  if (unit === "PERCENT") {
    return `${direction} ${Math.abs(value - previous).toLocaleString("en", { maximumFractionDigits: 1 })} points`;
  }
  return `${direction} from ${formatValue(unit, previous)}`;
}
