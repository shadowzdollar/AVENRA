import { requireSession } from '@/lib/auth/server';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStats() {
  await requireSession();
  return <AreaGraph />;
}
