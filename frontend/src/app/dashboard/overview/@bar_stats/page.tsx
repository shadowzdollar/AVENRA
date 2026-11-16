import { auth } from '@clerk/nextjs/server';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  await auth.protect();
  return <BarGraph />;
}
