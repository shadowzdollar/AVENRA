import type { components } from "@avenra/contracts";
import type { Tone } from "@/components/ui";
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

/** The pill tone of a work status: status colours only for real states (§144.3). */
export function statusTone(status: WorkStatus): Tone {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "FAILED":
      return "error";
    case "BLOCKED":
      return "warning";
    case "RUNNING":
    case "WAITING_FOR_INFORMATION":
    case "WAITING_FOR_APPROVAL":
      return "brand";
    default:
      return "neutral";
  }
}

/** Whether the work is still going (not completed or cancelled). */
export function isOpen(status: WorkStatus): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED";
}

/** The path from intent to verified completion, as shown on a work item. */
export const STAGES = ["Defined", "Ready", "Collecting", "Approving", "Completed"] as const;

/** Where a status sits on that path; blocked and failed work shows where it stopped. */
export function stageIndex(status: WorkStatus): number {
  switch (status) {
    case "DRAFT":
      return 0;
    case "READY":
      return 1;
    case "RUNNING":
    case "WAITING_FOR_INFORMATION":
    case "BLOCKED":
    case "FAILED":
      return 2;
    case "WAITING_FOR_APPROVAL":
      return 3;
    case "COMPLETED":
      return 4;
    case "CANCELLED":
      return 0;
  }
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
