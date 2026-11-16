import { auth } from '@clerk/nextjs/server';
import PageContainer from '@/components/layout/page-container';
import ClientRequestDispatcher from '@/features/forms/components/client-request-dispatcher';

export const metadata = {
  title: 'Dashboard: Client Requests'
};

export default async function Page() {
  await auth.protect();

  return (
    <PageContainer
      pageTitle='Client Requests'
      pageDescription='Generate tokenized document intake links for clients with automated follow-ups and requirement checklists.'
    >
      <ClientRequestDispatcher />
    </PageContainer>
  );
}
