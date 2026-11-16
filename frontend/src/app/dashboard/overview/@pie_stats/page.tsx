import { auth } from '@clerk/nextjs/server';
import { PieGraph } from '@/features/overview/components/pie-graph';

export default async function Stats() {
  await auth.protect();
  return <PieGraph />;
}
