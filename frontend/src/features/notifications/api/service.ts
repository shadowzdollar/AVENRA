import { api, unwrap, unwrapEmpty } from '@/lib/api-client';

export function listNotifications() {
  return unwrap(api.GET('/api/v1/notifications'));
}

export function markNotificationRead(notificationId: string) {
  return unwrapEmpty(
    api.POST('/api/v1/notifications/{notificationId}/read', {
      params: { path: { notificationId } }
    })
  );
}

export function markAllNotificationsRead() {
  return unwrapEmpty(api.POST('/api/v1/notifications/read'));
}
