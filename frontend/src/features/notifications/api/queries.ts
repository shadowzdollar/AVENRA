import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live } from '@/lib/live';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './service';

export const notificationQueries = {
  all: () => ['notifications'] as const,
  list: () =>
    queryOptions({
      queryKey: notificationQueries.all(),
      queryFn: listNotifications,
      ...live
    })
};

export const notificationMutations = {
  read: () => mutationOptions({ mutationFn: (id: string) => markNotificationRead(id) }),
  readAll: () => mutationOptions({ mutationFn: () => markAllNotificationsRead() })
};
