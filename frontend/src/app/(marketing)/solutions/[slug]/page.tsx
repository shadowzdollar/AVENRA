import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SOLUTION_LIST, SOLUTIONS } from '@/features/landing/solutions-content';
import { SolutionExperience } from '@/features/marketing/solution-experience';

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
  return <SolutionExperience solution={solution} otherSolutions={otherSolutions} />;
}
