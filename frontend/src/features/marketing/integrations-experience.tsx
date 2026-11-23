import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill, SectionHeading } from '@/features/landing/components/frame';
import { cn } from '@/lib/utils';

const ECOSYSTEM_CATEGORIES = [
  {
    icon: 'webhook' as const,
    title: 'Real-Time Lifecycle Webhooks',
    description:
      'Automatically notify your billing, CRM, or practice management software the moment a client uploads a document or a partner completes an engagement.'
  },
  {
    icon: 'fingerprint' as const,
    title: 'Cloud Storage & Archival Exports',
    description:
      'Export signed completion manifests and verified client evidence directly into AWS S3 or your firm’s enterprise document management archive.'
  },
  {
    icon: 'bellRinging' as const,
    title: 'Email & Team Notifications',
    description:
      'Deliver branded client request emails, polite automated follow-up reminders, and instant internal escalation alerts when exceptions need review.'
  },
  {
    icon: 'code' as const,
    title: 'Enterprise REST API',
    description:
      'Automate engagement creation, sync client rosters, and pull real-time compliance reporting using Avenra’s strongly-typed OpenAPI 3.1 interface.'
  }
];

const AUTOMATION_FLOWS = [
  {
    trigger: 'Engagement Completed',
    action: 'Archive verified workpapers to cloud storage & trigger client billing automatically.'
  },
  {
    trigger: 'Client Document Uploaded',
    action: 'Run automated screening, update engagement readiness, and notify the assigned preparer.'
  },
  {
    trigger: 'Verification Exception Flagged',
    action: 'Alert the review manager immediately so discrepancies are resolved days before filing.'
  },
  {
    trigger: 'Client Request Approaching Deadline',
    action: 'Dispatch scheduled reminders and escalate stalled items in your Command Center.'
  }
];

export function IntegrationsExperience() {
  return (
    <>
      {/* Executive Integrations Hero */}
      <Frame className='grid lg:grid-cols-[0.95fr_1.05fr]'>
        <div className='flex flex-col justify-center space-y-6 border-b px-6 py-16 md:px-10 lg:border-r lg:border-b-0 lg:py-20'>
          <div>
            <Pill>Connected Firm Infrastructure</Pill>
          </div>
          <h1 className='text-4xl font-medium tracking-tight text-balance md:text-5xl md:leading-[1.08]'>
            Connect Avenra seamlessly to your firm’s existing systems
          </h1>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Keep your ERP, document archive, billing platform, and internal alerts perfectly in sync with signed webhooks, automated retries, and structured archival exports.
          </p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-11 gap-2 px-6')}>
              Start 14-day free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link href='/contact' className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-6')}>
              Discuss custom integrations
            </Link>
          </div>
        </div>

        <div className='bg-muted/20 flex items-center justify-center p-6 md:p-10'>
          <div className='bg-card w-full overflow-hidden rounded-xl border p-1.5 shadow-2xl'>
            <Image
              src='/landing/notifications.webp'
              alt='Avenra automated notifications and integration workflow'
              width={1600}
              height={1000}
              className='h-auto w-full rounded-lg'
            />
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* 4 Integration Pillars */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Built to fit into your practice—not disrupt it'
            description='Every integration channel is cryptographically signed, monitored for delivery health, and auditable by your IT team.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {ECOSYSTEM_CATEGORIES.map((item, i) => {
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

      {/* Automated Workflow Outcomes */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title='Automate handoffs across every milestone'
            description='Eliminate manual re-entry between intake, workpapers, and downstream billing.'
          />
        </div>
        <div className='grid border-t md:grid-cols-2'>
          {AUTOMATION_FLOWS.map((flow, i) => (
            <div
              key={flow.trigger}
              className={cn(
                'space-y-2 border-b p-6 md:p-8',
                i % 2 === 0 && 'md:border-r',
                i >= 2 && 'md:border-b-0'
              )}
            >
              <div className='flex items-center gap-2'>
                <Icons.sparkles className='size-4 text-cyan-500' />
                <h3 className='text-base font-medium'>{flow.trigger}</h3>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>{flow.action}</p>
            </div>
          ))}
        </div>
      </Frame>
      <DottedRule />

      <Frame className='flex flex-col items-center justify-between gap-6 px-6 py-14 md:flex-row md:px-12'>
        <div className='space-y-1.5'>
          <h2 className='text-2xl font-medium tracking-tight'>
            Need help connecting Avenra to your firm’s ERP or document repository?
          </h2>
          <p className='text-muted-foreground text-sm'>
            Our implementation engineers partner directly with your IT team on Enterprise plans.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/docs' className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
            Read API documentation
          </Link>
          <Link href='/contact' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
            Talk to our team <Icons.arrowRight className='size-4' />
          </Link>
        </div>
      </Frame>
    </>
  );
}
