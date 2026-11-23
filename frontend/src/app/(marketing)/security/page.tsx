import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Security Architecture | Avenra',
  description:
    'Deep dive into Avenra’s multi-tenant PostgreSQL Row-Level Security (RLS), ClamAV document scanning, application-level encryption, and SOC-2 compliance controls.'
};

const UPLOAD_PIPELINE = [
  {
    step: '01',
    title: 'Size & MIME Enforcement',
    description:
      'RequestBodySizeLimitFilter rejects oversized payloads before buffering; allowed MIME types are checked against the requirement schema.'
  },
  {
    step: '02',
    title: 'ClamAV Stream Scanning (ADR-021)',
    description:
      'Every uploaded byte streams through an isolated ClamAV daemon. Infected files are rejected immediately and never written to object storage.'
  },
  {
    step: '03',
    title: 'SHA-256 Fingerprinting (ADR-020)',
    description:
      'Clean files are cryptographically hashed and stored in tenant-prefixed S3 object storage with immutable metadata.'
  },
  {
    step: '04',
    title: 'Scoped Access & Audit',
    description:
      'Downloads require explicit organization permissions and emit an audit trail entry recording actor, timestamp, and document digest.'
  }
];

const COMPLIANCE_MAP = [
  {
    pillar: 'Tenant Isolation (ADR-005)',
    control: 'PostgreSQL RLS + non-owner app role',
    evidence: 'Automated cross-tenant isolation integration tests run on every CI build.'
  },
  {
    pillar: 'Secrets & Credentials (ADR-017)',
    control: 'Application-level envelope encryption with rotatable key IDs',
    evidence: 'Zero plaintext tokens in database columns or structured JSON logs.'
  },
  {
    pillar: 'Abuse Protection (ADR-016)',
    control: 'Redis sliding-window rate limits + CSRF double-submit cookies',
    evidence: 'Protects auth, password reset, and public client portal endpoints.'
  },
  {
    pillar: 'Authorization Integrity (§143)',
    control: 'Explicit permission checks (work.approve, billing.manage)',
    evidence: 'Enforced in domain services and verified by ArchUnit boundary tests.'
  },
  {
    pillar: 'Auditability & Non-Repudiation',
    control: 'Append-only audit ledger with UTC timestamps & request trace IDs',
    evidence: 'Every state transition, exception override, and export is permanently logged.'
  }
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        pill='Security Whitepaper · Defense in Depth'
        title='Enforced at the database, verified on every commit'
        description='Professional services firms handle tax returns, audit workpapers, and corporate filings. Avenra enforces tenant boundaries inside PostgreSQL itself—backed by malware scanning, encryption, and automated isolation tests.'
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Inspect ADR index', href: '/docs' }}
      />
      <DottedRule />

      {/* PostgreSQL RLS Deep Dive */}
      <Frame className='grid lg:grid-cols-2'>
        <div className='space-y-5 border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <SectionHeading
            title='Database-enforced Row-Level Security (RLS)'
            description='Even if an application query forgot a WHERE clause, PostgreSQL itself refuses to return rows belonging to another organization.'
          />
          <ul className='space-y-3 text-sm'>
            <li className='flex items-start gap-2.5'>
              <Icons.lock className='mt-0.5 size-4 shrink-0 text-cyan-500' />
              <span className='text-muted-foreground'>
                <strong className='text-foreground'>Server-side tenant resolution:</strong> Organization context is derived exclusively from the authenticated session—never from client-supplied headers or IDs.
              </span>
            </li>
            <li className='flex items-start gap-2.5'>
              <Icons.lock className='mt-0.5 size-4 shrink-0 text-cyan-500' />
              <span className='text-muted-foreground'>
                <strong className='text-foreground'>Least-privilege DB roles:</strong> Schema migrations run under an owner role; runtime traffic runs under a restricted app role that cannot bypass RLS.
              </span>
            </li>
            <li className='flex items-start gap-2.5'>
              <Icons.lock className='mt-0.5 size-4 shrink-0 text-cyan-500' />
              <span className='text-muted-foreground'>
                <strong className='text-foreground'>Proven by tests:</strong> Cross-tenant read and write attempts are asserted to fail in our automated test suite.
              </span>
            </li>
          </ul>
        </div>

        <div className='bg-muted/20 flex flex-col justify-center p-6 md:p-10'>
          <p className='text-muted-foreground mb-3 font-mono text-xs uppercase'>
            PostgreSQL Migration · Tenant Isolation Policy
          </p>
          <pre className='bg-card overflow-x-auto rounded-xl border p-5 font-mono text-xs leading-relaxed'>
            {`ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items FORCE ROW LEVEL SECURITY;

CREATE POLICY work_items_tenant_isolation
  ON work_items
  USING (
    organization_id =
      current_setting('avenra.organization_id', true)::uuid
  )
  WITH CHECK (
    organization_id =
      current_setting('avenra.organization_id', true)::uuid
  );`}
          </pre>
        </div>
      </Frame>
      <DottedRule />

      {/* Document Security Pipeline */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Zero-trust document ingestion pipeline'
            description='Client uploads pass through four security gates before any team member or AI worker can read them.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {UPLOAD_PIPELINE.map((item, i) => (
            <div
              key={item.step}
              className={cn(
                'space-y-3 border-b p-6 md:p-8 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs font-semibold'>
                GATE {item.step}
              </span>
              <h3 className='text-lg font-medium'>{item.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      {/* Compliance & Control Mapping */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Security controls & verification evidence'
            description='A concise reference for firm IT teams, compliance officers, and external security reviewers.'
          />
        </div>
        <div className='overflow-x-auto border-t'>
          <table className='w-full min-w-[680px] border-collapse text-left'>
            <thead>
              <tr className='bg-muted/30 border-b text-xs uppercase tracking-wider'>
                <th className='px-6 py-4 font-semibold md:px-10'>Domain</th>
                <th className='px-6 py-4 font-semibold'>Technical Control</th>
                <th className='px-6 py-4 font-semibold'>Verification Evidence</th>
              </tr>
            </thead>
            <tbody className='divide-y text-sm'>
              {COMPLIANCE_MAP.map((row) => (
                <tr key={row.pillar} className='hover:bg-muted/20 transition-colors'>
                  <td className='px-6 py-4 font-medium md:px-10'>{row.pillar}</td>
                  <td className='px-6 py-4'>{row.control}</td>
                  <td className='text-muted-foreground px-6 py-4'>{row.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>
            Reviewing Avenra for your firm’s compliance program?
          </h2>
          <p className='text-muted-foreground text-sm'>
            Read our detailed FAQ or spin up an isolated trial workspace in minutes.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/faq' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            Read security FAQ
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
