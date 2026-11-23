import type { Metadata } from 'next';
import { Icons } from '@/components/icons';
import { FaqSection } from '@/features/landing/components/faq-section';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { PricingSection } from '@/features/landing/components/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing | Avenra',
  description:
    'Transparent, predictable pricing for accounting, audit, legal, and advisory firms. Start with a 14-day free trial—no card required.'
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
    feature: 'SHA-256 Cryptographic Evidence Vault',
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
        pill='Pricing & Plans'
        title='Simple pricing built for growing practices'
        description='Every plan starts with a full-featured free trial. No hidden per-client fees, no surprise overages, and your audit data always remains readable.'
        primaryAction={{ label: 'Start 14-day free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Explore the platform', href: '/platform' }}
      />
      <DottedRule />
      <PricingSection />
      <DottedRule />

      {/* Feature Comparison Matrix */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Compare plans side by side'
            description='Every tier runs on the same tenant-isolated, audited Avenra infrastructure.'
          />
        </div>
        <div className='overflow-x-auto border-t'>
          <table className='w-full min-w-[640px] border-collapse text-left'>
            <thead>
              <tr className='bg-muted/30 border-b text-xs tracking-wider uppercase'>
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
      <FaqSection />
    </>
  );
}
