'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Frame } from './frame';

type Category = 'All' | 'Platform' | 'Verification & AI' | 'Security' | 'Billing';

interface FaqItem {
  category: Exclude<Category, 'All'>;
  q: string;
  a: string;
}

const CATEGORIES: Category[] = ['All', 'Platform', 'Verification & AI', 'Security', 'Billing'];

const ITEMS: FaqItem[] = [
  {
    category: 'Platform',
    q: 'How is Avenra different from a standard project management or task tool?',
    a: 'Generic task trackers only store free-text comments and manual status dropdowns. Avenra models every engagement with explicit information requirements, deterministic verification rules, a passwordless client portal, an exception queue, and an immutable SHA-256 evidence vault backed by strict state machines.'
  },
  {
    category: 'Platform',
    q: 'Do my external clients need to create an account or remember passwords?',
    a: 'No. Every client request generates a single-purpose, cryptographically signed link scoped strictly to that engagement. Clients open it in any browser, answer structured fields, and upload files without registering. Links expire automatically (up to 30 days) and can be revoked at any moment.'
  },
  {
    category: 'Platform',
    q: 'Can we run multiple legal entities or practice lines in one account?',
    a: 'Yes. Organizations in Avenra are isolated workspaces with independent team rosters, permissions, templates, and audit logs. Staff members with multi-org access can switch workspaces seamlessly without leaking data across tenants.'
  },
  {
    category: 'Verification & AI',
    q: 'How do deterministic verification rules interact with AI document reading?',
    a: 'When a client uploads a PDF, the AI worker extracts structured fields (such as dates, balances, and institution names) validated against strict JSON schemas. Those extracted values are then evaluated by deterministic Java rules. AI never has authority to approve work or bypass a failed rule.'
  },
  {
    category: 'Verification & AI',
    q: 'What happens when a client uploads an incomplete or incorrect document?',
    a: 'The rule engine immediately flags the submission and routes it to the Exception Queue. A reviewer with the exception.resolve permission can either reject it—triggering a targeted re-request to the client—or accept an override by recording a mandatory written justification in the audit trail.'
  },
  {
    category: 'Verification & AI',
    q: 'How do you prevent prompt injection from malicious client files?',
    a: 'All external content (uploaded PDFs, emails, client text answers) is strictly isolated as untrusted data, never executable instructions. Furthermore, every AI-proposed plan waits in a human approval queue and high-risk actions require explicit per-step authorization.'
  },
  {
    category: 'Verification & AI',
    q: 'Can we control and cap AI usage costs across our firm?',
    a: 'Yes. Every organization enforces hard per-run and daily token budgets. Reviewers can inspect estimated run cost before approving a plan and halt any active execution immediately via the kill-switch.'
  },
  {
    category: 'Security',
    q: 'How is our firm’s data isolated from other organizations on Avenra?',
    a: 'Every tenant-owned table in PostgreSQL carries an organization_id column with forced Row-Level Security (RLS) policies. Runtime queries execute under a least-privilege database role that cannot bypass RLS, and tenant context is resolved strictly server-side from your authenticated session.'
  },
  {
    category: 'Security',
    q: 'Are client file uploads scanned for malware before staff download them?',
    a: 'Yes. Per ADR-021, every uploaded file is streamed through an isolated ClamAV malware scanner before entering S3 object storage. Infected or malformed files are blocked at ingestion and never reach your team.'
  },
  {
    category: 'Security',
    q: 'How does Avenra prove that an evidence file has not been altered?',
    a: 'Per ADR-020, every accepted file is fingerprinted with a SHA-256 cryptographic digest at ingestion time. That hash is stored alongside the actor identity, UTC timestamp, and rule outcome in our append-only audit ledger.'
  },
  {
    category: 'Billing',
    q: 'How does the free trial work—and do I need a credit card upfront?',
    a: 'Every new workspace starts with a full-featured free trial with no credit card required upfront. You can invite teammates, configure rules, test client portal links, and inspect the audit trail before selecting a paid tier.'
  },
  {
    category: 'Billing',
    q: 'What happens if a renewal payment fails? Do we lose access to client files?',
    a: 'Never. If a payment fails, Avenra grants a 7-day grace period with clear billing notifications. Even if a subscription pauses after the grace period, your existing engagements, evidence vault, and audit logs remain 100% readable and exportable.'
  },
  {
    category: 'Billing',
    q: 'Can we upgrade, downgrade, or add extra team seats mid-cycle?',
    a: 'Yes. Business plans include 5 seats with self-serve additional seats at $25/month prorated automatically. You can switch between monthly and annual billing or upgrade to Enterprise anytime from Dashboard → Billing.'
  }
];

export function KnowledgeBaseFaq() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string>(ITEMS[0].q);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      const matchesQuery =
        !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <Frame>
      {/* Filter & Search Bar */}
      <div className='flex flex-col justify-between gap-4 border-b px-6 py-6 md:flex-row md:items-center md:px-10'>
        <div className='flex flex-wrap gap-2'>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type='button'
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className='relative w-full md:w-72'>
          <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search questions…'
            aria-label='Search FAQ'
            className='bg-background border-input focus:ring-ring h-9 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-2'
          />
        </div>
      </div>

      {/* Accordion Results */}
      <div className='divide-y'>
        {filtered.length === 0 ? (
          <div className='px-6 py-16 text-center md:px-10'>
            <p className='text-base font-medium'>No matching answers found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Try clearing your search filter or browse another category.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = openKey === item.q;
            return (
              <div key={item.q} className='px-6 py-5 md:px-10'>
                <button
                  type='button'
                  onClick={() => setOpenKey(isOpen ? '' : item.q)}
                  aria-expanded={isOpen}
                  className='flex w-full items-start justify-between gap-4 text-left'
                >
                  <div className='space-y-1'>
                    <span className='text-muted-foreground font-mono text-[11px] uppercase'>
                      {item.category}
                    </span>
                    <h3 className='text-base font-medium md:text-lg'>{item.q}</h3>
                  </div>
                  <span className='text-muted-foreground mt-2 shrink-0'>
                    {isOpen ? <Icons.minus className='size-4' /> : <Icons.add className='size-4' />}
                  </span>
                </button>
                {isOpen && (
                  <p className='text-muted-foreground mt-3 max-w-3xl text-sm leading-relaxed'>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Escalation Bar */}
      <div className='bg-muted/20 flex flex-col items-start justify-between gap-4 border-t px-6 py-8 md:flex-row md:items-center md:px-10'>
        <div>
          <p className='text-base font-medium'>Still have a specific question for your firm?</p>
          <p className='text-muted-foreground text-sm'>
            Read our technical documentation or launch a free workspace to test Avenra directly.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/docs' className={cn(buttonVariants({ variant: 'outline' }), 'h-9 px-4')}>
            Read documentation
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-9 gap-1.5 px-4')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </div>
    </Frame>
  );
}
