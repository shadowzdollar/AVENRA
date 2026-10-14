import type { components } from "@avenra/contracts";
import { ApiError } from "./api";

export type WorkStatus = components["schemas"]["WorkStatus"];
export type RequirementState = components["schemas"]["RequirementState"];
export type RequirementKind = components["schemas"]["RequirementKind"];
export type Completeness = components["schemas"]["Completeness"];

const STATUS_LABELS: Record<WorkStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  RUNNING: "Running",
  WAITING_FOR_INFORMATION: "Waiting for information",
  WAITING_FOR_APPROVAL: "Waiting for approval",
  BLOCKED: "Blocked",
  FAILED: "Failed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function statusLabel(status: WorkStatus): string {
  return STATUS_LABELS[status];
}

/** Moving to these statuses must be explained (ADR-018). */
export function needsReason(status: WorkStatus): boolean {
  return status === "BLOCKED" || status === "FAILED" || status === "CANCELLED";
}

const STATE_LABELS: Record<RequirementState, string> = {
  MISSING: "Missing",
  SUBMITTED: "Awaiting review",
  ACCEPTED: "Accepted",
  REJECTED: "Needs correction",
};

export function stateLabel(state: RequirementState): string {
  return STATE_LABELS[state];
}

/** Status colours only for real states (Guidelines §144). */
export function stateTone(state: RequirementState): string {
  return {
    MISSING: "text-text-secondary",
    SUBMITTED: "text-brand",
    ACCEPTED: "text-success",
    REJECTED: "text-error",
  }[state];
}

export const KIND_LABELS: Record<RequirementKind, string> = {
  DOCUMENT: "File",
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  BOOLEAN: "Yes / no",
};

export function inputTypeFor(kind: RequirementKind): string {
  return kind === "NUMBER" ? "text" : kind === "DATE" ? "date" : "text";
}

/** "3 of 5 accepted" with a proportion for a progress bar. */
export function completenessSummary(completeness: Completeness): { text: string; ratio: number } {
  if (completeness.required === 0) {
    return { text: "Nothing required yet", ratio: 0 };
  }
  return {
    text: `${completeness.accepted} of ${completeness.required} accepted`,
    ratio: completeness.accepted / completeness.required,
  };
}

export function errorText(error: unknown): string | null {
  return error instanceof ApiError ? error.message : error ? "Something went wrong. Please try again." : null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sends one file as multipart/form-data in the part the contract names `file`. */
export function fileBody(file: File): { body: { file: string }; bodySerializer: () => FormData } {
  const form = new FormData();
  form.append("file", file, file.name);
  return { body: { file: "" }, bodySerializer: () => form };
}
