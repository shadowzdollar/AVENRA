import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/components/landing-page';
import { getSession } from '@/lib/auth/server';

export const metadata: Metadata = {
  title: { absolute: 'Avenra | Turn client requests into verified, completed work' },
  description:
    'Avenra collects information from clients, verifies it against your rules, chases what is missing and records every decision as evidence.'
};

export default async function Page() {
  // The landing page is public; signed-in visitors get a shortcut to their dashboard.
  const user = await getSession().catch(() => null);
  return <LandingPage signedIn={user !== null} />;
}
