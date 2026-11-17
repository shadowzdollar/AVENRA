import '../landing.css';
import { AgentSection } from './agent-section';
import {
  ComparisonSection,
  CtaSection,
  IntegrationsSection,
  StatsSection,
  TrustSection
} from './closing-sections';
import { FaqSection, FloatingHelp } from './faq-section';
import { DottedRule } from './frame';
import { Hero } from './hero';
import { CapabilityMarquee } from './marquee';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { UnifiedSystem } from './unified-system';
import { WorkspaceGallery } from './workspace-gallery';

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className='bg-background text-foreground min-h-screen overflow-x-clip'>
      <SiteHeader signedIn={signedIn} />
      <DottedRule />
      <main>
        <Hero />
        <CapabilityMarquee />
        <DottedRule />
        <UnifiedSystem />
        <DottedRule />
        <WorkspaceGallery />
        <DottedRule />
        <AgentSection />
        <DottedRule />
        <IntegrationsSection />
        <DottedRule />
        <StatsSection />
        <DottedRule />
        <ComparisonSection />
        <DottedRule />
        <TrustSection />
        <DottedRule />
        <FaqSection />
        <DottedRule />
        <CtaSection />
        <DottedRule />
      </main>
      <SiteFooter />
      <FloatingHelp />
    </div>
  );
}
