import { requireSession } from '@/lib/auth/server';
import TeamView from './team-view';

export default async function Page() {
  await requireSession();
  return <TeamView />;
}
