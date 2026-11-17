import { requireSession } from '@/lib/auth/server';
import PageContainer from '@/components/layout/page-container';
import FormsShowcasePage from '@/features/forms/components/forms-showcase-page';

export const metadata = {
  title: 'Dashboard: Intake Wizard'
};

export default async function Page() {
  await requireSession();

  return (
    <PageContainer
      pageTitle='Intake Wizard'
      pageDescription='Set up new client work, list what to collect, and send the request in one flow.'
    >
      <FormsShowcasePage />
    </PageContainer>
  );
}
