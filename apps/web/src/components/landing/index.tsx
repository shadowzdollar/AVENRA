import { Hero, TrustedBy } from "./Hero";
import { FinalCta, Footer, IntegrationsOrbit, Platform, Pricing, Testimonials, UseCases, Workflow } from "./Sections";

/** The public page, as designed in the Lovable prototype (ADR-039). */
export function Landing() {
  return (
    <main className="bg-background">
      <Hero />
      <TrustedBy />
      <Platform />
      <Workflow />
      <UseCases />
      <Testimonials />
      <IntegrationsOrbit />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  );
}
