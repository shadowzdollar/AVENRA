import { auth } from '@clerk/nextjs/server';
import KanbanViewPage from '@/features/kanban/components/kanban-view-page';

export const metadata = {
  title: 'Dashboard: Execution Board'
};

export default async function page() {
  await auth.protect();

  return <KanbanViewPage />;
}
