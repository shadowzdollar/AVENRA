import { requireSession } from '@/lib/auth/server';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  await requireSession();
  return <BarGraph />;
}
