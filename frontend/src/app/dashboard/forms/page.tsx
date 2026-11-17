import { requireSession } from '@/lib/auth/server';
import PageContainer from '@/components/layout/page-container';
import ClientRequestDispatcher from '@/features/forms/components/client-request-dispatcher';

export const metadata = {
  title: 'Dashboard: Client Requests'
};

export default async function Page() {
  await requireSession();

  return (
    <PageContainer
      pageTitle='Client Requests'
      pageDescription='Ask clients for documents and answers through a secure emailed link, with automatic follow-ups.'
    >
      <ClientRequestDispatcher />
    </PageContainer>
  );
}
