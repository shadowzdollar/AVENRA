import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'High-Severity Exception Flagged',
    body: 'Box 12 deferral mismatch in Form 1120-S for Apex Holdings Inc requires CPA sign-off.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actions: [
      {
        id: 'open-exception',
        label: 'Triage Exception',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '2',
    title: 'Client Documents Ingested',
    body: 'Vanguard Logistics Ltd submitted Q3 Customs MRN documents via secure request link.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actions: [
      {
        id: 'view-product',
        label: 'View Engagement',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '3',
    title: 'Evidence Pack Hashed & Signed',
    body: 'SOC-2 Type II audit bundle cryptographically signed and stored in Evidence Vault.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actions: [
      {
        id: 'view-evidence',
        label: 'Inspect Vault',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '4',
    title: 'Deterministic Rules Passed',
    body: '10/10 TIN & withholding validations complete for Summit Creative Collective.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    actions: [
      {
        id: 'open',
        label: 'View on Board',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '5',
    title: 'Automated Reminder Dispatched',
    body: '48h follow-up email delivered to Northwind Health Systems for management rep letter.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actions: [
      {
        id: 'view-product',
        label: 'View Engagement',
        type: 'redirect',
        style: 'primary'
      }
    ]
  }
];

export const useNotificationStore = create<NotificationState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    notifications: mockNotifications,

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
      })),

    unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
  })
  //   ,
  //   { name: 'notifications' }
  // )
);
