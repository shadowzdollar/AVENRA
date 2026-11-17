'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationAction, NotificationStatus } from '@/components/ui/notification-card';
import { notificationMutations, notificationQueries } from '../api/queries';
import type { Notification as ApiNotification, NotificationCategory } from '../api/types';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

/** Where each category's button leads when the notification has no deeper link. */
const CATEGORY_ACTION: Record<NotificationCategory, { route: string; label: string }> = {
  exception: { route: '/dashboard/elements/icons', label: 'Triage Exception' },
  escalation: { route: '/dashboard/elements/icons', label: 'Open Exception Queue' },
  answer: { route: '/dashboard/forms/basic', label: 'View Request' },
  request: { route: '/dashboard/forms/basic', label: 'View Request' },
  approval: { route: '/dashboard/ai-chat', label: 'Review Plan' },
  integration: { route: '/dashboard/workspaces', label: 'Open Workspace' }
};

/** Maps an API deep link (`/organizations/{org}/work/{id}`) to the dashboard page that shows it. */
function dashboardRoute(n: ApiNotification): { route: string; label: string } {
  const work = n.link?.match(/\/work\/([0-9a-f-]{36})/i);
  if (work && n.category !== 'exception' && n.category !== 'escalation') {
    return { route: `/dashboard/product/${work[1]}`, label: 'Open Work' };
  }
  return CATEGORY_ACTION[n.category];
}

function toCard(n: ApiNotification): Notification {
  const action = dashboardRoute(n);
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    status: n.readAt ? 'read' : 'unread',
    createdAt: n.createdAt,
    // The action id is the route, so components can navigate without a lookup table.
    actions: [{ id: action.route, label: action.label, type: 'redirect', style: 'primary' }]
  };
}

/** Live notifications for the signed-in user (all organizations), polled while visible. */
export function useNotificationStore() {
  const queryClient = useQueryClient();
  const { data } = useQuery(notificationQueries.list());
  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationQueries.all() });
  const read = useMutation({ ...notificationMutations.read(), onSettled: invalidate });
  const readAll = useMutation({ ...notificationMutations.readAll(), onSettled: invalidate });

  const notifications = (data?.notifications ?? []).map(toCard);
  return {
    notifications,
    markAsRead: (id: string) => {
      if (notifications.find((n) => n.id === id)?.status === 'unread') read.mutate(id);
    },
    markAllAsRead: () => readAll.mutate(),
    unreadCount: () => data?.unread ?? 0
  };
}
