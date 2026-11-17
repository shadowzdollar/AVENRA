import { requireSession } from '@/lib/auth/server';
import { PieGraph } from '@/features/overview/components/pie-graph';

export default async function Stats() {
  await requireSession();
  return <PieGraph />;
}
