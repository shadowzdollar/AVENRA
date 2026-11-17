import { requireSession } from '@/lib/auth/server';
import WorkspacesView from './workspaces-view';

export default async function Page() {
  await requireSession();
  return <WorkspacesView />;
}
