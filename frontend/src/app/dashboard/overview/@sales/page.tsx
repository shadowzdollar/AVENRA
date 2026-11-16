import { auth } from '@clerk/nextjs/server';
import { RecentSales } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  await auth.protect();
  return <RecentSales />;
}
