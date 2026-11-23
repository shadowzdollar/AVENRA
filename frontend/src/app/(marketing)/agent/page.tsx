import type { Metadata } from 'next';
import { AgentExperience } from '@/features/marketing/agent-experience';

export const metadata: Metadata = {
  title: 'Agent Intelligence | Avenra',
  description:
    'Interactive sandbox demonstrating Avenra’s OCR document reader, prompt-injection defense, token budgets, and human approval gates.'
};

export default function AgentPage() {
  return <AgentExperience />;
}
