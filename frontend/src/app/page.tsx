import { SiteHeader } from '@/components/landing/site-header';
import { HeroSection } from '@/components/landing/hero-section';
import { FloatingChat } from '@/components/landing/floating-chat';

export const metadata = {
  title: 'Build admin panel better with the complete shadcn dashboard kit',
  description:
    'A production-ready shadcn dashboard kit with reusable UI blocks, components, and built-in AI prompts for React, Next.js, TypeScript, Tailwind CSS, and Supabase.'
};

export default function HomePage() {
  return (
    <div className='min-h-screen bg-black text-white selection:bg-neutral-800 selection:text-white flex flex-col font-sans antialiased overflow-x-hidden'>
      <SiteHeader />
      <main className='flex-1'>
        <HeroSection />
      </main>
      <FloatingChat />
    </div>
  );
}
