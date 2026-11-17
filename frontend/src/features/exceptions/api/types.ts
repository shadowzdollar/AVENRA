import type { components } from '@/lib/api-client';

export type WorkException = components['schemas']['WorkException'];
export type ExceptionStatus = components['schemas']['ExceptionStatus'];

export interface ExceptionFilters {
  status?: ExceptionStatus;
  workId?: string;
  /** Only exceptions that are not resolved or dismissed. */
  open?: boolean;
}

export const EXCEPTION_TYPE_LABELS: Record<WorkException['type'], string> = {
  JOB_FAILED: 'Job failed',
  DELIVERY_FAILED: 'Delivery failed',
  REQUEST_EXPIRED_INCOMPLETE: 'Request expired incomplete',
  WORK_OVERDUE: 'Work overdue',
  MALWARE_FOUND: 'Malware found',
  HUMAN_REQUIRED: 'Human decision required',
  INCONSISTENT_INFORMATION: 'Inconsistent information'
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed'
};
