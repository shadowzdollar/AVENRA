import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Platform Architecture | Avenra',
  description:
    'Deep dive into Avenra’s work execution state machine, deterministic rule engine, evidence vault, explicit permission model, and modular system topology.'
};

const LIFECYCLE_STATES = [
  {
    state: 'DRAFT',
    actor: 'Firm Staff',
    guard: 'work.write',
    summary: 'Engagement scoped with client entity, due dates, requirements, and deterministic rules.'
  },
  {
    state: 'REQUESTED',
    actor: 'Request Dispatcher',
    guard: 'request.send',
    summary: 'Single-purpose, expiring portal link dispatched via SMTP/email with automated reminder cadence.'
  },
  {
    state: 'COLLECTING',
    actor: 'External Client',
    guard: 'Token Scoped',
    summary: 'Client answers structured fields and uploads documents without creating an account.'
  },
  {
    state: 'VERIFYING',
    actor: 'Rule Engine + ClamAV',
    guard: 'Deterministic',
    summary: 'Uploads are malware-scanned, hashed with SHA-256, and checked against every attached rule.'
  },
  {
    state: 'EXCEPTION_OPEN',
    actor: 'Reviewer',
    guard: 'exception.resolve',
    summary: 'Failed checks route to the Exception Queue; reviewer rejects or overrides with recorded reason.'
  },
  {
    state: 'COMPLETED',
    actor: 'Approver',
    guard: 'work.approve',
    summary: 'All requirements verified; immutable manifest archived to S3 and work.completed webhook fires.'
  }
];

const ANATOMY_BLOCKS = [
  {
    layer: '01 · Engagement Record',
    title: 'Work Item & Requirements',
    description:
      'Every client job is modeled as a strongly-typed Work entity containing discrete Information Requirements (structured fields, dates, numbers, or file uploads).',
    fields: ['workId (UUIDv7)', 'organizationId (RLS)', 'clientId & dueAt', 'requirements[]']
  },
  {
    layer: '02 · Deterministic Gate',
    title: 'Verification Rules (ADR-024)',
    description:
      'Rules attach directly to requirements and execute automatically on submission—checking file MIME types, period coverage, numeric ranges, and required signatures.',
    fields: ['ruleType & severity', 'deterministicEvaluator', 'pass / fail outcome', 'exceptionTrigger']
  },
  {
    layer: '03 · Cryptographic Proof',
    title: 'Evidence Vault (ADR-020)',
    description:
      'Accepted answers and scanned files are stored as immutable Evidence records linked to their exact SHA-256 digest, actor identity, and UTC timestamp.',
    fields: ['sha256Digest', 'clamAvScanStatus', 's3ObjectKey', 'recordedAt (UTC)']
  },
  {
    layer: '04 · Accountability',
    title: 'Exception & Audit Trail',
    description:
      'No status is ever overwritten silently. Every transition, rejection, or manual override creates an append-only audit event queryable for external regulators.',
    fields: ['actorId & permission', 'fromState → toState', 'overrideJustification', 'requestId (trace)']
  }
];

const PERMISSION_MATRIX = [
  {
    permission: 'work.read',
    scope: 'View engagements, client requests, and evidence vault items in active organization.',
    preparer: true,
    reviewer: true,
    partner: true
  },
  {
    permission: 'work.write',
    scope: 'Create engagements, edit requirements, and dispatch expiring client portal links.',
    preparer: true,
    reviewer: true,
    partner: true
  },
  {
    permission: 'exception.resolve',
    scope: 'Reject failed submissions or accept exceptions with a mandatory recorded justification.',
    preparer: false,
    reviewer: true,
    partner: true
  },
  {
    permission: 'work.approve',
    scope: 'Sign off verified engagements and transition work to the immutable COMPLETED state.',
    preparer: false,
    reviewer: false,
    partner: true
  },
  {
    permission: 'agent.approve',
    scope: 'Approve AI-proposed execution plans and high-risk external side effects.',
    preparer: false,
    reviewer: true,
    partner: true
  },
  {
    permission: 'billing.manage',
    scope: 'Manage organization subscription plans, seats, and payment methods.',
    preparer: false,
    reviewer: false,
    partner: true
  }
];

const TOPOLOGY = [
  {
    component: 'Next.js Web App',
    tech: 'Next.js 16 · React 19 · TypeScript',
    role: 'Command Center, Kanban board, Exception Queue, and passwordless Client Portal.'
  },
  {
    component: 'Core API Monolith',
    tech: 'Spring Boot 4 · Spring Modulith · Java',
    role: 'System of record enforcing state machines, RLS tenant context, and OpenAPI 3.1 contracts.'
  },
  {
    component: 'AI Execution Worker',
    tech: 'FastAPI · Python · Schema Validators',
    role: 'Isolated service for OCR document reading and governed plan proposals under hard token budgets.'
  },
  {
    component: 'Data & Storage Layer',
    tech: 'PostgreSQL 18 (RLS) · Redis · S3 · ClamAV',
    role: 'Row-level tenant isolation, sliding-window rate limits, malware scanning, and SHA-256 object storage.'
  }
];

export default function PlatformPage() {
  return (
    <>
      <PageHero
        pill='Platform Deep Dive'
        title='Inside Avenra’s deterministic work execution engine'
        description='Avenra is not a generic task tracker. It is a state-machine-backed system of record that enforces how client information is requested, scanned, verified, excepted, and archived.'
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read API documentation', href: '/docs' }}
      />
      <DottedRule />

      {/* State Machine Lifecycle */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Explicit state machines—never arbitrary status writes'
            description='Every engagement moves through validated transitions. A work item cannot jump to COMPLETED while required evidence is missing or an exception remains unresolved.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-3'>
          {LIFECYCLE_STATES.map((item, i) => (
            <div
              key={item.state}
              className={cn(
                'flex flex-col justify-between space-y-4 border-b p-6 md:p-8',
                i % 3 !== 2 && 'lg:border-r',
                i >= 3 && 'lg:border-b-0'
              )}
            >
              <div className='space-y-3'>
                <div className='flex items-center justify-between gap-2'>
                  <code className='bg-primary/10 text-primary rounded px-2.5 py-1 font-mono text-xs font-semibold'>
                    {item.state}
                  </code>
                  <span className='text-muted-foreground font-mono text-xs'>0{i + 1}</span>
                </div>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.summary}</p>
              </div>
              <div className='flex items-center justify-between border-t pt-3 text-xs'>
                <span className='text-muted-foreground'>Actor: {item.actor}</span>
                <code className='bg-muted rounded px-2 py-0.5 font-mono text-[11px]'>
                  {item.guard}
                </code>
              </div>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      {/* Anatomy of a Work Engagement */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Anatomy of a verified engagement'
            description='Four tightly linked domain layers guarantee that every client answer and file is traceable from intake to final sign-off.'
          />
        </div>
        <div className='grid border-t md:grid-cols-2'>
          {ANATOMY_BLOCKS.map((block, i) => (
            <div
              key={block.title}
              className={cn(
                'space-y-4 border-b p-6 md:p-10',
                i % 2 === 0 && 'md:border-r',
                i >= 2 && 'md:border-b-0'
              )}
            >
              <p className='text-muted-foreground font-mono text-xs uppercase tracking-wider'>
                {block.layer}
              </p>
              <h3 className='text-xl font-medium tracking-tight'>{block.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{block.description}</p>
              <div className='flex flex-wrap gap-2 pt-2'>
                {block.fields.map((field) => (
                  <code
                    key={field}
                    className='bg-muted/60 rounded-md border px-2.5 py-1 font-mono text-xs'
                  >
                    {field}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      {/* Explicit Permission Model */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Explicit permissions instead of coarse admin flags'
            description='Segregation of duties is enforced server-side. Preparers can collect evidence, reviewers resolve exceptions, and partners execute final approvals.'
          />
        </div>
        <div className='overflow-x-auto border-t'>
          <table className='w-full min-w-[680px] border-collapse text-left'>
            <thead>
              <tr className='bg-muted/30 border-b text-xs uppercase tracking-wider'>
                <th className='px-6 py-4 font-semibold md:px-10'>Permission</th>
                <th className='px-6 py-4 font-semibold'>Capability Scope</th>
                <th className='px-4 py-4 text-center font-semibold'>Preparer</th>
                <th className='px-4 py-4 text-center font-semibold'>Reviewer</th>
                <th className='px-4 py-4 text-center font-semibold'>Partner</th>
              </tr>
            </thead>
            <tbody className='divide-y text-sm'>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.permission} className='hover:bg-muted/20 transition-colors'>
                  <td className='px-6 py-4 md:px-10'>
                    <code className='bg-muted rounded px-2 py-0.5 font-mono text-xs font-medium'>
                      {row.permission}
                    </code>
                  </td>
                  <td className='text-muted-foreground px-6 py-4'>{row.scope}</td>
                  <td className='px-4 py-4 text-center'>
                    {row.preparer ? (
                      <Icons.circleCheck className='mx-auto size-4 text-emerald-500' />
                    ) : (
                      <Icons.minus className='text-muted-foreground/40 mx-auto size-4' />
                    )}
                  </td>
                  <td className='px-4 py-4 text-center'>
                    {row.reviewer ? (
                      <Icons.circleCheck className='mx-auto size-4 text-emerald-500' />
                    ) : (
                      <Icons.minus className='text-muted-foreground/40 mx-auto size-4' />
                    )}
                  </td>
                  <td className='px-4 py-4 text-center'>
                    {row.partner ? (
                      <Icons.circleCheck className='mx-auto size-4 text-emerald-500' />
                    ) : (
                      <Icons.minus className='text-muted-foreground/40 mx-auto size-4' />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Frame>
      <DottedRule />

      {/* System Topology */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Modular, contract-first system topology'
            description='Built as a disciplined modular monolith with an isolated AI worker and full OpenTelemetry distributed tracing.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {TOPOLOGY.map((node, i) => (
            <div
              key={node.component}
              className={cn(
                'space-y-3 border-b p-6 md:p-8 lg:border-b-0',
                i < 3 && 'lg:border-r',
                i % 2 === 0 && 'sm:border-r'
              )}
            >
              <h3 className='text-base font-semibold'>{node.component}</h3>
              <p className='font-mono text-xs text-cyan-600 dark:text-cyan-400'>{node.tech}</p>
              <p className='text-muted-foreground text-sm leading-relaxed'>{node.role}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      {/* Next-Step Strip */}
      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>
            Ready to see how governed AI operates on top of this engine?
          </h2>
          <p className='text-muted-foreground text-sm'>
            Explore Avenra’s schema-validated Agent Intelligence and document reading pipeline.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/agent' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            Explore Agent Intelligence
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
