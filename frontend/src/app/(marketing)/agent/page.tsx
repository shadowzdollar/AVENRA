import type { Metadata } from 'next';
import { Icons } from '@/components/icons';
import { AgentSection } from '@/features/landing/components/agent-section';
import { ComparisonSection } from '@/features/landing/components/closing-sections';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Agent Intelligence | Avenra',
  description:
    'Governed AI planning and document reading for professional services. Every plan waits for approval, runs have hard budgets, and AI output is never silent authorization.'
};

const GUARDRAILS = [
  {
    icon: 'listCheck' as const,
    title: 'Proposals, Never Silent Authorization',
    description:
      'Every plan drafted by the Agent is validated against strict JSON schemas and waits in a human approval queue before executing.'
  },
  {
    icon: 'lock' as const,
    title: 'High-Risk Step Gates',
    description:
      'External side effects—such as sending client reminders or finalizing sign-offs—require explicit per-step permission checks.'
  },
  {
    icon: 'creditCard' as const,
    title: 'Hard Token & Run Budgets',
    description:
      'Organizations set strict daily and per-run budgets so AI spend stays completely predictable across every engagement.'
  },
  {
    icon: 'warning' as const,
    title: 'Instant Kill-Switch & Audit Log',
    description:
      'Any authorized reviewer can halt an active run immediately. Every prompt, tool call, and approval is recorded in the audit trail.'
  }
];

export default function AgentPage() {
  return (
    <>
      <PageHero
        pill='Agent Intelligence · Governed AI'
        title='Autonomous work planning under strict human governance'
        description='Avenra’s AI Agent reads uploaded client documents, drafts step-by-step execution plans, and flags discrepancies—while your firm keeps 100% control over approvals, budgets, and compliance.'
        primaryAction={{ label: 'Start with the Agent', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read security architecture', href: '/security' }}
      />
      <DottedRule />
      <AgentSection />
      <DottedRule />
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Built-in guardrails for regulated firms'
            description='External documents are always treated as untrusted data—never instructions. Every AI action is bounded by deterministic rules.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {GUARDRAILS.map((item, i) => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.title}
                className={cn(
                  'space-y-3 border-b p-6 md:p-8 lg:border-b-0',
                  i < 3 && 'lg:border-r',
                  i % 2 === 0 && 'sm:border-r'
                )}
              >
                <span className='flex size-10 items-center justify-center rounded-md border'>
                  <Icon className='size-5' />
                </span>
                <h3 className='text-lg font-medium'>{item.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
              </div>
            );
          })}
        </div>
      </Frame>
      <DottedRule />
      <ComparisonSection />
    </>
  );
}
