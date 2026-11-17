import { requireSession } from '@/lib/auth/server';
import { RecentSales } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  await requireSession();
  return <RecentSales />;
}
