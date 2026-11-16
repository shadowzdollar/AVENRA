import { auth } from '@clerk/nextjs/server';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStats() {
  await auth.protect();
  return <AreaGraph />;
}
