import { requireSession } from '@/lib/auth/server';
import NotificationsPage from '@/features/notifications/components/notifications-page';

export const metadata = {
  title: 'Dashboard: Notifications'
};

export default async function Page() {
  await requireSession();

  return <NotificationsPage />;
}
