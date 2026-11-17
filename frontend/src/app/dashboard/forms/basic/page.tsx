import { requireSession } from '@/lib/auth/server';
import PageContainer from '@/components/layout/page-container';
import { ActiveRequests } from '@/features/requests/components/active-requests';

export const metadata = {
  title: 'Dashboard: Active Requests'
};

export default async function Page() {
  await requireSession();

  return (
    <PageContainer
      pageTitle='Active Requests'
      pageDescription='Every request sent to clients: who opened it, what was answered, and reminders sent. Updates live.'
    >
      <ActiveRequests />
    </PageContainer>
  );
}
