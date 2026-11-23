import '@/features/landing/landing.css';
import { FloatingHelp } from '@/features/landing/components/faq-section';
import { DottedRule } from '@/features/landing/components/frame';
import { SiteFooter } from '@/features/landing/components/site-footer';
import { SiteHeader } from '@/features/landing/components/site-header';
import { getSession } from '@/lib/auth/server';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession().catch(() => null);

  return (
    <div className='bg-background text-foreground min-h-screen overflow-x-clip'>
      <SiteHeader signedIn={user !== null} />
      <DottedRule />
      <main>{children}</main>
      <DottedRule />
      <SiteFooter />
      <FloatingHelp />
    </div>
  );
}
