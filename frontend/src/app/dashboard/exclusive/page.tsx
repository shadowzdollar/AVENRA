import { requireSession } from '@/lib/auth/server';
import ExclusiveView from './exclusive-view';

export default async function Page() {
  await requireSession();
  return <ExclusiveView />;
}
