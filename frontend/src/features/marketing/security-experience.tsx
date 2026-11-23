import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const PILLARS = [
  {
    icon: 'lock' as const,
    title: 'Dedicated Multi-Tenant Isolation',
    description:
      'Every firm’s workspace is strictly isolated at the database layer. Organization boundaries are enforced server-side on every request and continuously verified by automated security tests.'
  },
  {
    icon: 'warning' as const,
    title: 'Automated Malware & Threat Screening',
    description:
      'Every client upload is scanned in real time before entering your vault—protecting partners and staff from infected attachments and malformed documents.'
  },
  {
    icon: 'fingerprint' as const,
    title: 'Tamper-Evident Evidence Vault',
    description:
      'Accepted client files and reviewer decisions are cryptographically fingerprinted with SHA-256 and stored in an append-only audit ledger built for regulatory inspection.'
  },
  {
    icon: 'users' as const,
    title: 'Granular Role & Approval Controls',
    description:
      'Enforce strict segregation of duties across preparers, managers, and signing partners. High-risk actions and final approvals require explicit permission.'
  }
];

const ASSURANCE_ITEMS = [
  {
    category: 'Data Encryption',
    detail: 'TLS 1.3 encryption in transit and AES-256 encryption at rest across databases and document storage.'
  },
  {
    category: 'Client Portal Access',
    detail: 'Single-purpose, expiring client links scoped to one engagement with instant revocation controls.'
  },
  {
    category: 'AI Data Privacy',
    detail: 'Zero retention for third-party model training; client documents remain strictly within your workspace boundary.'
  },
  {
    category: 'Audit & Retention',
    detail: 'Complete chronological log of every upload, rule outcome, exception override, and partner approval.'
  },
  {
    category: 'Abuse & Rate Protection',
    detail: 'Automated rate limiting, CSRF protection, and anomaly detection guarding all public and authenticated routes.'
  },
  {
    category: 'Enterprise Procurement',
    detail: 'Dedicated Data Processing Addenda (DPA), security review packages, and isolated storage options.'
  }
];

export function SecurityExperience() {
  return (
    <>
      {/* Executive Trust Hero */}
      <Frame className='grid lg:grid-cols-[1fr_1fr]'>
        <div className='flex flex-col justify-center space-y-6 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0 lg:py-20'>
          <div>
            <Pill>Avenra Trust & Security Center</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            Enterprise security built for confidential client engagements
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Accounting, audit, and legal firms entrust Avenra with their most sensitive financial records. Our architecture enforces isolation, encryption, malware screening, and immutable auditability at every layer.
          </p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Link href='/contact' className={cn(buttonVariants(), 'h-11 gap-2 px-6')}>
              Request security package <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/auth/sign-up' className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-6')}>
              Start free trial
            </Link>
          </div>
        </div>

        <div className='bg-muted/20 flex items-center justify-center p-6 md:p-10'>
          <div className='bg-card w-full overflow-hidden rounded-xl border p-1.5 shadow-2xl'>
            <Image
              src='/landing/evidence-vault.webp'
              alt='Avenra Evidence Vault showing verified documents and audit trail'
              width={1600}
              height={1000}
              className='h-auto w-full rounded-lg'
            />
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* 4 Enterprise Security Pillars */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Four non-negotiable layers of protection'
            description='Security is engineered directly into Avenra’s data model—not bolted on as an afterthought.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {PILLARS.map((pillar, i) => {
            const Icon = Icons[pillar.icon];
            return (
              <div
                key={pillar.title}
                className={cn(
                  'space-y-3 border-b p-6 md:p-8 lg:border-b-0',
                  i < 3 && 'lg:border-r',
                  i % 2 === 0 && 'sm:border-r'
                )}
              >
                <span className='flex size-10 items-center justify-center rounded-md border'>
                  <Icon className='size-5' />
                </span>
                <h3 className='text-lg font-medium'>{pillar.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </Frame>
      <DottedRule />

      {/* Security & Compliance Assurance Grid */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Built for firm IT teams and external compliance reviews'
            description='Clear technical safeguards designed to pass enterprise vendor security assessments quickly.'
          />
        </div>
        <div className='grid border-t md:grid-cols-2 lg:grid-cols-3'>
          {ASSURANCE_ITEMS.map((item, i) => (
            <div
              key={item.category}
              className={cn(
                'space-y-2 border-b p-6 md:p-8',
                i % 3 !== 2 && 'lg:border-r',
                i >= 3 && 'lg:border-b-0'
              )}
            >
              <div className='flex items-center gap-2'>
                <Icons.circleCheck className='size-4 text-emerald-500' />
                <h3 className='text-base font-medium'>{item.category}</h3>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>{item.detail}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-14 md:flex-row md:px-12'>
        <div className='space-y-1.5'>
          <h2 className='text-2xl font-medium tracking-tight'>
            Need our Security Brief or Data Processing Addendum?
          </h2>
          <p className='text-muted-foreground text-sm'>
            Our security team works directly with your IT and compliance officers during evaluation.
          </p>
        </div>
        <Link href='/contact' className={cn(buttonVariants(), 'h-10 gap-2 px-6')}>
          Contact security team <Icons.arrowRight className='size-4' />
        </Link>
      </Frame>
    </>
  );
}
