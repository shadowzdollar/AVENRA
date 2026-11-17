import { requireSession } from '@/lib/auth/server';
import PageContainer from '@/components/layout/page-container';
import ClientRequestDispatcher from '@/features/forms/components/client-request-dispatcher';

export const metadata = {
  title: 'Dashboard: Quick Dispatch'
};

type PageProps = { searchParams: Promise<{ workId?: string }> };

export default async function Page(props: PageProps) {
  await requireSession();
  const { workId } = await props.searchParams;

  return (
    <PageContainer
      pageTitle='Quick Dispatch'
      pageDescription='Send a client request for one piece of work in a few clicks.'
    >
      <ClientRequestDispatcher initialWorkId={workId} />
    </PageContainer>
  );
}
