import { requireSession } from '@/lib/auth/server';
import PageContainer from '@/components/layout/page-container';
import { AiChatDemo } from '@/features/ai-chat/components/ai-chat-demo';

export const metadata = {
  title: 'Dashboard: Agent Intelligence'
};

export default async function Page() {
  await requireSession();

  return (
    <PageContainer
      pageTitle='Agent Intelligence'
      pageDescription='Ask the agent to plan the remaining steps for a piece of work. Every plan waits for human approval.'
    >
      <AiChatDemo />
    </PageContainer>
  );
}
