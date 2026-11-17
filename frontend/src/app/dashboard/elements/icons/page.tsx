import { requireSession } from '@/lib/auth/server';
import IconsViewPage from '@/features/elements/components/icons-view-page';

export const metadata = {
  title: 'Dashboard: Exception Queue'
};

export default async function page() {
  await requireSession();

  return <IconsViewPage />;
}
