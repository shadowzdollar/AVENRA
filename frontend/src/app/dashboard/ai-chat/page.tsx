import { auth } from '@clerk/nextjs/server';
import PageContainer from '@/components/layout/page-container';
import { AiChatDemo } from '@/features/ai-chat/components/ai-chat-demo';

export const metadata = {
  title: 'Dashboard: Agent Intelligence'
};

export default async function Page() {
  await auth.protect();

  return (
    <PageContainer
      pageTitle='Agent Intelligence'
      pageDescription='Autonomous execution agent: inspect OCR parsing, deterministic rule checks, and interactive client communication routines.'
    >
      <AiChatDemo />
    </PageContainer>
  );
}
