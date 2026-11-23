import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, SectionHeading } from '@/features/landing/components/frame';
import { PageHero } from '@/features/landing/components/page-hero';
import { SOLUTION_LIST, SOLUTIONS } from '@/features/landing/solutions-content';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
  return SOLUTION_LIST.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = SOLUTIONS[slug];
  if (!solution) return { title: 'Solution | Avenra' };
  return {
    title: `${solution.title} | Avenra Solutions`,
    description: solution.description
  };
}

export default async function SolutionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = SOLUTIONS[slug];
  if (!solution) notFound();

  const otherSolutions = SOLUTION_LIST.filter((s) => s.slug !== solution.slug);

  return (
    <>
      <PageHero
        breadcrumb={{ label: 'Home', href: '/' }}
        pill={solution.pill}
        title={solution.headline}
        description={solution.description}
        primaryAction={{ label: 'Start free trial', href: '/auth/sign-up' }}
        secondaryAction={{ label: 'Explore the platform', href: '/platform' }}
      />
      <DottedRule />

      {/* Metrics Strip */}
      <Frame className='grid md:grid-cols-3'>
        {solution.metrics.map((metric, i) => (
          <div
            key={metric.label}
            className={cn(
              'space-y-3 border-b px-6 py-10 md:border-b-0 md:px-10',
              i < 2 && 'md:border-r'
            )}
          >
            <p className='text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase'>
              {metric.label}
            </p>
            <p className='text-4xl font-medium tracking-tight md:text-5xl'>{metric.value}</p>
            <p className='text-muted-foreground text-sm leading-relaxed'>{metric.detail}</p>
          </div>
        ))}
      </Frame>
      <DottedRule />

      {/* 4-Step Execution Workflow */}
      <Frame>
        <div className='px-6 py-14 md:px-10'>
          <SectionHeading
            title={`How Avenra runs ${solution.shortTitle.toLowerCase()} workflows`}
            description='Every engagement follows an explicit, verifiable lifecycle—eliminating inbox guesswork and last-minute bottlenecks.'
          />
        </div>
        <div className='grid border-t sm:grid-cols-2 lg:grid-cols-4'>
          {solution.workflow.map((item, i) => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.step}
                className={cn(
                  'space-y-4 border-b p-6 md:p-8 lg:border-b-0',
                  i < 3 && 'lg:border-r',
                  i % 2 === 0 && 'sm:border-r'
                )}
              >
                <div className='flex items-center justify-between'>
                  <span className='flex size-10 items-center justify-center rounded-md border'>
                    <Icon className='size-5' />
                  </span>
                  <span className='text-muted-foreground font-mono text-xs'>{item.step}</span>
                </div>
                <h3 className='text-lg font-medium'>{item.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
              </div>
            );
          })}
        </div>
      </Frame>
      <DottedRule />

      {/* Rules & Deliverables Split */}
      <Frame className='grid lg:grid-cols-2'>
        <div className='border-b p-6 md:p-10 lg:border-r lg:border-b-0'>
          <h2 className='text-2xl font-medium tracking-tight'>Deterministic verification rules</h2>
          <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
            Enforce your practice standards automatically the moment a client submits an answer or uploads a file.
          </p>
          <div className='mt-8 space-y-5'>
            {solution.rules.map((rule) => (
              <div key={rule.title} className='flex items-start gap-3'>
                <Icons.circleCheck className='mt-0.5 size-5 shrink-0 text-emerald-500' />
                <div className='space-y-1'>
                  <h3 className='text-sm font-medium'>{rule.title}</h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col justify-between p-6 md:p-10'>
          <div>
            <h2 className='text-2xl font-medium tracking-tight'>Common deliverables</h2>
            <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
              Ready-to-run engagement structures tailored for {solution.shortTitle.toLowerCase()} teams.
            </p>
            <ul className='mt-8 grid gap-3 sm:grid-cols-2'>
              {solution.deliverables.map((deliverable) => (
                <li
                  key={deliverable}
                  className='bg-muted/30 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm'
                >
                  <Icons.check className='size-4 shrink-0 text-cyan-500' />
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className='mt-10 flex flex-wrap items-center gap-3 border-t pt-6'>
            <Link href='/auth/sign-up' className={cn(buttonVariants(), 'h-10 gap-2 px-5')}>
              Start your 14-day free trial <Icons.arrowRight className='size-4' />
            </Link>
            <Link
              href='/pricing'
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}
            >
              Compare plans
            </Link>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Explore Other Solutions */}
      <Frame>
        <div className='px-6 py-10 md:px-10'>
          <h2 className='text-xl font-medium tracking-tight'>Explore other solutions</h2>
        </div>
        <div className='grid border-t md:grid-cols-3'>
          {otherSolutions.map((other, i) => {
            const Icon = Icons[other.icon];
            return (
              <Link
                key={other.slug}
                href={`/solutions/${other.slug}`}
                className={cn(
                  'group hover:bg-muted/30 flex flex-col justify-between space-y-4 border-b p-6 transition-colors md:border-b-0 md:p-8',
                  i < 2 && 'md:border-r'
                )}
              >
                <div className='space-y-3'>
                  <span className='flex size-9 items-center justify-center rounded-md border'>
                    <Icon className='size-4' />
                  </span>
                  <h3 className='text-base font-medium group-hover:underline'>{other.title}</h3>
                  <p className='text-muted-foreground line-clamp-2 text-sm'>{other.headline}</p>
                </div>
                <span className='text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 text-xs font-medium'>
                  View solution <Icons.arrowRight className='size-3.5' />
                </span>
              </Link>
            );
          })}
        </div>
      </Frame>
    </>
  );
}
