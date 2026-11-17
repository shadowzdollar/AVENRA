import type { components } from '@/lib/api-client';

export type WorkSummary = components['schemas']['WorkSummary'];
export type WorkDetail = components['schemas']['WorkDetail'];
export type WorkStatus = components['schemas']['WorkStatus'];
export type Priority = components['schemas']['Priority'];
export type Completeness = components['schemas']['Completeness'];
export type CreateWorkRequest = components['schemas']['CreateWorkRequest'];
export type WorkTransition = components['schemas']['WorkTransition'];
export type Client = components['schemas']['Client'];

export interface WorkFilters {
  status?: WorkStatus;
  clientId?: string;
  q?: string;
}

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  DRAFT: 'Draft',
  READY: 'Ready',
  RUNNING: 'Running',
  WAITING_FOR_INFORMATION: 'Waiting for information',
  WAITING_FOR_APPROVAL: 'Waiting for approval',
  BLOCKED: 'Blocked',
  FAILED: 'Failed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent'
};

/** "accepted/required (pct%)" as shown in tables. */
export function formatCompleteness(c: Completeness): string {
  if (c.required === 0) return 'No requirements';
  return `${c.accepted}/${c.required} (${Math.round((c.accepted / c.required) * 100)}%)`;
}
