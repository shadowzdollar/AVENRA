import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
// import { persist } from 'zustand/middleware';

export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  description?: string;
  assignee?: string;
  dueDate?: string;
};

type KanbanState = {
  columns: Record<string, Task[]>;
  setColumns: (columns: Record<string, Task[]>) => void;
  addTask: (title: string, description?: string) => void;
};

const initialColumns: Record<string, Task[]> = {
  intake: [
    {
      id: '1',
      title: 'Northwind Legal — Annual Corporate Tax Return',
      priority: 'high',
      assignee: 'Sarah Chen',
      dueDate: '2026-11-20',
      description: 'Magic link dispatched to CFO; awaiting 1099-MISC & W-2 packages'
    },
    {
      id: '2',
      title: 'Halden & Co. — SOC 2 Type II Continuous Evidence Pack',
      priority: 'medium',
      assignee: 'Marcus Rivera',
      dueDate: '2026-11-24',
      description: 'Collecting AWS IAM & CloudTrail access logs'
    }
  ],
  verifying: [
    {
      id: '3',
      title: 'Meridian Capital — Form 1040 & Schedule C Extraction',
      priority: 'high',
      assignee: 'Alex Turner',
      dueDate: '2026-11-18',
      description: 'AI OCR parsing EIN, gross receipts, and depreciation deductions'
    },
    {
      id: '4',
      title: 'Brightline Studio — Master Service Agreement & SOW',
      priority: 'medium',
      assignee: 'Emily Nakamura',
      dueDate: '2026-11-19',
      description: 'Verifying cryptographic digital signatures against DocuSign envelope'
    }
  ],
  exceptions: [
    {
      id: '5',
      title: 'Oakmont Partners — W-2 Line 12 Discrepancy',
      priority: 'high',
      assignee: 'Jordan Kim',
      dueDate: '2026-11-17',
      description: 'Box 12 reported amount does not match payroll journal; requires manual approval'
    }
  ],
  completed: [
    {
      id: '6',
      title: 'Kestrel Advisory — Client KYC & Beneficial Ownership Pack',
      priority: 'high',
      assignee: 'Sarah Chen',
      dueDate: '2026-11-15',
      description: 'All 8 identity proofs verified; SHA-256 evidence manifest locked'
    },
    {
      id: '7',
      title: 'Atlas BioCorp — Contractor W-9 Batch Intake',
      priority: 'low',
      assignee: 'Priya Sharma',
      dueDate: '2026-11-14',
      description: '14/14 W-9 TIN validations passed successfully'
    }
  ]
};

export const useTaskStore = create<KanbanState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set) => ({
    columns: initialColumns,

    setColumns: (columns) => set({ columns }),

    addTask: (title, description) =>
      set((state) => ({
        columns: {
          ...state.columns,
          backlog: [
            {
              id: uuid(),
              title,
              description,
              priority: 'medium' as Priority,
              assignee: undefined,
              dueDate: undefined
            },
            ...(state.columns.backlog ?? [])
          ]
        }
      }))
  })
  //   ,
  //   { name: 'kanban-store' }
  // )
);
