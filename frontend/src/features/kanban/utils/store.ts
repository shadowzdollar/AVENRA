import type { WorkStatus, WorkSummary } from '@/features/work/api/types';
import { formatCompleteness } from '@/features/work/api/types';

export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  status: WorkStatus;
  description?: string;
  assignee?: string;
  dueDate?: string;
};

export type ColumnId = 'intake' | 'verifying' | 'exceptions' | 'completed';
export type Columns = Record<string, Task[]>;

/** Which work statuses each board column shows. Cancelled work is not on the board. */
export const COLUMN_STATUSES: Record<ColumnId, WorkStatus[]> = {
  intake: ['DRAFT', 'READY'],
  verifying: ['RUNNING', 'WAITING_FOR_INFORMATION', 'WAITING_FOR_APPROVAL'],
  exceptions: ['BLOCKED', 'FAILED'],
  completed: ['COMPLETED']
};

/** The status a card is moved to when dropped on a column; the server decides if it is allowed. */
export const COLUMN_TARGET: Record<ColumnId, WorkStatus> = {
  intake: 'READY',
  verifying: 'RUNNING',
  exceptions: 'BLOCKED',
  completed: 'COMPLETED'
};

const PRIORITY: Record<WorkSummary['priority'], Priority> = {
  URGENT: 'high',
  HIGH: 'high',
  NORMAL: 'medium',
  LOW: 'low'
};

export function toColumns(work: WorkSummary[], clientNames: Map<string, string>): Columns {
  const columns: Columns = { intake: [], verifying: [], exceptions: [], completed: [] };
  for (const w of work) {
    const column = (Object.keys(COLUMN_STATUSES) as ColumnId[]).find((c) =>
      COLUMN_STATUSES[c].includes(w.status)
    );
    if (!column) continue;
    columns[column].push({
      id: w.id,
      title: w.title,
      priority: PRIORITY[w.priority],
      status: w.status,
      description: formatCompleteness(w.completeness),
      assignee: w.clientId ? clientNames.get(w.clientId) : undefined,
      dueDate: w.dueAt?.slice(0, 10)
    });
  }
  for (const tasks of Object.values(columns)) {
    tasks.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  }
  return columns;
}

/** Finds the card that changed column between two board states, if any. */
export function findMove(before: Columns, after: Columns): { task: Task; to: ColumnId } | null {
  const location = new Map<string, string>();
  for (const [column, tasks] of Object.entries(before))
    for (const t of tasks) location.set(t.id, column);
  for (const [column, tasks] of Object.entries(after)) {
    for (const t of tasks) {
      if (location.get(t.id) !== column && column in COLUMN_TARGET)
        return { task: t, to: column as ColumnId };
    }
  }
  return null;
}
