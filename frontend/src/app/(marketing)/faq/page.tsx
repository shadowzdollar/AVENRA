import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { DottedRule, Frame } from '@/features/landing/components/frame';
import { KnowledgeBaseFaq } from '@/features/landing/components/knowledge-base-faq';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Knowledge Base & FAQ | Avenra',
  description:
    'Searchable answers covering Avenra workflows, passwordless client portals, deterministic verification, AI governance, PostgreSQL RLS, and billing.'
};

const RELATED_PAGES = [
  {
    title: 'Platform Architecture',
    description: 'Explore state machines, domain layers, and explicit permissions.',
    href: '/platform',
    icon: 'dashboard' as const
  },
  {
    title: 'Security Whitepaper',
    description: 'Inspect PostgreSQL RLS policies, ClamAV scanning, and SHA-256 vaulting.',
    href: '/security',
    icon: 'lock' as const
  },
  {
    title: 'Integrations & Webhooks',
    description: 'Review event schemas, HMAC verification, and S3 completion manifests.',
    href: '/integrations',
    icon: 'webhook' as const
  }
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        pill='Resources · Knowledge Base'
        title='Detailed answers for partners, auditors, and engineers'
        description='Filter by topic or search across platform workflows, verification rules, AI guardrails, tenant isolation, and subscription billing.'
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read documentation', href: '/docs' }}
      />
      <DottedRule />
      <KnowledgeBaseFaq />
      <DottedRule />
      <Frame className='grid md:grid-cols-3'>
        {RELATED_PAGES.map((item, i) => {
          const Icon = Icons[item.icon];
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                'group hover:bg-muted/30 flex flex-col justify-between space-y-4 border-b p-6 transition-colors md:border-b-0 md:p-8',
                i < 2 && 'md:border-r'
              )}
            >
              <div className='space-y-3'>
                <span className='flex size-9 items-center justify-center rounded-md border'>
                  <Icon className='size-4' />
                </span>
                <h3 className='text-base font-medium group-hover:underline'>{item.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
              </div>
              <span className='text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 text-xs font-medium'>
                Read deep dive <Icons.arrowRight className='size-3.5' />
              </span>
            </Link>
          );
        })}
      </Frame>
    </>
  );
}
