import type { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Pricing & Billing Mechanics | Avenra',
  description:
    'Compare Starter, Business, and Enterprise plans, inspect full capability limits, and understand Avenra’s trial, seat proration, and 7-day grace period guarantees.'
};

const COMPARISON_ROWS = [
  {
    feature: 'Active client engagements',
    starter: 'Up to 25',
    business: 'Unlimited',
    enterprise: 'Unlimited'
  },
  {
    feature: 'Included workspace seats',
    starter: '1 seat',
    business: '5 seats (+$25/extra)',
    enterprise: 'Unlimited seats'
  },
  {
    feature: 'Passwordless client portal links',
    starter: true,
    business: true,
    enterprise: true
  },
  {
    feature: 'Deterministic rule verification (ADR-024)',
    starter: true,
    business: true,
    enterprise: true
  },
  {
    feature: 'ClamAV malware scanning & SHA-256 vault',
    starter: '10 GB',
    business: '100 GB',
    enterprise: '1 TB+ (Dedicated S3)'
  },
  {
    feature: 'Multi-assignee Kanban & exception triage',
    starter: false,
    business: true,
    enterprise: true
  },
  {
    feature: 'Signed webhooks & S3 manifest exports',
    starter: false,
    business: true,
    enterprise: true
  },
  {
    feature: 'Custom verification rule authoring',
    starter: false,
    business: false,
    enterprise: true
  },
  {
    feature: 'SOC-2 Type II audit export packs & SLA',
    starter: false,
    business: false,
    enterprise: true
  }
];

const BILLING_GUARANTEES = [
  {
    title: 'Zero per-client surcharges',
    description:
      'Invite 20 or 2,000 external client contacts to submit documents via passwordless portal links. You never pay seat licenses for your clients.'
  },
  {
    title: '7-day payment grace period',
    description:
      'If a card expires or a bank transfer slips, your firm receives a 7-day grace window. Even after a pause, all historical evidence and audit trails stay readable.'
  },
  {
    title: 'Predictable AI token caps',
    description:
      'Every plan enforces hard daily and per-run AI limits configured by your workspace admin—eliminating surprise usage bills during peak tax season.'
  },
  {
    title: 'Enterprise procurement & invoicing',
    description:
      'Annual Enterprise agreements support ACH/wire invoicing, custom data-processing addenda (DPA), and dedicated S3 vault isolation.'
  }
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Icons.circleCheck className='mx-auto size-4 text-emerald-500' />
    ) : (
      <Icons.minus className='text-muted-foreground/40 mx-auto size-4' />
    );
  }
  return <span className='text-sm font-medium'>{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        pill='Pricing & Billing Policy'
        title='Transparent plans built for peak-season scale'
        description='Every plan includes tenant-isolated PostgreSQL RLS, ClamAV malware scanning, and passwordless client links—with zero per-client fees.'
        primaryAction={{ label: 'Start 14-day free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Read billing FAQ', href: '/faq' }}
      />
      <DottedRule />
      <PricingSection />
      <DottedRule />

      {/* Full Capability Matrix */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Complete capability & limit matrix'
            description='Compare limits across engagements, team seats, evidence storage, integrations, and enterprise compliance.'
          />
        </div>
        <div className='overflow-x-auto border-t'>
          <table className='w-full min-w-[640px] border-collapse text-left'>
            <thead>
              <tr className='bg-muted/30 border-b text-xs uppercase tracking-wider'>
                <th className='px-6 py-4 font-semibold md:px-10'>Capability</th>
                <th className='px-6 py-4 text-center font-semibold'>Starter</th>
                <th className='bg-accent/20 px-6 py-4 text-center font-semibold'>Business</th>
                <th className='px-6 py-4 text-center font-semibold'>Enterprise</th>
              </tr>
            </thead>
            <tbody className='divide-y text-sm'>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className='hover:bg-muted/20 transition-colors'>
                  <td className='text-muted-foreground px-6 py-4 font-medium md:px-10'>
                    {row.feature}
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <CellValue value={row.starter} />
                  </td>
                  <td className='bg-accent/10 px-6 py-4 text-center'>
                    <CellValue value={row.business} />
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <CellValue value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Frame>
      <DottedRule />

      {/* Billing Guarantees */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='How billing, seats, and data access work'
            description='Straightforward commercial terms designed for professional services practices.'
          />
        </div>
        <div className='grid border-t md:grid-cols-2'>
          {BILLING_GUARANTEES.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                'space-y-2 border-b p-6 md:p-10',
                i % 2 === 0 && 'md:border-r',
                i >= 2 && 'md:border-b-0'
              )}
            >
              <h3 className='text-lg font-medium'>{item.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row md:px-10'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-medium tracking-tight'>Have questions about Enterprise licensing?</h2>
          <p className='text-muted-foreground text-sm'>
            Check our searchable FAQ or launch a free Business trial workspace immediately.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/faq' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            Browse FAQ
          </Link>
          <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Start free trial <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
